import test from 'node:test';
import assert from 'node:assert/strict';
import axios, { AxiosError } from 'axios';
import { installSafeGetRetry } from './getRetry.ts';

function fixture(status, code, method = 'get', signal) {
  let calls = 0;
  const client = axios.create({ adapter: async config => {
    calls++;
    if (calls === 1 || status === 503) {
      const response = status ? { status, statusText: '', headers: {}, data: {}, config } : undefined;
      throw new AxiosError('fixture failure', code, config, undefined, response);
    }
    return { status: 200, statusText: 'OK', headers: {}, data: 'ready', config };
  }});
  return { client, request: () => client.request({ method, url: '/fixture', signal }), calls: () => calls };
}

for (const [status, code] of [[502], [503], [undefined, 'ERR_NETWORK']]) {
  test(`GET transient ${status ?? code} is attempted only once more`, async () => {
    const f = fixture(status, code);
    let delays = 0;
    installSafeGetRetry(f.client, async () => { delays++; });
    if (status === 503) await assert.rejects(f.request());
    else assert.equal((await f.request()).data, 'ready');
    assert.equal(f.calls(), 2);
    assert.equal(delays, 1);
  });
}

for (const [status, code, method] of [[401, undefined, 'get'], [403, undefined, 'get'],
  [500, undefined, 'get'], [504, undefined, 'get'], [502, undefined, 'post'],
  [503, undefined, 'put'], [undefined, 'ERR_CANCELED', 'get']]) {
  test(`${method.toUpperCase()} ${status ?? code} is never repeated`, async () => {
    const f = fixture(status, code, method);
    installSafeGetRetry(f.client, async () => assert.fail('unexpected delay'));
    await assert.rejects(f.request());
    assert.equal(f.calls(), 1);
  });
}

test('cancellation during backoff prevents the second HTTP request', async () => {
  const controller = new AbortController();
  const f = fixture(502, undefined, 'get', controller.signal);
  installSafeGetRetry(f.client);
  const request = f.request();
  setTimeout(() => controller.abort(), 0);
  await assert.rejects(request, error => axios.isCancel(error));
  assert.equal(f.calls(), 1);
});
