import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, Spinner, Table } from 'react-bootstrap';

import { getRanking } from '../api/api.js';

function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRanking()
      .then(setRanking)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="mb-3">
      <Card.Body>
        <div className="d-flex align-items-center mb-3">
          <Button as={Link} to="/game" variant="outline-secondary" size="sm">
            ← Back
          </Button>

          <Card.Title as="h2" className="mb-0 mx-auto">
            Ranking
          </Card.Title>
        </div>

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" size="sm" />
          </div>
        ) : ranking.length === 0 ? (
          <p className="text-center text-muted">No completed games yet.</p>
        ) : (
          <Table striped bordered hover>
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
          </Table>
        )}
      </Card.Body>
    </Card>
  );
}

export default RankingPage;
