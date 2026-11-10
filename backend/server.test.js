const test = require('node:test');
const assert = require('node:assert/strict');
const { _internal } = require('./server');

test('tone inference identifies common editorial tones', () => {
  assert.equal(_internal.inferTone('A new report warns of an urgent crisis'), 'Alarmist');
  assert.equal(_internal.inferTone('The study presents new data'), 'Analytical');
  assert.equal(_internal.inferTone('Officials announced a major breakthrough'), 'Optimistic');
  assert.equal(_internal.inferTone('Officials met on Tuesday'), 'Neutral');
});

test('frame inference identifies common coverage frames', () => {
  assert.equal(_internal.inferFrame('The government introduced a new policy'), 'Political');
  assert.equal(_internal.inferFrame('Markets reacted to higher industry costs'), 'Economic');
  assert.equal(_internal.inferFrame('Community health and civil rights are affected'), 'Humanitarian');
  assert.equal(_internal.inferFrame('A cyber attack raised security concerns'), 'Security');
});

test('article hashes are stable and change with the article set', () => {
  const articles = [{ title: 'Story A', name: 'Outlet A' }];
  assert.equal(_internal.articleHash(articles), _internal.articleHash(articles));
  assert.notEqual(
    _internal.articleHash(articles),
    _internal.articleHash([{ title: 'Story B', name: 'Outlet A' }]),
  );
});

test('framing intensity exposes a bounded score and supporting signals', () => {
  const neutral = _internal.assessBiasSignal({ title: 'Officials publish a report', summary: 'According to the study, the data changed.' });
  const loaded = _internal.assessBiasSignal({ title: 'Shocking disaster!', summary: 'This radical policy will obviously destroy everything.' });
  assert.ok(neutral.score >= 0 && neutral.score <= 100);
  assert.ok(loaded.score >= 0 && loaded.score <= 100);
  assert.ok(loaded.score > neutral.score);
  assert.ok(loaded.signals.length > 0);
});

test('source-based synthesis remains useful when the AI provider is unavailable', () => {
  const result = _internal.fallbackSynthesis('climate policy', [
    { name: 'Example News', summary: 'Lawmakers introduced a new emissions proposal.', frame: 'Political' },
  ]);
  assert.match(result.summary.content, /Example News reports/);
  assert.match(result.summary.content, /political dimensions/i);
  assert.equal(result.blindSpots.length, 3);
});
