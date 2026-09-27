import assert from 'node:assert/strict'
import { resizedDimensions } from '../src/lib/image.js'

for (const [width, height] of [[4032, 3024], [3024, 4032], [2000, 2000], [6000, 1000], [400, 300]]) {
  const result = resizedDimensions(width, height)
  assert.ok(result.width <= width && result.height <= height, 'Do not upscale')
  assert.ok(Math.max(result.width, result.height) <= 1400)
  assert.ok(result.width * result.height <= 1_150_000)
  assert.ok(Math.abs(result.width / result.height - width / height) < 0.02, 'Keep aspect ratio')
}
assert.deepEqual(resizedDimensions(400, 300), {width: 400, height: 300})
assert.throws(() => resizedDimensions(0, 300), /readable/)
console.log('Photo dimension and aspect-ratio checks passed.')
