// integration.js

// IndexedDB-oppsett
const DB_NAME = 'breakout-persist';
const STORE   = 'dbenv';
async function openIDB() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open(DB_NAME, 1);
    rq.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    rq.onsuccess  = () => res(rq.result);
    rq.onerror    = () => rej(rq.error);
  });
}
async function saveDb(name, data) {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(data, name);
    tx.oncomplete = () => res();
    tx.onerror    = () => rej(tx.error);
  });
}
async function loadDb(name) {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE,'readonly');
    const rq = tx.objectStore(STORE).get(name);
    rq.onsuccess = () => res(rq.result);
    rq.onerror   = () => rej(rq.error);
  });
}

// SQL.js-init og DB-oppsett
let SQL, persistDb;
(async () => {
  SQL = await initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  // Last eller init DB
  const saved = await loadDb('breakout-db').catch(()=>null);
  if (saved) {
    persistDb = new SQL.Database(new Uint8Array(saved));
  } else {
    persistDb = new SQL.Database();
  }

  // Opprett game_state-tabell
  persistDb.run(`
    CREATE TABLE IF NOT EXISTS game_state (
      username TEXT PRIMARY KEY,
      ball_x    REAL,
      ball_y    REAL,
      paddle_x  REAL,
      lives     INTEGER,
      score     INTEGER
    );
  `);

  // Login-knapp
  document.getElementById('login-btn').onclick = async () => {
    const inp = document.getElementById('username');
    const user = inp.value.trim();
    if (!user) return alert('Skriv inn brukernavn');
    window.player = user;

    // 1) Auto-registrer bruker (ignorer 409)
    try {
      await fetch('register.php', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username: user, password: '' })
      });
    } catch {}

    // 2) Hent gjennomsnittspoeng fra login.php
    try {
      const res = await fetch('login.php', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username: user, password: '' })
      });
      if (res.ok) {
        const js = await res.json();
        document.getElementById('avg-score').textContent = js.avg_score;
        document.getElementById('avg-container').style.display = '';
      }
    } catch {}

    // 3) Last lokal spilltilstand
    const result = persistDb.exec(
      `SELECT * FROM game_state WHERE username = ?`, [user]
    );
    if (result.length) {
      const row = result[0].values[0];
      window.__persistState = {
        ball_x:   row[1],
        ball_y:   row[2],
        paddle_x: row[3],
        lives:    row[4],
        score:    row[5]
      };
    }

    // 4) Vis spill og stats
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('avg-container').style.display  = '';
    document.getElementById('stats').style.display          = '';
    document.getElementById('myCanvas').style.display        = '';

    // 5) Start spillet
    window.startGame();
  };

  // Eksporter funksjon for å lagre state
  window.__saveState = () => {
    const s = window.__currentState;
    const stmt = persistDb.prepare(`
      INSERT INTO game_state(username,ball_x,ball_y,paddle_x,lives,score)
      VALUES (:user,:ball_x,:ball_y,:paddle_x,:lives,:score)
      ON CONFLICT(username) DO UPDATE SET
        ball_x=:ball_x,ball_y=:ball_y,
        paddle_x=:paddle_x,lives=:lives,score=:score;
    `);
    stmt.bind({
      user: window.player,
      ...s
    });
    stmt.step(); stmt.free();

    const bytes = persistDb.export();
    saveDb('breakout-db', bytes);
  };
})();
