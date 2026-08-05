const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../tasks.db'));
db.exec(`CREATE TABLE IF NOT EXISTS daily_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT, taskKey TEXT, taskText TEXT, date TEXT, completed INTEGER DEFAULT 0, messageId TEXT)`);
module.exports = {
  assignDailyTask(userId, taskKey, taskText, date) { return db.prepare('INSERT INTO daily_tasks (userId, taskKey, taskText, date) VALUES (?, ?, ?, ?)').run(userId, taskKey, taskText, date).lastInsertRowid; },
  setTaskMessageId(taskId, messageId) { db.prepare('UPDATE daily_tasks SET messageId = ? WHERE id = ?').run(messageId, taskId); },
  getTasksByDate(date) { return db.prepare('SELECT * FROM daily_tasks WHERE date = ?').all(date); },
  completeTask(taskId) { return db.prepare('UPDATE daily_tasks SET completed = 1 WHERE id = ?').run(taskId).changes > 0; },
  getTaskById(taskId) { return db.prepare('SELECT * FROM daily_tasks WHERE id = ?').get(taskId); }
};
