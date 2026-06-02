import { useEffect, useState } from 'react';
import {
  login,
  logout,
  getCurrentUser,
  getNetwork,
  getRanking,
  createGame,
  planGame,
  runGame,
  failGame
} from './API';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [network, setNetwork] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('password');
  const [message, setMessage] = useState('');
  const [game, setGame] = useState(null);
  const [segmentInput, setSegmentInput] = useState('');
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
  async function loadInitialData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      }

      try {
        const networkData = await getNetwork();
        setNetwork(networkData);
      } catch (err) {
        setMessage(err.message);
      }

      try {
        const rankingData = await getRanking();
        setRanking(rankingData);
      } catch (err) {
        setMessage(err.message);
      }
    }

    loadInitialData();
  }, []);

  async function handleTimeExpired() {
  if (!game || game.status !== 'created') {
    return;
  }

  try {
    let result;

    const segmentIds = segmentInput
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value));

    if (segmentIds.length > 0) {
      try {
        const planned = await planGame(game.id, segmentIds);

        setPlannedRoute(planned);
        setGame({
          ...game,
          status: planned.status,
        });

        setMessage('Time is over, but your route was valid. You can run it.');
        return;
      } catch {
        result = await failGame(game.id);
      }
    } else {
      result = await failGame(game.id);
    }

    setGameResult(result);
    setGame({
      ...game,
      status: result.status,
    });

    const rankingData = await getRanking();
    setRanking(rankingData);

    setMessage('Time is over. Route invalid or missing. Final score: 0');
  } catch (err) {
    setMessage(err.message);
  }
}

  useEffect(() => {
  if (!timerActive) {
    return;
  }

  if (timeLeft <= 0) {
    setTimerActive(false);
    handleTimeExpired();
    return;
  }

  const timerId = setTimeout(() => {
    setTimeLeft((currentTime) => currentTime - 1);
  }, 1000);

  return () => clearTimeout(timerId);
}, [timerActive, timeLeft]);

async function handleLogin(event) {
  event.preventDefault();

  try {
    const loggedUser = await login(username, password);

    setUser(loggedUser);
    setGame(null);
    setSegmentInput('');
    setPlannedRoute(null);
    setGameResult(null);

    setMessage(`Welcome, ${loggedUser.username}!`);
  } catch (err) {
    setMessage(err.message);
  }
}

async function handleLogout() {
  try {
    await logout();

    setUser(null);
    setGame(null);
    setSegmentInput('');
    setPlannedRoute(null);
    setGameResult(null);

    setMessage('Logged out');
  } catch (err) {
    setMessage(err.message);
  }
}

async function handleNewGame() {
  try {
    const newGame = await createGame();

    setGame(newGame);
    setSegmentInput('');
    setPlannedRoute(null);
    setGameResult(null);

    setTimeLeft(10);
    setTimerActive(true);

    setMessage('New game created. You have 90 seconds to plan your route.');
  } catch (err) {
    setMessage(err.message);
  }
}

async function handlePlanRoute(event) {
  event.preventDefault();

  if (timeLeft <= 0) {
    setMessage('Time is over! You cannot plan this route anymore.');
    return;
  }

  try {
    const segmentIds = segmentInput
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value));

    const result = await planGame(game.id, segmentIds);

    setPlannedRoute(result);
    setGame({
      ...game,
      status: result.status,
    });

    setTimerActive(false);

    setMessage('Route planned successfully');
  } catch (err) {
    setMessage(err.message);
  }
}

