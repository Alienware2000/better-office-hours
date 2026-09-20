// Preloaded only by the offline regression gate. Tests may install their own
// fake fetch, but an unmocked provider or server request must fail closed.
/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preload must be CommonJS. */
const blocked = () => { throw new Error('Network disabled in the offline candidate gate. Use a separate explicit live/browser check.'); };
globalThis.fetch = blocked;
for (const name of ['node:http', 'node:https']) {
  const transport = require(name); transport.request = blocked; transport.get = blocked;
}
for (const name of ['node:net', 'node:tls']) {
  const transport = require(name); transport.connect = blocked;
  if (transport.createConnection) transport.createConnection = blocked;
}
