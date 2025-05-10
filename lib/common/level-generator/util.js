export function emptyMatrix(width, height, initValue) {
  return new Array(height).fill().map(() => new Array(width).fill(initValue))
}
