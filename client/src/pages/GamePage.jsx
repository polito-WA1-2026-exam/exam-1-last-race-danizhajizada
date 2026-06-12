import { Link } from 'react-router-dom';
import StationMap from '../components/StationMap';
import { getLineColor } from '../utils/lineColours';

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
  onClearSegments,
  onRunGame,
}) {
  const segmentsById = new Map(
    (network?.segments ?? []).map((segment) => [segment.id, segment])
  );

  const selectedRoute = selectedSegments
    .map((id) => segmentsById.get(id))
    .filter(Boolean);

  return (
    <>
      <section className="card">
        <h2>Game</h2>

        <div className="game-actions">
          <button onClick={onPlay}>Play</button>

          {!game && (
            <Link to="/ranking" className="button-link">
              Rankings
            </Link>
          )}
        </div>

        {game && (
          <div>
            <p>
              Start station: <strong>{game.startStation.name}</strong>
            </p>
            <p>
              Destination station:{' '}
              <strong>{game.destinationStation.name}</strong>
            </p>
            <p>Initial coins: {game.initialCoins}</p>
            <p>Status: {game.status}</p>
          </div>
        )}

        {game && game.status === 'created' && (
          <>
            <p>
              Planning time left:{' '}
              <strong className={timeLeft <= 10 ? 'danger' : ''}>
                {timeLeft}
              </strong>{' '}
              seconds
            </p>

            <h3>Your route</h3>

            {selectedRoute.length === 0 ? (
              <p>
                No segments selected yet. Use the “Add” buttons below to build
                your route in order.
              </p>
            ) : (
              <ol className="route-list">
                {selectedRoute.map((segment) => (
                  <li key={segment.id} className="route-list-item">
                    <span>
                      {segment.station1_name} ↔ {segment.station2_name}
                    </span>
                    <button
                      type="button"
                      className="route-remove"
                      onClick={() => onRemoveSegment(segment.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <div className="plan-actions">
              <button
                type="button"
                onClick={onPlanRoute}
                disabled={timeLeft <= 0 || selectedRoute.length === 0}
              >
                Plan Route
              </button>

              <button
                type="button"
                onClick={onClearSegments}
                disabled={selectedRoute.length === 0}
              >
                Clear
              </button>
            </div>

            {network && (
              <>
                <h3>Available segments</h3>

                <div className="segment-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Segment</th>
                        <th>Line</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {network.segments.map((segment) => {
                        const alreadySelected =
                          selectedSegments.includes(segment.id);

                        return (
                          <tr key={segment.id}>
                            <td>
                              {segment.station1_name} ↔ {segment.station2_name}
                            </td>
                            <td>
                              <span
                                className="line-badge"
                                style={{
                                  '--line-color': getLineColor(
                                    segment.line_name
                                  ),
                                }}
                              >
                                {segment.line_name}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => onSelectSegment(segment.id)}
                                disabled={alreadySelected || timeLeft <= 0}
                              >
                                {alreadySelected ? 'Added' : 'Add'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {plannedRoute && (
          <div>
            <h3>Planned route</h3>
            <ol>
              {plannedRoute.route.map((step) => (
                <li key={step.position}>
                  {step.fromStation.name} → {step.toStation.name} on{' '}
                  {step.lineName}
                </li>
              ))}
            </ol>
          </div>
        )}

        {game && game.status === 'planned' && (
          <button onClick={onRunGame}>Run Game</button>
        )}

        {gameResult && (
          <div>
            <h3>
              {(gameResult.execution ?? []).length > 0
                ? 'Execution result'
                : 'Game result'}
            </h3>

            <p>
              Final score: <strong>{gameResult.finalScore}</strong>
            </p>

            {gameResult.reason && <p>{gameResult.reason}</p>}

            {(gameResult.execution ?? []).length > 0 && (
              <ol>
                {gameResult.execution.map((step) => (
                  <li key={step.position}>
                    {step.fromStation.name} → {step.toStation.name} on{' '}
                    {step.lineName}
                    <br />
                    Event: {step.event.description} (
                    {step.event.coinEffect > 0 ? '+' : ''}
                    {step.event.coinEffect} coins)
                    <br />
                    Coins: {step.coinsBefore} → {step.coinsAfter}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </section>

      {network && (
        <section className="card station-map-card">
          <h2>Station Map</h2>

          <StationMap
            network={network}
            game={game}
            hideStationNames={false}
            hideLines={Boolean(game)}
          />
        </section>
      )}
    </>
  );
}

export default GamePage;
