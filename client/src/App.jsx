import 'bootstrap/dist/css/bootstrap.min.css';
import './components/custom.css';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Container, Spinner } from 'react-bootstrap';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';

import Header from './components/Header.jsx';
import LoginForm from './components/LoginForm.jsx';
import GamePage from './components/GamePage.jsx';
import RankingPage from './components/RankingPage.jsx';

import UserContext from './contexts/UserContext.js';

import { logout, getCurrentUser } from './api/auth.js';
import {
  getNetwork,
  getRanking,
  createGame,
  planGame,
  runGame,
  failGame,
} from './api/api.js';

function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [network, setNetwork] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [message, setMessage] = useState('');
  const [game, setGame] = useState(null);
  // Ordered list of segment ids selected for the current route.
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [plannedRoute, setPlannedRoute] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  // Restore the session at startup.
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
  }

  async function handleLogin(loggedUser) {
    setUser(loggedUser);
    clearGameState();
    await loadPrivateData();
    setMessage(`Welcome, ${loggedUser.username}!`);
    navigate('/game');
  }

  async function handleLogout() {
    try {
      await logout();

      setUser(null);
      clearGameState();
      setNetwork(null);
      setRanking([]);
      setMessage('');
      navigate('/');
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Append a segment to the route. Each segment may be selected only once.
  function handleSelectSegment(segmentId) {
    setSelectedSegments((current) =>
      current.includes(segmentId) ? current : [...current, segmentId]
    );
  }

  function handleRemoveSegment(segmentId) {
    setSelectedSegments((current) => current.filter((id) => id !== segmentId));
  }

  function handleClearSegments() {
    setSelectedSegments([]);
  }

  // Move a segment from one position to another within the selected route.
  function handleReorderSegments(fromIndex, toIndex) {
    setSelectedSegments((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const updated = [...current];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      return updated;
    });
  }

  // Reset to the initial game screen, keeping the user logged in.
  function handleBackToHome() {
    clearGameState();
    setMessage('');
  }

  const handleTimeExpired = useCallback(async () => {
    if (!game || game.status !== 'created') {
      return;
    }

    try {
      let result;
      let reason;

      if (selectedSegments.length > 0) {
        try {
          const planned = await planGame(game.id, selectedSegments);

          setPlannedRoute(planned);
          setGame({ ...game, status: planned.status });

          setMessage('Time is over, but your route was valid. You can run it.');
          return;
        } catch {
          result = await failGame(game.id);
          reason = 'Time ran out and your submitted route was invalid.';
        }
      } else {
        result = await failGame(game.id);
        reason = 'Time ran out before you selected a route.';
      }

      setGameResult({ ...result, reason });
      setGame({ ...game, status: result.status });

      const rankingData = await getRanking();
      setRanking(rankingData);

      setMessage('Time is over. Final score: 0');
    } catch (err) {
      setMessage(err.message);
    }
  }, [game, selectedSegments]);

  // Tick the countdown down while a game is in the planning phase,
  // and fail the game once it reaches zero.
  useEffect(() => {
    if (!game || game.status !== 'created' || timeLeft <= 0) {
      return;
    }

    const timerId = setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        handleTimeExpired();
      } else {
        setTimeLeft((currentTime) => currentTime - 1);
      }
    }, 1000);

    return () => clearTimeout(timerId);
  }, [game, timeLeft, handleTimeExpired]);

  async function handlePlay() {
    try {
      const newGame = await createGame();

      setGame(newGame);
      setSelectedSegments([]);
      setPlannedRoute(null);
      setGameResult(null);

      setTimeLeft(90);

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
      setGame({ ...game, status: result.status });

      setMessage('Route planned successfully.');
    } catch {
      const result = await failGame(game.id);

      setGameResult({ ...result, reason: 'Your submitted route was invalid.' });
      setGame({ ...game, status: result.status });

      const rankingData = await getRanking();
      setRanking(rankingData);

      setMessage('Your route was invalid. Final score: 0');
    }
  }

  async function handleRunGame() {
    try {
      const result = await runGame(game.id);

      setGameResult(result);
      setGame({ ...game, status: result.status });

      const rankingData = await getRanking();
      setRanking(rankingData);

      setMessage(`Game completed! Final score: ${result.finalScore}`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <Routes>
        <Route
          path="/"
          element={<MainLayout onLogout={handleLogout} message={message} />}
        >
          <Route
            index
            element={
              user ? (
                <Navigate to="/game" replace />
              ) : (
                <LoginForm onLogin={handleLogin} />
              )
            }
          />

          <Route
            path="game"
            element={
              user ? (
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
                  onReorderSegments={handleReorderSegments}
                  onClearSegments={handleClearSegments}
                  onRunGame={handleRunGame}
                  onHome={handleBackToHome}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="ranking"
            element={
              user ? (
                <RankingPage ranking={ranking} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="*"
            element={<Navigate to={user ? '/game' : '/'} replace />}
          />
        </Route>
      </Routes>
    </UserContext.Provider>
  );
}

function MainLayout({ onLogout, message }) {
  return (
    <>
      <Header onLogout={onLogout} />

      <Container className="my-3">
        {message && (
          <Alert variant="info" className="text-center">
            {message}
          </Alert>
        )}

        <Outlet />
      </Container>
    </>
  );
}

export default App;
