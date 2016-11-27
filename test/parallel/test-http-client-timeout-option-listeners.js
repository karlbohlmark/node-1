'use strict';
const common = require('../common');
const http = require('http');
const assert = require('assert');

const agent = new http.Agent({ keepAlive: true });

const server = http.createServer((req, res) => {
  res.end('');
});

const options = {
  agent,
  method: 'GET',
  port: undefined,
  host: common.localhostIPv4,
  path: '/',
  timeout: common.platformTimeout(100)
};

server.listen(0, options.host, () => {
  options.port = server.address().port;
  doRequest((numListeners) => {
    assert.strictEqual(numListeners, 1);
    doRequest((numListeners) => {
      assert.strictEqual(numListeners, 1);
      server.close();
      agent.destroy();
    });
  });
});

function doRequest(cb) {
  http.request(options, common.mustCall((response) => {
    const sockets = agent.sockets[`${options.host}:${options.port}:`];
    assert.strictEqual(sockets.length, 1);
    const socket = sockets[0];
    const numListeners = socket.listeners('timeout').length;
    response.resume();
    response.once('end', () => {
      process.nextTick(cb, numListeners);
    });
  })).end();
}
