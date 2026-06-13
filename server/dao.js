// server/dao.js
 
import db from './db.js';
import crypto from 'crypto';
 
/**
 * Convert sqlite callback style into Promise style.
 * Use this for SELECT queries that return multiple rows.
 */
export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
 
/**
 * Use this for SELECT queries that return one row.
 */
export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
 
/**
 * Use this for INSERT, UPDATE, DELETE.
 */
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else {
        resolve({
          id: this.lastID,
          changes: this.changes,
        });
      }
    });
  });
}
 
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
 
export async function initDB() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS line_stations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (line_id) REFERENCES lines(id),
      FOREIGN KEY (station_id) REFERENCES stations(id),
      UNIQUE(line_id, station_id)
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station1_id INTEGER NOT NULL,
      station2_id INTEGER NOT NULL,
      line_id INTEGER NOT NULL,
      FOREIGN KEY (station1_id) REFERENCES stations(id),
      FOREIGN KEY (station2_id) REFERENCES stations(id),
      FOREIGN KEY (line_id) REFERENCES lines(id),
      UNIQUE(station1_id, station2_id, line_id)
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      coin_effect INTEGER NOT NULL CHECK (coin_effect >= -4 AND coin_effect <= 4)
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_station_id INTEGER NOT NULL,
      destination_station_id INTEGER NOT NULL,
      initial_coins INTEGER NOT NULL DEFAULT 20,
      final_score INTEGER,
      status TEXT NOT NULL DEFAULT 'created',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (start_station_id) REFERENCES stations(id),
      FOREIGN KEY (destination_station_id) REFERENCES stations(id)
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS planned_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      segment_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (segment_id) REFERENCES segments(id),
      UNIQUE(game_id, position)
    )
  `);
 
  await dbRun(`
    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      segment_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      coins_before INTEGER NOT NULL,
      coins_after INTEGER NOT NULL,
      FOREIGN KEY (game_id) REFERENCES games(id),
      FOREIGN KEY (segment_id) REFERENCES segments(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )
  `);
 
  console.log('Database tables created.');
}
 
export async function seedDB() {
  const existingUsers = await dbGet('SELECT COUNT(*) AS count FROM users');
 
  if (existingUsers.count > 0) {
    console.log('Database already seeded.');
    return;
  }
 
  console.log('Seeding database...');
 
  // Users
  const users = [
    { username: 'alice', password: 'password' },
    { username: 'bob', password: 'password' },
    { username: 'carol', password: 'password' },
  ];
 
  for (const user of users) {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(user.password, salt);
 
    await dbRun(
      'INSERT INTO users (username, password_hash, salt) VALUES (?, ?, ?)',
      [user.username, passwordHash, salt]
    );
  }
 
  // Lines
  const lines = [
    { name: 'Red Line', color: 'red' },
    { name: 'Blue Line', color: 'blue' },
    { name: 'Green Line', color: 'green' },
    { name: 'Yellow Line', color: 'gold' },
  ];
 
  for (const line of lines) {
    await dbRun(
      'INSERT INTO lines (name, color) VALUES (?, ?)',
      [line.name, line.color]
    );
  }
 
  // Stations
  const stationNames = [
    'Centrale',
    'Porta Velaria',
    'Crocevia del Falco',
    'Piazza delle Lanterne',
    'Fontana Oscura',
    'Borgo Sereno',
    'Viale dei Mosaici',
    'Torre Cinerea',
    "Campo dell'Eco",
    'Mercato Antico',
    'Giardini Nebbia',
    'Arco Solare',
  ];
 
  for (const name of stationNames) {
    await dbRun(
      'INSERT INTO stations (name) VALUES (?)',
      [name]
    );
  }
 
  const allLines = await dbAll('SELECT * FROM lines');
  const allStations = await dbAll('SELECT * FROM stations');
 
  const lineId = (name) => allLines.find((line) => line.name === name).id;
  const stationId = (name) => allStations.find((station) => station.name === name).id;
 
  // Line station order
  const lineStations = {
    'Red Line': [
      'Centrale',
      'Porta Velaria',
      'Crocevia del Falco',
      'Piazza delle Lanterne',
    ],
    'Blue Line': [
      'Centrale',
      'Fontana Oscura',
      'Borgo Sereno',
      'Viale dei Mosaici',
      'Arco Solare',
    ],
    'Green Line': [
      'Fontana Oscura',
      'Torre Cinerea',
      "Campo dell'Eco",
      'Giardini Nebbia',
    ],
    'Yellow Line': [
      'Torre Cinerea',
      'Viale dei Mosaici',
      "Campo dell'Eco",
      'Mercato Antico',
    ],
  };
 
  for (const [lineName, stations] of Object.entries(lineStations)) {
    const currentLineId = lineId(lineName);
 
    for (let i = 0; i < stations.length; i++) {
      await dbRun(
        'INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)',
        [currentLineId, stationId(stations[i]), i + 1]
      );
    }
  }
 
  // Segments: consecutive stations on each line
  for (const [lineName, stations] of Object.entries(lineStations)) {
    const currentLineId = lineId(lineName);
 
    for (let i = 0; i < stations.length - 1; i++) {
      const s1 = stationId(stations[i]);
      const s2 = stationId(stations[i + 1]);
 
      await dbRun(
        'INSERT INTO segments (station1_id, station2_id, line_id) VALUES (?, ?, ?)',
        [s1, s2, currentLineId]
      );
    }
  }
 
  // Events
  const events = [
    { description: 'Quiet journey', coin_effect: 0 },
    { description: 'Wrong platform', coin_effect: -2 },
    { description: 'Kind passenger', coin_effect: 1 },
    { description: 'Lost ticket', coin_effect: -3 },
    { description: 'Lucky shortcut', coin_effect: 2 },
    { description: 'Crowded train', coin_effect: -1 },
    { description: 'Found coins', coin_effect: 3 },
    { description: 'Station delay', coin_effect: -4 },
    { description: 'Perfect connection', coin_effect: 4 },
  ];
 
  for (const event of events) {
    await dbRun(
      'INSERT INTO events (description, coin_effect) VALUES (?, ?)',
      [event.description, event.coin_effect]
    );
  }
 
  // Past games, so the ranking is populated on a fresh clone.
  // The DB requirements ask for at least 2 users who already played.
  const allUsers = await dbAll('SELECT * FROM users');
  const userId = (username) => allUsers.find((user) => user.username === username).id;
 
  const pastGames = [
    { username: 'alice', start: 'Centrale',       destination: 'Piazza delle Lanterne', finalScore: 26 },
    { username: 'alice', start: 'Fontana Oscura', destination: 'Arco Solare',           finalScore: 19 },
    { username: 'bob',   start: 'Porta Velaria',  destination: "Campo dell'Eco",        finalScore: 31 },
    { username: 'bob',   start: 'Centrale',       destination: 'Viale dei Mosaici',     finalScore: 14 },
    { username: 'carol', start: 'Mercato Antico', destination: 'Borgo Sereno',          finalScore: 22 },
  ];
 
  for (const game of pastGames) {
    await dbRun(
      `INSERT INTO games
         (user_id, start_station_id, destination_station_id, initial_coins, final_score, status)
       VALUES (?, ?, ?, ?, ?, 'completed')`,
      [
        userId(game.username),
        stationId(game.start),
        stationId(game.destination),
        20,
        game.finalScore,
      ]
    );
  }
 
  console.log('Database seeded.');
}
 
export async function getNetwork() {
  const stations = await dbAll(`
    SELECT *
    FROM stations
    ORDER BY id
  `);

  const segments = await dbAll(`
    SELECT
      seg.id,
      l.name AS line_name,
      s1.name AS station1_name,
      s2.name AS station2_name
    FROM segments seg
    JOIN lines l ON seg.line_id = l.id
    JOIN stations s1 ON seg.station1_id = s1.id
    JOIN stations s2 ON seg.station2_id = s2.id
    ORDER BY seg.id
  `);

  return {
    stations,
    segments,
  };
}
 
export async function getUserByUsername(username) {
  return await dbGet(
    `
    SELECT *
    FROM users
    WHERE username = ?
    `,
    [username]
  );
}
 
export async function getUserById(id) {
  return await dbGet(
    `
    SELECT id, username
    FROM users
    WHERE id = ?
    `,
    [id]
  );
}
 
export function checkPassword(password, user) {
  const hashedPassword = hashPassword(password, user.salt);
  return hashedPassword === user.password_hash;
}
 
function buildAdjacencyList(segments) {
  const graph = new Map();
 
  for (const segment of segments) {
    if (!graph.has(segment.station1_id)) {
      graph.set(segment.station1_id, []);
    }
 
    if (!graph.has(segment.station2_id)) {
      graph.set(segment.station2_id, []);
    }
 
    graph.get(segment.station1_id).push(segment.station2_id);
    graph.get(segment.station2_id).push(segment.station1_id);
  }
 
  return graph;
}
 
function shortestDistance(graph, startId, destinationId) {
  const queue = [{ stationId: startId, distance: 0 }];
  const visited = new Set([startId]);
 
  while (queue.length > 0) {
    const current = queue.shift();
 
    if (current.stationId === destinationId) {
      return current.distance;
    }
 
    const neighbours = graph.get(current.stationId) || [];
 
    for (const neighbour of neighbours) {
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push({
          stationId: neighbour,
          distance: current.distance + 1,
        });
      }
    }
  }
 
  return Infinity;
}
 
export async function createGame(userId) {
  const stations = await dbAll(`
    SELECT *
    FROM stations
    ORDER BY id
  `);
 
  const segments = await dbAll(`
    SELECT *
    FROM segments
  `);
 
  const graph = buildAdjacencyList(segments);
 
  const possiblePairs = [];
 
  for (const start of stations) {
    for (const destination of stations) {
      if (start.id === destination.id) {
        continue;
      }
 
      const distance = shortestDistance(graph, start.id, destination.id);
 
      if (distance >= 3 && distance !== Infinity) {
        possiblePairs.push({
          start,
          destination,
          distance,
        });
      }
    }
  }
 
  if (possiblePairs.length === 0) {
    throw new Error('No valid start/destination pairs found');
  }
 
  const randomPair =
    possiblePairs[Math.floor(Math.random() * possiblePairs.length)];
 
  const result = await dbRun(
    `
    INSERT INTO games (
      user_id,
      start_station_id,
      destination_station_id,
      initial_coins,
      status
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      randomPair.start.id,
      randomPair.destination.id,
      20,
      'created',
    ]
  );
 
  return {
    id: result.id,
    user_id: userId,
    startStation: randomPair.start,
    destinationStation: randomPair.destination,
    minimumDistance: randomPair.distance,
    initialCoins: 20,
    status: 'created',
  };
}
 
