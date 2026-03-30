const http = require('http');
const path = require('path');
const fs = require('fs');
const serveStatic = require('serve-static');
const connect = require('connect');

const app = connect();
const staticDir = path.join(__dirname, '../dist');
const serve = serveStatic(staticDir);

app.use((req, res, next) => {
  serve(req, res, (err) => {
    if (err) return next(err);
    // Fallback for SPA
    if (req.method === 'GET' && req.headers.accept && req.headers.accept.includes('text/html')) {
      fs.readFile(path.join(staticDir, 'index.html'), (readErr, content) => {
        if (readErr) {
            res.statusCode = 500;
            res.end('Error loading index.html');
            return;
        }
        res.setHeader('Content-Type', 'text/html');
        res.end(content);
      });
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });
});

const server = http.createServer(app);
server.listen(8080);
console.log('Server running at http://localhost:8080');
