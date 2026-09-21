// 系統修復師：成績與排行榜 API（Express + better-sqlite3）
// 用法（在 KeyAgent 的 server.js 加兩行）：
//   const sysfix = require('./sysfix-router');
//   app.use('/api/sysfix', sysfix(db));   // db 是 better-sqlite3 的資料庫物件
// 若你的專案用的是 sqlite3 套件，請告訴我，我幫你改寫。
const express = require('express');

module.exports = (db) => {
  const r = express.Router();
  r.use(express.json());

  db.exec(`CREATE TABLE IF NOT EXISTS sysfix_results(
    sid TEXT NOT NULL, name TEXT, world INTEGER NOT NULL, mode TEXT NOT NULL,
    stars INTEGER DEFAULT 0, score INTEGER DEFAULT 0, updated TEXT,
    PRIMARY KEY(sid, world, mode))`);

  // 只保留每個學生每個任務的最高星星與最高分數
  const upsert = db.prepare(`
    INSERT INTO sysfix_results(sid,name,world,mode,stars,score,updated)
    VALUES(@sid,@name,@world,@mode,@stars,@score,datetime('now','localtime'))
    ON CONFLICT(sid,world,mode) DO UPDATE SET
      name=excluded.name,
      stars=MAX(sysfix_results.stars, excluded.stars),
      score=MAX(sysfix_results.score, excluded.score),
      updated=excluded.updated`);

  r.post('/result', (req, res) => {
    const b = req.body || {};
    const sid = String(b.sid || '').slice(0, 40);
    if (!sid) return res.status(400).json({ error: 'sid required' });
    upsert.run({
      sid,
      name: String(b.name || '').slice(0, 20),
      world: (+b.world | 0),
      mode: String(b.mode || '').slice(0, 10),
      stars: Math.min(3, Math.max(0, +b.stars | 0)),
      score: Math.min(999999, Math.max(0, +b.score | 0)),
    });
    res.json({ ok: true });
  });

  // 取得某位學生的全部進度
  r.get('/progress', (req, res) => {
    const sid = String(req.query.sid || '');
    res.json(db.prepare('SELECT world,mode,stars,score FROM sysfix_results WHERE sid=?').all(sid));
  });

  // 排行榜前 10 名（預設無盡模式）
  r.get('/leaderboard', (req, res) => {
    const world = +req.query.world | 0;
    const mode = String(req.query.mode || 'end');
    res.json(db.prepare(
      `SELECT sid,name,score FROM sysfix_results
       WHERE world=? AND mode=? AND score>0 ORDER BY score DESC LIMIT 10`).all(world, mode));
  });

  return r;
};