export async function getGameById(gameId, userId) {
  const game = await dbGet(
    `
    SELECT
      g.id,
      g.user_id,
      g.start_station_id,
      start.name AS start_station_name,
      g.destination_station_id,
      dest.name AS destination_station_name,
      g.initial_coins,
      g.final_score,
      g.status,
      g.created_at
    FROM games g
    JOIN stations start ON g.start_station_id = start.id
    JOIN stations dest ON g.destination_station_id = dest.id
    WHERE g.id = ?
      AND g.user_id = ?
    `,
    [gameId, userId]
  );
 
  if (!game) {
    return null;
  }
 
  return {
    id: game.id,
    user_id: game.user_id,
    startStation: {
      id: game.start_station_id,
      name: game.start_station_name,
    },
    destinationStation: {
      id: game.destination_station_id,
      name: game.destination_station_name,
    },
    initialCoins: game.initial_coins,
    finalScore: game.final_score,
    status: game.status,
    createdAt: game.created_at,
  };
}
 
export async function planGameRoute(gameId, userId, segmentIds) {
  if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
    return {
      valid: false,
      error: 'Route must contain at least one segment',
    };
  }

  const uniqueSegmentIds = new Set(segmentIds);

  if (uniqueSegmentIds.size !== segmentIds.length) {
    return {
      valid: false,
      error: 'A segment cannot be selected more than once',
    };
  }

  const game = await dbGet(
    `
    SELECT *
    FROM games
    WHERE id = ?
      AND user_id = ?
    `,
    [gameId, userId]
  );

  if (!game) {
    return {
      valid: false,
      error: 'Game not found',
      statusCode: 404,
    };
  }

  if (game.status !== 'created' && game.status !== 'planned') {
    return {
      valid: false,
      error: 'This game cannot be planned anymore',
    };
  }

  const placeholders = segmentIds.map(() => '?').join(',');

  const segments = await dbAll(
    `
    SELECT
      seg.id,
      seg.station1_id,
      s1.name AS station1_name,
      seg.station2_id,
      s2.name AS station2_name,
      seg.line_id,
      l.name AS line_name
    FROM segments seg
    JOIN stations s1 ON seg.station1_id = s1.id
    JOIN stations s2 ON seg.station2_id = s2.id
    JOIN lines l ON seg.line_id = l.id
    WHERE seg.id IN (${placeholders})
    `,
    segmentIds
  );

  if (segments.length !== segmentIds.length) {
    return {
      valid: false,
      error: 'One or more selected segments do not exist',
    };
  }

  const segmentMap = new Map();

  for (const segment of segments) {
    segmentMap.set(segment.id, segment);
  }

  const allStations = await dbAll('SELECT id, name FROM stations');
  const nameOf = (stationId) => {
    const station = allStations.find((s) => s.id === stationId);
    return station ? station.name : `station #${stationId}`;
  };

  let currentStationId = game.start_station_id;
  let previousLineId = null;

  const orientedRoute = [];

  for (let i = 0; i < segmentIds.length; i++) {
    const segmentId = segmentIds[i];
    const segment = segmentMap.get(segmentId);

    let fromStationId;
    let fromStationName;
    let toStationId;
    let toStationName;

    if (segment.station1_id === currentStationId) {
      fromStationId = segment.station1_id;
      fromStationName = segment.station1_name;
      toStationId = segment.station2_id;
      toStationName = segment.station2_name;
    } else if (segment.station2_id === currentStationId) {
      fromStationId = segment.station2_id;
      fromStationName = segment.station2_name;
      toStationId = segment.station1_id;
      toStationName = segment.station1_name;
    } else {
      return {
        valid: false,
        error: `Step ${i + 1} (${segment.station1_name} ↔ ${segment.station2_name}) does not continue from ${nameOf(currentStationId)}. Each segment must start where the previous one ended (your route begins at ${nameOf(game.start_station_id)}).`,
      };
    }

    if (previousLineId !== null && previousLineId !== segment.line_id) {
      const interchange = await dbGet(
        `
        SELECT station_id, COUNT(*) AS line_count
        FROM line_stations
        WHERE station_id = ?
        GROUP BY station_id
        `,
        [fromStationId]
      );

      if (!interchange || interchange.line_count < 2) {
        return {
          valid: false,
          error: `Step ${i + 1}: you change line at ${fromStationName}, but line changes are only allowed at interchange stations.`,
        };
      }
    }

    orientedRoute.push({
      segmentId: segment.id,
      lineId: segment.line_id,
      lineName: segment.line_name,
      fromStation: {
        id: fromStationId,
        name: fromStationName,
      },
      toStation: {
        id: toStationId,
        name: toStationName,
      },
      position: i + 1,
    });

    currentStationId = toStationId;
    previousLineId = segment.line_id;
  }

  if (currentStationId !== game.destination_station_id) {
    return {
      valid: false,
      error: `Your route ends at ${nameOf(currentStationId)}, but it must end at the destination ${nameOf(game.destination_station_id)}.`,
    };
  }

  await dbRun(
    `
    DELETE FROM planned_segments
    WHERE game_id = ?
    `,
    [gameId]
  );

  for (const routeStep of orientedRoute) {
    await dbRun(
      `
      INSERT INTO planned_segments (game_id, segment_id, position)
      VALUES (?, ?, ?)
      `,
      [gameId, routeStep.segmentId, routeStep.position]
    );
  }

  await dbRun(
    `
    UPDATE games
    SET status = 'planned'
    WHERE id = ?
    `,
    [gameId]
  );

  return {
    valid: true,
    gameId,
    status: 'planned',
    route: orientedRoute,
  };
}
 
