const Database = require('better-sqlite3');
const path = require('path');

// إنشاء أو فتح قاعدة البيانات
const db = new Database(path.join(__dirname, '../../tasks.db'));

// إنشاء الجداول إذا لم تكن موجودة
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    taskKey TEXT,
    taskText TEXT,
    date TEXT,
    completed INTEGER DEFAULT 0,
    messageId TEXT
  )
`);

module.exports = {
  // توزيع مهمة جديدة
  assignDailyTask(userId, taskKey, taskText, date) {
    const stmt = db.prepare(
      'INSERT INTO daily_tasks (userId, taskKey, taskText, date) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(userId, taskKey, taskText, date);
    return info.lastInsertRowid;
  },

  // ربط معرف الرسالة بالمهمة
  setTaskMessageId(taskId, messageId) {
    const stmt = db.prepare('UPDATE daily_tasks SET messageId = ? WHERE id = ?');
    stmt.run(messageId, taskId);
  },

  // جلب المهام حسب التاريخ (يستخدم في الإحصائيات)
  getTasksByDate(date) {
    const stmt = db.prepare('SELECT * FROM daily_tasks WHERE date = ?');
    return stmt.all(date);
  },

  // تحديث حالة المهمة إلى منجزة
  completeTask(taskId) {
    const stmt = db.prepare('UPDATE daily_tasks SET completed = 1 WHERE id = ?');
    const info = stmt.run(taskId);
    return info.changes > 0;
  },

  // دالة جديدة: جلب بيانات مهمة محددة بواسطة الأيدي
  getTaskById(taskId) {
    const stmt = db.prepare('SELECT * FROM daily_tasks WHERE id = ?');
    return stmt.get(taskId);
  }
};
