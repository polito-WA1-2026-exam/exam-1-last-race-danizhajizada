import { useContext } from 'react';
import { Button, Container, Navbar } from 'react-bootstrap';

import UserContext from '../contexts/UserContext.js';

function Header({ onLogout }) {
  const user = useContext(UserContext);

  return (
    <Navbar bg="dark" variant="dark">
      <Container>
        <Navbar.Brand>Last Race</Navbar.Brand>

        {user && (
          <div className="d-flex align-items-center gap-3">
            <span className="text-white">{user.username}</span>

            <Button variant="outline-light" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        )}
      </Container>
    </Navbar>
  );
}

export default Header;
