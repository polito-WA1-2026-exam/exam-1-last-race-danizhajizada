import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../API';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('password');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const loggedUser = await login(username, password);
      await onLogin(loggedUser);
      navigate('/game');
    } catch (err) {
      setMessage(err.message);
    }
  }

  const navigate = useNavigate();

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
        <p>
          Login to start playing.
        </p>
      </section>

      <section className="card login-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit} className="form">
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

        {message && <p className="message">{message}</p>}
      </section>
    </main>
  );
}

export default LoginPage;