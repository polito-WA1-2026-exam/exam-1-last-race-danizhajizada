function Navigation({ user, onLogout }) {
  return (
    <header className="top-bar">
      <div className="top-bar-brand">Last Race</div>

      <div className="top-bar-user">
        <div className="default-avatar"></div>

        <span className="username">{user.username}</span>

        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navigation;