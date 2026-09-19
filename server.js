/**
 * Local development server for NordiqFlow
 * Serves static files and API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Load API handlers dynamically
const apiHandlers = {};

function loadApiHandler(apiPath) {
    const handlerPath = path.join(__dirname, 'api', apiPath + '.js');
    if (fs.existsSync(handlerPath)) {
        // Clear require cache to allow hot reloading
        delete require.cache[require.resolve(handlerPath)];
        return require(handlerPath);
    }
    return null;
}

// Create mock request/response objects for Vercel-style handlers
function createVercelRequest(req, parsedUrl, body) {
    return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: Object.fromEntries(parsedUrl.searchParams),
        body: body
    };
}

function createVercelResponse(res) {
    return {
        statusCode: 200,
        headers: {},
        setHeader(key, value) {
            this.headers[key] = value;
            res.setHeader(key, value);
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(this.statusCode);
            res.end(JSON.stringify(data));
        },
        send(data) {
            res.writeHead(this.statusCode);
            res.end(data);
        },
        end() {
            res.writeHead(this.statusCode);
            res.end();
        }
    };
}

// Parse request body
function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve(body);
            }
        });
    });
}

// Serve static file
function serveStatic(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.setHeader('Content-Type', contentType);
        res.writeHead(200);
        res.end(data);
    });
}

// Main request handler
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API routes
    if (pathname.startsWith('/api/')) {
        const apiName = pathname.replace('/api/', '').replace(/\/$/, '');
        const handler = loadApiHandler(apiName);

        if (handler) {
            try {
                const body = await parseBody(req);
                const vercelReq = createVercelRequest(req, parsedUrl, body);
                const vercelRes = createVercelResponse(res);
                await handler(vercelReq, vercelRes);
            } catch (err) {
                console.error('API Error:', err);
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'API not found' }));
        }
        return;
    }

    // Static file routes
    let filePath = pathname === '/' ? '/index.html' : pathname;

    // Add .html extension for clean URLs
    if (!path.extname(filePath)) {
        filePath += '.html';
    }

    const fullPath = path.join(__dirname, filePath);

    // Check if file exists
    if (fs.existsSync(fullPath)) {
        serveStatic(res, fullPath);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   NordiqFlow Development Server                           ║
║   ─────────────────────────────────────────────────────   ║
║                                                           ║
║   Local:   http://localhost:${PORT}                          ║
║   Demo:    http://localhost:${PORT}/demo                     ║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
