import { useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';

import { login } from '../api/auth.js';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    try {
      const user = await login(username, password);
      await onLogin(user);
    } catch (err) {
      setErrorMsg(err.message);
    }
  }

  return (
    <>
      <h1 className="text-center my-3">Last Race</h1>

      <Card className="mb-3">
        <Card.Body>
          <Card.Title as="h2">How to play</Card.Title>
          <Card.Text>
            Plan a route from your start station to your destination station.
            You begin with 20 coins; during the journey, random events add or
            remove coins. Reach the destination with the highest score. Log in
            to start playing.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card className="mx-auto" style={{ maxWidth: '420px' }}>
        <Card.Body>
          <Card.Title as="h2" className="text-center mb-3">
            Login
          </Card.Title>

          {errorMsg && (
            <Alert variant="danger" onClose={() => setErrorMsg('')} dismissible>
              {errorMsg}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" className="w-100">
              Login
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
}

export default LoginForm;
