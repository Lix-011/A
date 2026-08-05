const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, '../data.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_stats (
    userId TEXT PRIMARY KEY,
    messages INTEGER NOT NULL DEFAULT 0,
    presenceSeconds INTEGER NOT NULL DEFAULT 0,
    supportVcSeconds INTEGER NOT NULL DEFAULT 0,
    modActions INTEGER NOT NULL DEFAULT 0,
    events INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS voice_sessions (
    userId TEXT PRIMARY KEY,
    channelId TEXT NOT NULL,
    joinedAt INTEGER NOT NULL,
    isSupportVc INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    taskKey TEXT,
    taskText TEXT,
    date TEXT,
    completed INTEGER DEFAULT 0,
    messageId TEXT
  );
`);

function ensureRow(userId) {
  db.prepare(`INSERT OR IGNORE INTO admin_stats (userId) VALUES (?)`).run(userId);
}

module.exports = {
  // --- إحصائيات الإداريين ---
  addMessage(userId) {
    ensureRow(userId);
    db.prepare(`UPDATE admin_stats SET messages = messages + 1 WHERE userId = ?`).run(userId);
  },

  addVoiceSeconds(userId, seconds, isSupportVc) {
    ensureRow(userId);
    if (isSupportVc) {
      db.prepare(`UPDATE admin_stats SET supportVcSeconds = supportVcSeconds + ? WHERE userId = ?`).run(seconds, userId);
    } else {
      db.prepare(`UPDATE admin_stats SET presenceSeconds = presenceSeconds + ? WHERE userId = ?`).run(seconds, userId);
    }
  },

  addModAction(userId, count = 1) {
    ensureRow(userId);
    db.prepare(`UPDATE admin_stats SET modActions = modActions + ? WHERE userId = ?`).run(count, userId);
  },

  addEvent(userId, count = 1) {
    ensureRow(userId);
    db.prepare(`UPDATE admin_stats SET events = events + ? WHERE userId = ?`).run(count, userId);
  },

  getStats(userId) {
    ensureRow(userId);
    return db.prepare(`SELECT * FROM admin_stats WHERE userId = ?`).get(userId);
  },

  getAllStats() {
    return db.prepare(`SELECT * FROM admin_stats`).all();
  },

  resetStats(userId) {
    db.prepare(`
      UPDATE admin_stats
      SET messages = 0, presenceSeconds = 0, supportVcSeconds = 0, modActions = 0, events = 0
      WHERE userId = ?
    `).run(userId);
  },

  resetAll() {
    db.prepare(`
      UPDATE admin_stats
      SET messages = 0, presenceSeconds = 0, supportVcSeconds = 0, modActions = 0, events = 0
    `).run();
  },

  startVoiceSession(userId, channelId, isSupportVc) {
    db.prepare(`
      INSERT INTO voice_sessions (userId, channelId, joinedAt, isSupportVc)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(userId) DO UPDATE SET channelId = excluded.channelId, joinedAt = excluded.joinedAt, isSupportVc = excluded.isSupportVc
    `).run(userId, channelId, Date.now(), isSupportVc ? 1 : 0);
  },

  endVoiceSession(userId) {
    const session = db.prepare(`SELECT * FROM voice_sessions WHERE userId = ?`).get(userId);
    if (session) {
      db.prepare(`DELETE FROM voice_sessions WHERE userId = ?`).run(userId);
    }
    return session;
  },

  // --- المهام اليومية ---
  assignDailyTask(userId, taskKey, taskText, date) {
    return db.prepare('INSERT INTO daily_tasks (userId, taskKey, taskText, date) VALUES (?, ?, ?, ?)')
      .run(userId, taskKey, taskText, date).lastInsertRowid;
  },

  setTaskMessageId(taskId, messageId) {
    db.prepare('UPDATE daily_tasks SET messageId = ? WHERE id = ?').run(messageId, taskId);
  },

  getTasksByDate(date) {
    return db.prepare('SELECT * FROM daily_tasks WHERE date = ?').all(date);
  },

  completeTask(taskId) {
    return db.prepare('UPDATE daily_tasks SET completed = 1 WHERE id = ?').run(taskId).changes > 0;
  },

  getTaskById(taskId) {
    return db.prepare('SELECT * FROM daily_tasks WHERE id = ?').get(taskId);
  },
};
