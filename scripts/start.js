#!/usr/bin/env node
const net = require('net');
const { spawn } = require('child_process');

const DEFAULT_PORT = 3000;
const MAX_PORT = 3010;
const desiredPort = Number(process.env.PORT) || DEFAULT_PORT;

const checkPort = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '127.0.0.1');
  });

const findAvailablePort = async () => {
  for (let port = desiredPort; port <= MAX_PORT; port += 1) {
    if (await checkPort(port)) {
      return port;
    }
  }
  return null;
};

(async () => {
  const port = await findAvailablePort();

  if (!port) {
    console.error(`No available ports found between ${desiredPort} and ${MAX_PORT}.`);
    process.exit(1);
  }

  if (port !== desiredPort) {
    console.warn(`Port ${desiredPort} is in use, starting on ${port} instead.`);
  }

  const cmd = `npx next start -p ${port}`;
  const child = spawn(cmd, { stdio: 'inherit', shell: true });

  child.on('exit', (code) => process.exit(code));
})();
