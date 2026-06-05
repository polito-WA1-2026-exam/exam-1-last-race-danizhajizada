import { NavLink } from 'react-router-dom';

function Navigation({ user, onLogout }) {
  return (
    <header className="card nav-bar">
      <div>
        <strong>Last Race</strong>
      </div>

      <nav className="nav-links">
        <NavLink to="/game">Game</NavLink>
        <NavLink to="/ranking">Ranking</NavLink>
      </nav>

      <div className="nav-user">
        <span>{user.username}</span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Navigation;