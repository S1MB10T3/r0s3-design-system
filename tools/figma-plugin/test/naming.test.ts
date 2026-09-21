import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figmaNameToPath, pathToFigmaName, tokenTypeFor } from '../src/naming.ts';

test('Figma names map to token paths', () => {
  assert.deepEqual(figmaNameToPath('Colors/Core/Neutral/0'), ['color', 'core', 'neutral', '0']);
  assert.deepEqual(figmaNameToPath('Typography/Line Height/Body'), ['font', 'line-height', 'body']);
  assert.deepEqual(figmaNameToPath('Motion/Duration/Hover'), ['duration', 'hover']);
  assert.deepEqual(figmaNameToPath('Motion/Ease/Brand'), ['ease', 'brand']);
  assert.deepEqual(figmaNameToPath('Z/Overlay'), ['z', 'overlay']);
  assert.deepEqual(figmaNameToPath('Spacing/3'), ['space', '3']);
});

test('token paths round-trip through Figma names', () => {
  for (const path of [
    ['color', 'core', 'neutral', '0'],
    ['color', 'accent'],
    ['font', 'line-height', 'body'],
    ['font', 'weight', 'body-bold'],
    ['duration', 'hover'],
    ['ease', 'brand'],
    ['space', '3'],
    ['z', 'overlay'],
  ]) {
    assert.deepEqual(figmaNameToPath(pathToFigmaName(path)), path, path.join('.'));
  }
});

test('token types follow the path', () => {
  assert.equal(tokenTypeFor(['space', '1'], 'FLOAT'), 'dimension');
  assert.equal(tokenTypeFor(['font', 'size', 'body'], 'FLOAT'), 'dimension');
  assert.equal(tokenTypeFor(['font', 'weight', 'body'], 'FLOAT'), 'fontWeight');
  assert.equal(tokenTypeFor(['font', 'line-height', 'body'], 'FLOAT'), 'number');
  assert.equal(tokenTypeFor(['font', 'family', 'body'], 'STRING'), 'fontFamily');
  assert.equal(tokenTypeFor(['duration', 'hover'], 'FLOAT'), 'duration');
  assert.equal(tokenTypeFor(['ease', 'brand'], 'STRING'), 'cubicBezier');
  assert.equal(tokenTypeFor(['color', 'bg'], 'COLOR'), 'color');
});
