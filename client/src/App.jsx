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
import GamePage from './pages/GamePage';
import RankingPage from './pages/RankingPage';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [network, setNetwork] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [message, setMessage] = useState('');
  const [game, setGame] = useState(null);
  // Ordered list of segment ids the player has selected for this route.
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        await loadPrivateData();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
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
    setSelectedSegments([]);
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

  function handleSelectSegment(segmentId) {
    setSelectedSegments((current) =>
      current.includes(segmentId) ? current : [...current, segmentId]
    );
  }

  function handleRemoveSegment(segmentId) {
    setSelectedSegments((current) =>
      current.filter((id) => id !== segmentId)
    );
  }

  function handleClearSegments() {
    setSelectedSegments([]);
  }

  async function handleTimeExpired() {
    if (!game || game.status !== 'created') {
      return;
    }

    try {
      let result;

      if (selectedSegments.length > 0) {
        try {
          const planned = await planGame(game.id, selectedSegments);

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

  async function handlePlay() {
    try {
      const newGame = await createGame();

      setGame(newGame);
      setSelectedSegments([]);
      setPlannedRoute(null);
      setGameResult(null);

      setTimeLeft(90);
      setTimerActive(true);

      setMessage('New game created. You have 90 seconds to plan your route.');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handlePlanRoute() {
    if (timeLeft <= 0) {
      setMessage('Time is over! You cannot plan this route anymore.');
      return;
    }

    if (selectedSegments.length === 0) {
      setMessage('Select at least one segment before planning your route.');
      return;
    }

    try {
      const result = await planGame(game.id, selectedSegments);

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

  function renderPrivatePage(pageContent) {
    return (
      <ProtectedRoute user={user}>
        <Navigation user={user} onLogout={handleLogout} />

        <main className="page">
          {message && <p className="message">{message}</p>}

          {pageContent}
        </main>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <main className="page">
        <p className="message">Loading...</p>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/game" replace />
          ) : (
            <LoginPage onLogin={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/game"
        element={renderPrivatePage(
          <GamePage
            network={network}
            game={game}
            timeLeft={timeLeft}
            selectedSegments={selectedSegments}
            plannedRoute={plannedRoute}
            gameResult={gameResult}
            onPlay={handlePlay}
            onPlanRoute={handlePlanRoute}
            onSelectSegment={handleSelectSegment}
            onRemoveSegment={handleRemoveSegment}
            onClearSegments={handleClearSegments}
            onRunGame={handleRunGame}
          />
        )}
      />

      <Route
        path="/ranking"
        element={renderPrivatePage(<RankingPage ranking={ranking} />)}
      />

      <Route
        path="*"
        element={<Navigate to={user ? '/game' : '/'} replace />}
      />
    </Routes>
  );
}

export default App;
