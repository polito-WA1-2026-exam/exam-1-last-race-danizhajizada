// imports
import express from "express";
import db from './db.js';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { initDB, seedDB, getNetwork, getUserByUsername,
  getUserById, checkPassword, createGame, getGameById, planGameRoute, runGame,
  getRanking, failGame } from './dao.js';
// init express
const app = new express();
const port = 3001;

// activate the server
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(session({
  secret: 'last-race-secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password',
  },
  async (username, password, done) => {
    try {
      const user = await getUserByUsername(username);

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      const validPassword = checkPassword(password, user);

      if (!validPassword) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, {
        id: user.id,
        username: user.username,
      });
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ error: 'Not authenticated' });
}

app.post('/api/login', (req, res, next) => {
  console.log('Login body:', req.body);

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        error: info?.message || 'Invalid username or password',
      });
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      return res.json(user);
    });
  })(req, res, next);
});

app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.status(200).json({ message: 'Logged out' });
  });
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.get('/api/network', isLoggedIn, async (req, res) => {
  try {
    const network = await getNetwork();
    res.json(network);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/games', isLoggedIn, async (req, res) => {
  try {
    const game = await createGame(req.user.id);
    res.status(201).json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/games/:id', isLoggedIn, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }

    const game = await getGameById(gameId, req.user.id);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/games/:id/plan', isLoggedIn, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }

    const segmentIds = req.body.segments;

    const result = await planGameRoute(gameId, req.user.id, segmentIds);

    if (!result.valid) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/games/:id/run', isLoggedIn, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }

    const result = await runGame(gameId, req.user.id);

    if (!result.valid) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/games/:id/fail', isLoggedIn, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId)) {
      return res.status(400).json({ error: 'Invalid game id' });
    }

    const result = await failGame(gameId, req.user.id);

    if (!result.valid) {
      return res.status(result.statusCode || 400).json({
        error: result.error,
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/ranking', isLoggedIn, async (req, res) => {
  try {
    const ranking = await getRanking();
    res.json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

initDB()
  .then(seedDB)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error initializing database:', err);
  });