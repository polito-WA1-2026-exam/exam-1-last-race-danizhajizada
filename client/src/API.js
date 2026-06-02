const SERVER_URL = 'http://localhost:3001/api';

async function getJson(response) {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'API error');
  }

  return json;
}

export async function login(username, password) {
  const response = await fetch(`${SERVER_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  return await getJson(response);
}

export async function logout() {
  const response = await fetch(`${SERVER_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}

export async function getCurrentUser() {
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    credentials: 'include',
  });

  return await getJson(response);
}

export async function getNetwork() {
  const response = await fetch(`${SERVER_URL}/network`);

  return await getJson(response);
}

export async function getRanking() {
  const response = await fetch(`${SERVER_URL}/ranking`);

  return await getJson(response);
}

export async function createGame() {
  const response = await fetch(`${SERVER_URL}/games`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}

export async function getGame(gameId) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}`, {
    credentials: 'include',
  });

  return await getJson(response);
}

export async function planGame(gameId, segmentIds) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}/plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ segments: segmentIds }),
  });

  return await getJson(response);
}

export async function runGame(gameId) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}/run`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}

export async function failGame(gameId) {
  const response = await fetch(`${SERVER_URL}/games/${gameId}/fail`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}