const { createServer } = require('node:http');
const { parse } = require('node:url');
const next = require('next');

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || '127.0.0.1';
const app = next({ dev: false, dir: './apps/web' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(port, hostname, () => {
    console.log(`MKT Academy ready on http://${hostname}:${port}`);
  });
});
