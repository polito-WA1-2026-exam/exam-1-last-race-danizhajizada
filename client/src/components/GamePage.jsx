import { useState } from 'react';
import { Link } from 'react-router';
import { Alert, Badge, Button, Card, ListGroup, Stack, Table } from 'react-bootstrap';
import { GripVertical } from 'react-bootstrap-icons';

import StationMap from './StationMap.jsx';

function GamePage({
  network,
  game,
  timeLeft,
  selectedSegments,
  plannedRoute,
  gameResult,
  onPlay,
  onPlanRoute,
  onSelectSegment,
  onRemoveSegment,
  onReorderSegments,
  onClearSegments,
  onRunGame,
  onHome,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  const segmentsById = new Map(
    (network?.segments ?? []).map((segment) => [segment.id, segment])
  );

  const selectedRoute = selectedSegments
    .map((id) => segmentsById.get(id))
    .filter(Boolean);

  function handleDrop(targetIndex) {
    if (draggedIndex !== null) {
      onReorderSegments(draggedIndex, targetIndex);
    }

    setDraggedIndex(null);
  }

  return (
    <>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title as="h2" className="text-center mb-3">
            Game
          </Card.Title>

          {!game && (
            <Stack gap={2} className="col-md-4 mx-auto mb-3">
              <Button onClick={onPlay}>Play</Button>

              <Button as={Link} to="/ranking" variant="outline-secondary">
                Rankings
              </Button>
            </Stack>
          )}

          {game && (
            <ListGroup variant="flush" className="mb-3">
              <ListGroup.Item>
                <strong>Start:</strong> {game.startStation.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Destination:</strong> {game.destinationStation.name}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Initial coins:</strong> {game.initialCoins}
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Status:</strong> {game.status}
              </ListGroup.Item>
            </ListGroup>
          )}

          {game && game.status === 'created' && (
            <>
              <p className="text-center">
                Planning time left:{' '}
                <Badge bg={timeLeft <= 10 ? 'danger' : 'secondary'}>
                  {timeLeft}s
                </Badge>
              </p>

              <h3 className="h5">Your route</h3>

              {selectedRoute.length === 0 ? (
                <p className="text-muted">
                  No segments selected yet. Use the “Add” buttons below to build
                  your route in order.
                </p>
              ) : (
                <ListGroup numbered className="mb-3">
                  {selectedRoute.map((segment, index) => (
                    <ListGroup.Item
                      key={segment.id}
                      draggable
                      onDragStart={() => setDraggedIndex(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={() => setDraggedIndex(null)}
                      className="d-flex justify-content-between align-items-center"
                      style={{ cursor: 'grab' }}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <GripVertical className="text-muted" />
                        {segment.station1_name} ↔ {segment.station2_name}
                      </span>

                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => onRemoveSegment(segment.id)}
                      >
                        Remove
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              <div className="d-flex gap-2 justify-content-center mb-3">
                <Button
                  onClick={onPlanRoute}
                  disabled={timeLeft <= 0 || selectedRoute.length === 0}
                >
                  Plan Route
                </Button>

                <Button
                  variant="outline-secondary"
                  onClick={onClearSegments}
                  disabled={selectedRoute.length === 0}
                >
                  Clear
                </Button>
              </div>

              {network && (
                <>
                  <h3 className="h5">Available segments</h3>

                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <Table striped bordered hover size="sm">
                      <thead>
                        <tr>
                          <th>Segment</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {network.segments.map((segment) => {
                          const alreadySelected = selectedSegments.includes(
                            segment.id
                          );

                          return (
                            <tr key={segment.id}>
                              <td>
                                {segment.station1_name} ↔ {segment.station2_name}
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  onClick={() => onSelectSegment(segment.id)}
                                  disabled={alreadySelected || timeLeft <= 0}
                                >
                                  {alreadySelected ? 'Added' : 'Add'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                </>
              )}
            </>
          )}

          {plannedRoute && (
            <>
              <h3 className="h5 mt-3">Planned route</h3>

              <ListGroup numbered className="mb-3">
                {plannedRoute.route.map((step) => (
                  <ListGroup.Item key={step.position}>
                    {step.fromStation.name} → {step.toStation.name} on{' '}
                    {step.lineName}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}

          {game && game.status === 'planned' && (
            <div className="text-center mb-3">
              <Button onClick={onRunGame}>Run Game</Button>
            </div>
          )}

          {gameResult && (
            <>
              <h3 className="h5 mt-3">
                {(gameResult.execution ?? []).length > 0
                  ? 'Execution result'
                  : 'Game result'}
              </h3>

              <p>
                Final score: <strong>{gameResult.finalScore}</strong>
              </p>

              {gameResult.reason && (
                <Alert variant="warning">{gameResult.reason}</Alert>
              )}

              <Stack gap={2} className="col-md-4 mx-auto mb-3">
                <Button onClick={onPlay}>Play Again</Button>

                <Button variant="outline-secondary" onClick={onHome}>
                  Home
                </Button>

                <Button as={Link} to="/ranking" variant="outline-primary">
                  View Rankings
                </Button>
              </Stack>

              {(gameResult.execution ?? []).length > 0 && (
                <ListGroup numbered>
                  {gameResult.execution.map((step) => (
                    <ListGroup.Item key={step.position}>
                      <div>
                        {step.fromStation.name} → {step.toStation.name} on{' '}
                        {step.lineName}
                      </div>
                      <div>
                        Event: {step.event.description} (
                        {step.event.coinEffect > 0 ? '+' : ''}
                        {step.event.coinEffect} coins)
                      </div>
                      <div>
                        Coins: {step.coinsBefore} → {step.coinsAfter}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {network && (
        <Card className="mb-3">
          <Card.Body>
            <Card.Title as="h2" className="text-center mb-3">
              Station Map
            </Card.Title>

            <StationMap
              network={network}
              game={game}
              hideStationNames={false}
              hideLines={Boolean(game)}
            />
          </Card.Body>
        </Card>
      )}
    </>
  );
}

export default GamePage;
