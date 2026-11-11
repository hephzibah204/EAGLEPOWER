import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeThreatTelemetry } from '../src/utils/threatTelemetry.js';

test('both deployed threat response shapes produce a renderable ban list', () => {
  assert.deepEqual(normalizeThreatTelemetry({banned_ips: [], banned_ips_count: 0}).bannedIps, []);
  const row = {ip: '192.0.2.1'};
  assert.deepEqual(normalizeThreatTelemetry({bannedIps: [row]}).bannedIps, [row]);
  assert.equal(normalizeThreatTelemetry({banned_ips: [row]}).totalBanned, 1);
});
test('missing or malformed ban collections cannot reach array rendering', () => {
  for (const data of [{}, {bannedIps: null}, {bannedIps: {}}, {banned_ips: 'unavailable'}]) {
    assert.deepEqual(normalizeThreatTelemetry(data).bannedIps, []);
  }
  assert.equal(normalizeThreatTelemetry(null), null);
  assert.equal(normalizeThreatTelemetry([]), null);
});
