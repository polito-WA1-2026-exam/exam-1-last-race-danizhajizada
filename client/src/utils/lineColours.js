export const lineColors = {
  Red: '#d94a4a',
  Blue: '#3f7ee8',
  Green: '#38a169',
  Yellow: '#d6a600',
};

export function getLineBaseName(lineName) {
  return lineName.replace(' Line', '').trim();
}

export function getLineColor(lineName) {
  const baseName = getLineBaseName(lineName);
  return lineColors[baseName] ?? '#999999';
}