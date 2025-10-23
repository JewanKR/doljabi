CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    winner_id INTEGER,
    rule TEXT NOT NULL, -- 'baduk' or 'omok'
    start_time TEXT DEFAULT CURRENT_TIMESTAMP,
    end_time TEXT,
    handicap INTEGER DEFAULT 0,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    move_number INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    color TEXT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