async function handleRunGame() {
  try {
    const result = await runGame(game.id);

    setGameResult(result);
    setGame({
      ...game,
      status: result.status,
    });

    const rankingData = await getRanking();
    setRanking(rankingData);

    setMessage(`Game completed! Final score: ${result.finalScore}`);
  } catch (err) {
    setMessage(err.message);
  }
}



  return (
    <main className="page">
      <h1>Last Race</h1>

      <section className="card">
        <h2>Instructions</h2>
        <p>
          Plan a route from the start station to the destination station.
          You start with 20 coins. During execution, random events can add
          or remove coins. Try to finish with the highest score.
        </p>
      </section>

      <section className="card">
        <h2>User</h2>

        {user ? (
          <>
            <p>
              Logged in as <strong>{user.username}</strong>
            </p>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <form onSubmit={handleLogin} className="form">
            <label>
              Username
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button type="submit">Login</button>
          </form>
        )}

        {message && <p className="message">{message}</p>}
      </section>
      {user && (
  <section className="card">
    <h2>Game</h2>

    <button onClick={handleNewGame}>New Game</button>

    {game && (
      <div>
        <p>
          Start station: <strong>{game.startStation.name}</strong>
        </p>
        <p>
          Destination station:{' '}
          <strong>{game.destinationStation.name}</strong>
        </p>
        <p>Initial coins: {game.initialCoins}</p>
        <p>Status: {game.status}</p>
      </div>
    )}
  </section>
)}  {game && game.status === 'created' && (
  <form onSubmit={handlePlanRoute} className="form">
    <label>
      Segment IDs, separated by commas
      <input
        value={segmentInput}
        onChange={(event) => setSegmentInput(event.target.value)}
        placeholder="Example: 4,3,2"
      />
    </label>

    <button type="submit" disabled={timeLeft <= 0}>
  Plan Route
</button>
  </form>
)} {game && game.status === 'created' && (
  <p>
    Planning time left:{' '}
    <strong className={timeLeft <= 10 ? 'danger' : ''}>
      {timeLeft}
    </strong>{' '}
    seconds
  </p>
)}  {network && game && game.status === 'created' && (
  <>
    <h3>Available segments</h3>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Segment</th>
          <th>Line</th>
        </tr>
      </thead>
      <tbody>
        {network.segments.map((segment) => (
          <tr key={segment.id}>
            <td>{segment.id}</td>
            <td>
              {segment.station1_name} ↔ {segment.station2_name}
            </td>
            <td>{segment.line_name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
)}

{plannedRoute && (
  <div>
    <h3>Planned route</h3>
    <ol>
      {plannedRoute.route.map((step) => (
        <li key={step.position}>
          {step.fromStation.name} → {step.toStation.name} on{' '}
          {step.lineName}
        </li>
      ))}
    </ol>
  </div>
)}  {game && game.status === 'planned' && (
  <button onClick={handleRunGame}>Run Game</button>
)}

{gameResult && (
  <div>
    <h3>
      {gameResult.execution.length > 0 ? 'Execution result' : 'Game result'}
    </h3>

    <p>
      Final score: <strong>{gameResult.finalScore}</strong>
    </p>

    {gameResult.reason && <p>{gameResult.reason}</p>}

    {gameResult.execution.length > 0 && (
      <ol>
        {gameResult.execution.map((step) => (
          <li key={step.position}>
            {step.fromStation.name} → {step.toStation.name} on {step.lineName}
            <br />
            Event: {step.event.description} ({step.event.coinEffect > 0 ? '+' : ''}
            {step.event.coinEffect} coins)
            <br />
            Coins: {step.coinsBefore} → {step.coinsAfter}
          </li>
        ))}
      </ol>
    )}
  </div>
)}

      <section className="card">
  <h2>Network loaded from server</h2>

  {network ? (
    <>
      <ul>
        <li>Lines: {network.lines.length}</li>
        <li>Stations: {network.stations.length}</li>
        <li>Segments: {network.segments.length}</li>
        <li>Events: {network.events.length}</li>
      </ul>

      
    </>
  ) : (
    <p>Loading network...</p>
  )}
</section>

      <section className="card">
        <h2>Ranking</h2>

        {ranking.length === 0 ? (
          <p>No completed games yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>User</th>
                <th>Best score</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => (
                <tr key={row.userId}>
                  <td>{row.position}</td>
                  <td>{row.username}</td>
                  <td>{row.bestScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

export default App;