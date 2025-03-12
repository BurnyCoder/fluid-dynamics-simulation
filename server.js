const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Parse URL
    const parsedUrl = url.parse(req.url);
    
    // Extract the path from the URL
    let pathname = `.${parsedUrl.pathname}`;
    
    // If path ends with '/', serve index.html
    if (pathname === './') {
        pathname = './index.html';
    }

    // Get the file extension
    const ext = path.parse(pathname).ext;

    // Maps file extension to MIME type
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read the file from the file system
    fs.readFile(pathname, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                fs.readFile('./index.html', (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end(`Error loading index.html: ${err.code}`);
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(data);
                });
                return;
            }
            // Server error
            res.writeHead(500);
            res.end(`Server Error: ${err.code}`);
            return;
        }
        // Success - send the file
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Fluid Dynamics Simulation running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
}); 