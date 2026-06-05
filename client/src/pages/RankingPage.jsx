import { Link } from 'react-router-dom';

function RankingPage({ ranking }) {
  return (
    <section className="card ranking-card">
      <div className="ranking-header">
        <Link to="/game" className="back-arrow" aria-label="Back to game">
          ←
        </Link>

        <h2>Ranking</h2>

        <div className="ranking-header-spacer"></div>
      </div>

      {ranking.length === 0 ? (
        <p>No completed games yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>User</th>
              <th>Best score</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row) => (
              <tr key={row.userId}>
                <td>{row.position}</td>
                <td>{row.username}</td>
                <td>{row.bestScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default RankingPage;