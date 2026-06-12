const SERVER_URL = 'http://localhost:3001/api';

async function getJson(response) {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(json?.error || 'Authentication error');
  }

  return json;
}

async function login(username, password) {
  const response = await fetch(`${SERVER_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  return await getJson(response);
}

async function logout() {
  const response = await fetch(`${SERVER_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  return await getJson(response);
}

async function getCurrentUser() {
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    credentials: 'include',
  });

  return await getJson(response);
}

export { login, logout, getCurrentUser };
