const SERVER_URL = 'http://localhost:3001/api';

async function getJson(response) {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'API error');
  }

  return json;
}

async function getNetwork() {
  const response = await fetch(`${SERVER_URL}/network`, {
    credentials: 'include',
  });

  return await getJson(response);
}

async function getRanking() {
  const response = await fetch(`${SERVER_URL}/ranking`, {
    credentials: 'include',
  });

  return await getJson(response);
}

async function createGame() {
  const response = await fetch(`${SERVER_URL}/games`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}

async function planGame(gameId, segmentIds) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ segments: segmentIds }),
  });

  return await getJson(response);
}

async function runGame(gameId) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}/run`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}

async function failGame(gameId) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}/fail`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}

export {
  getNetwork,
  getRanking,
  createGame,
  planGame,
  runGame,
  failGame,
};
