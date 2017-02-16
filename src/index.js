const express     = require('express');
const path        = require('path');
const serveStatic = require('serve-static');

const PORT = 8080;

const staticPath = path.join(__dirname, 'static');

express()
  .use(serveStatic(staticPath))
  .listen(PORT)

console.log(`running at localhost:${ PORT }`);
