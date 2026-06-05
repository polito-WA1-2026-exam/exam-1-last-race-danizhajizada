import { Link } from 'react-router-dom';
import StationMap from '../components/StationMap';
import { getLineColor } from '../utils/lineColours';

function GamePage({
  network,
  game,
  timeLeft,
  segmentInput,
  plannedRoute,
  gameResult,
  onPlay,
  onPlanRoute,
  onSegmentInputChange,
  onRunGame,
}) {
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

            {network && (
              <>
                <h3>Available segments</h3>

                <div className="segment-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Segment</th>
                        <th>Line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {network.segments.map((segment) => (
                        <tr key={segment.id}>
                          <td>{segment.id}</td>
                          <td>
                            {segment.station1_name} ↔ {segment.station2_name}
                          </td>
                          <td>
  <span
    className="line-badge"
    style={{ '--line-color': getLineColor(segment.line_name) }}
  >
    {segment.line_name}
  </span>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <form onSubmit={onPlanRoute} className="form">
              <label>
                Segment IDs, separated by commas
                <input
                  value={segmentInput}
                  onChange={(event) =>
                    onSegmentInputChange(event.target.value)
                  }
                  placeholder="Example: 4,3,2"
                />
              </label>

              <button type="submit" disabled={timeLeft <= 0}>
                Plan Route
              </button>
            </form>
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

      <section className="card">
        <h2>Network loaded from server</h2>

        {network ? (
          <ul>
            <li>Lines: {network.lines.length}</li>
            <li>Stations: {network.stations.length}</li>
            <li>Segments: {network.segments.length}</li>
            <li>Events: {network.events.length}</li>
          </ul>
        ) : (
          <p>Loading network...</p>
        )}
      </section>
    </>
  );
}

export default GamePage;