export async function runGame(gameId, userId) {
  const game = await dbGet(
    `
    SELECT *
    FROM games
    WHERE id = ?
      AND user_id = ?
    `,
    [gameId, userId]
  );
 
  if (!game) {
    return {
      valid: false,
      error: 'Game not found',
      statusCode: 404,
    };
  }
 
  if (game.status !== 'planned') {
    return {
      valid: false,
      error: 'Game must be planned before it can be run',
    };
  }
 
  const plannedSegments = await dbAll(
    `
    SELECT
      ps.position,
      seg.id AS segment_id,
      seg.line_id,
      l.name AS line_name,
      seg.station1_id,
      s1.name AS station1_name,
      seg.station2_id,
      s2.name AS station2_name
    FROM planned_segments ps
    JOIN segments seg ON ps.segment_id = seg.id
    JOIN lines l ON seg.line_id = l.id
    JOIN stations s1 ON seg.station1_id = s1.id
    JOIN stations s2 ON seg.station2_id = s2.id
    WHERE ps.game_id = ?
    ORDER BY ps.position
    `,
    [gameId]
  );
 
  if (plannedSegments.length === 0) {
    return {
      valid: false,
      error: 'No planned route found',
    };
  }
 
  const events = await dbAll(
    `
    SELECT *
    FROM events
    ORDER BY id
    `
  );
 
  if (events.length === 0) {
    return {
      valid: false,
      error: 'No events available',
    };
  }
 
  await dbRun(
    `
    DELETE FROM game_events
    WHERE game_id = ?
    `,
    [gameId]
  );
 
  let coins = game.initial_coins;
  let currentStationId = game.start_station_id;
 
  const execution = [];
 
  for (const plannedSegment of plannedSegments) {
    let fromStation;
    let toStation;
 
    if (plannedSegment.station1_id === currentStationId) {
      fromStation = {
        id: plannedSegment.station1_id,
        name: plannedSegment.station1_name,
      };
 
      toStation = {
        id: plannedSegment.station2_id,
        name: plannedSegment.station2_name,
      };
    } else {
      fromStation = {
        id: plannedSegment.station2_id,
        name: plannedSegment.station2_name,
      };
 
      toStation = {
        id: plannedSegment.station1_id,
        name: plannedSegment.station1_name,
      };
    }
 
    const randomEvent = events[Math.floor(Math.random() * events.length)];
 
    const coinsBefore = coins;
    coins = coins + randomEvent.coin_effect;
 
    await dbRun(
      `
      INSERT INTO game_events (
        game_id,
        segment_id,
        event_id,
        position,
        coins_before,
        coins_after
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        gameId,
        plannedSegment.segment_id,
        randomEvent.id,
        plannedSegment.position,
        coinsBefore,
        coins,
      ]
    );
 
    execution.push({
      position: plannedSegment.position,
      segmentId: plannedSegment.segment_id,
      lineId: plannedSegment.line_id,
      lineName: plannedSegment.line_name,
      fromStation,
      toStation,
      event: {
        id: randomEvent.id,
        description: randomEvent.description,
        coinEffect: randomEvent.coin_effect,
      },
      coinsBefore,
      coinsAfter: coins,
    });
 
    currentStationId = toStation.id;
  }

  const finalScore = Math.max(0, coins);

  await dbRun(
    `
    UPDATE games
    SET status = 'completed',
        final_score = ?
    WHERE id = ?
    `,
    [finalScore, gameId]
  );

  return {
    valid: true,
    gameId,
    status: 'completed',
    initialCoins: game.initial_coins,
    finalScore,
    execution,
  };
}
 
export async function getRanking() {
  const ranking = await dbAll(
    `
    SELECT
      u.id AS user_id,
      u.username,
      MAX(g.final_score) AS best_score
    FROM users u
    JOIN games g ON g.user_id = u.id
    WHERE g.status = 'completed'
      AND g.final_score IS NOT NULL
    GROUP BY u.id, u.username
    ORDER BY best_score DESC, u.username ASC
    `
  );
 
  return ranking.map((row, index) => ({
    position: index + 1,
    userId: row.user_id,
    username: row.username,
    bestScore: row.best_score,
  }));
}
 
export async function failGame(gameId, userId) {
  const game = await dbGet(
    `
    SELECT *
    FROM games
    WHERE id = ?
      AND user_id = ?
    `,
    [gameId, userId]
  );
 
  if (!game) {
    return {
      valid: false,
      error: 'Game not found',
      statusCode: 404,
    };
  }
 
  if (game.status === 'completed') {
    return {
      valid: false,
      error: 'Game is already completed',
    };
  }
 
  await dbRun(
    `
    UPDATE games
    SET status = 'completed',
        final_score = 0
    WHERE id = ?
    `,
    [gameId]
  );
 
  return {
    valid: true,
    gameId,
    status: 'completed',
    initialCoins: game.initial_coins,
    finalScore: 0,
    reason: 'Planning time expired or route was invalid',
    execution: [],
  };
}