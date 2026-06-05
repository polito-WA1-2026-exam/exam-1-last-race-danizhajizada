import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  logout,
  getCurrentUser,
  getNetwork,
  getRanking,
  createGame,
  planGame,
  runGame,
  failGame,
} from './API';
import LoginPage from './pages/LoginPage';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [network, setNetwork] = useState(null);
  const [ranking, setRanking] = useState([]);
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
        await loadPrivateData();
      } catch {
        setUser(null);
      }
    }

    loadInitialData();
  }, []);

  async function loadPrivateData() {
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

  function clearGameState() {
    setGame(null);
    setSegmentInput('');
    setPlannedRoute(null);
    setGameResult(null);
    setTimeLeft(0);
    setTimerActive(false);
  }

  async function handleLoginSuccess(loggedUser) {
    setUser(loggedUser);
    clearGameState();
    await loadPrivateData();
    setMessage(`Welcome, ${loggedUser.username}!`);
  }

  async function handleLogout() {
    try {
      await logout();

      setUser(null);
      clearGameState();
      setNetwork(null);
      setRanking([]);
      setMessage('Logged out');
    } catch (err) {
      setMessage(err.message);
    }
  }

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

  async function handleNewGame() {
    try {
      const newGame = await createGame();

      setGame(newGame);
      setSegmentInput('');
      setPlannedRoute(null);
      setGameResult(null);

      setTimeLeft(90);
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

  function GamePage() {
    return (
      <>
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

          {game && game.status === 'created' && (
            <>
              <p>
                Planning time left:{' '}
                <strong className={timeLeft <= 10 ? 'danger' : ''}>
                  {timeLeft}
                </strong>{' '}
                seconds
              </p>

              {network && (
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
          )}

          {game && game.status === 'planned' && (
            <button onClick={handleRunGame}>Run Game</button>
          )}

          {gameResult && (
            <div>
              <h3>
                {(gameResult.execution ?? []).length > 0
                  ? 'Execution result'
                  : 'Game result'}
              </h3>

              <p>
                Final score: <strong>{gameResult.finalScore}</strong>
              </p>

              {gameResult.reason && <p>{gameResult.reason}</p>}

              {(gameResult.execution ?? []).length > 0 && (
                <ol>
                  {gameResult.execution.map((step) => (
                    <li key={step.position}>
                      {step.fromStation.name} → {step.toStation.name} on{' '}
                      {step.lineName}
                      <br />
                      Event: {step.event.description} (
                      {step.event.coinEffect > 0 ? '+' : ''}
                      {step.event.coinEffect} coins)
                      <br />
                      Coins: {step.coinsBefore} → {step.coinsAfter}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Network loaded from server</h2>

          {network ? (
            <ul>
              <li>Lines: {network.lines.length}</li>
              <li>Stations: {network.stations.length}</li>
              <li>Segments: {network.segments.length}</li>
              <li>Events: {network.events.length}</li>
            </ul>
          ) : (
            <p>Loading network...</p>
          )}
        </section>
      </>
    );
  }

  function RankingPage() {
    return (
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
    );
  }

  return (
    <main className="page">
      {user && <Navigation user={user} onLogout={handleLogout} />}

      {message && <p className="message">{message}</p>}

      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/game" /> : <LoginPage onLogin={handleLoginSuccess} />
          }
        />

        <Route
          path="/game"
          element={user ? <GamePage /> : <Navigate to="/" />}
        />

        <Route
          path="/ranking"
          element={user ? <RankingPage /> : <Navigate to="/" />}
        />

        <Route
          path="*"
          element={<Navigate to={user ? '/game' : '/'} />}
        />
      </Routes>
    </main>
  );
}

export default App;