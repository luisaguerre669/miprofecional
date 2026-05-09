const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle root request
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './miprofesional-app.html'; // Default to our new app
  }

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  // Read file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found, try with .html extension
        fs.readFile(filePath + '.html', (error, content) => {
          if (error) {
            // 404
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1><p>The page you requested could not be found.</p>', 'utf-8');
          } else {
            // Found with .html extension
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Archivos disponibles:');
  console.log('- miprofesional-app.html (nueva aplicación completa)');
  console.log('- index-original.html (versión anterior optimizada)');
  console.log('- landing-minimalista.html (versión minimalista)');
  console.log('- index-ultra-simple.html (versión ultra-simple)');
  console.log('- index-fixed.html (versión corregida)');
});
