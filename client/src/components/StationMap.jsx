import { getLineColor, lineColors } from '../utils/lineColours';

const stationPositions = {
  Centrale: { x: 80, y: 80 },
  'Porta Velaria': { x: 220, y: 80 },
  'Crocevia del Falco': { x: 360, y: 80 },
  'Piazza delle Lanterne': { x: 500, y: 80 },
  'Mercato Antico': { x: 640, y: 80 },

  'Fontana Oscura': { x: 220, y: 200 },
  'Borgo Sereno': { x: 360, y: 200 },
  'Viale dei Mosaici': { x: 500, y: 200 },
  'Arco Solare': { x: 640, y: 200 },

  'Torre Cinerea': { x: 360, y: 320 },
  "Campo dell'Eco": { x: 500, y: 320 },
  'Giardini Nebbia': { x: 640, y: 320 },
};

function StationMap({ network, game, hideStationNames = false, hideLines  = false }) {
  if (!network) {
    return null;
  }

  function isStartStation(stationName) {
    return game?.startStation?.name === stationName;
  }

  function isDestinationStation(stationName) {
    return game?.destinationStation?.name === stationName;
  }

  function getStationLabel(stationName) {
  if (hideStationNames) {
    return '';
  }

  return stationName;
}

  return (
    <div className="station-map">
      <svg viewBox="0 0 720 390" className="station-map-svg">
        {!hideLines &&
  network.segments.map((segment) => {
    const start = stationPositions[segment.station1_name];
    const end = stationPositions[segment.station2_name];

    if (!start || !end) {
      return null;
    }

    return (
      <line
        key={segment.id}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={getLineColor(segment.line_name)}
        strokeWidth="8"
        strokeLinecap="round"
      />
    );
  })}

        {network.stations.map((station) => {
          const position = stationPositions[station.name];

          if (!position) {
            return null;
          }

          const isStart = isStartStation(station.name);
          const isDestination = isDestinationStation(station.name);

          let fill = '#ffffff';

          if (isStart) {
            fill = '#38a169';
          }

          if (isDestination) {
            fill = '#d94a4a';
          }

          return (
            <g key={station.id}>
              <circle
                cx={position.x}
                cy={position.y}
                r="11"
                fill={fill}
                stroke="#222"
                strokeWidth="2"
              />

              <text
                x={position.x}
                y={position.y + 30}
                textAnchor="middle"
                className="station-label"
              >
                {getStationLabel(station.name)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="map-legend">
        {Object.entries(lineColors).map(([lineName, color]) => (
          <span key={lineName} className="map-legend-item">
            <span
              className="map-legend-color"
              style={{ backgroundColor: color }}
            ></span>
            {lineName}
          </span>
        ))}
      </div>
    </div>
  );
}

export default StationMap;