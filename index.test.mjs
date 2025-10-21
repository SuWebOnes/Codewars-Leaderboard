import test from 'node:test';
import assert from 'node:assert';
import nock from 'nock';
import {
  fetchUserData,
  extractLanguagesFromUsers,
  sortUsersByScore,
  CODEWARS_API_URL,
} from './api.mjs';

test('fetchUserData returns correct user data', async () => {
  const mockAbe = {
    username: 'Abe',
    clan: 'Warriors',
    ranks: {
      overall: { score: 1500 },
      languages: { javascript: { score: 500 } },
    },
  };
  const mockDan = {
    username: 'Dan',
    clan: null,
    ranks: { overall: { score: 2000 }, languages: { python: { score: 1200 } } },
  };

  const scope = nock(CODEWARS_API_URL)
    .get('/Abe')
    .reply(200, mockAbe)
    .get('/Dan')
    .reply(200, mockDan);

  const result = await fetchUserData(['Abe', 'Dan']);

  assert(Array.isArray(result));
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].username, 'Abe');
  assert.strictEqual(result[1].username, 'Dan');

  assert(scope.isDone());
});

test('extractLanguagesFromUsers returns unique languages', () => {
  const users = [
    {
      username: 'Abe',
      error: false,
      ranks: { languages: { js: {}, python: {} }, overall: { score: 100 } },
    },
    {
      username: 'Dan',
      error: false,
      ranks: { languages: { python: {} }, overall: { score: 200 } },
    },
  ];
  const langs = extractLanguagesFromUsers(users);
  assert.deepStrictEqual(langs, ['js', 'python']);
});

test('sortUsersByScore sorts correctly by overall', () => {
  const users = [
    {
      username: 'A',
      error: false,
      ranks: { overall: { score: 50 }, languages: {} },
    },
    {
      username: 'B',
      error: false,
      ranks: { overall: { score: 100 }, languages: {} },
    },
  ];
  const sorted = sortUsersByScore(users, 'overall');
  assert.strictEqual(sorted[0].username, 'B');
  assert.strictEqual(sorted[1].username, 'A');
});