// Required Packages
const express             = require('express');
const qrcode              = require('qrcode');
const {Client, LocalAuth} = require('whatsapp-web.js');
const net                 = require('net');
const {execSync}          = require('child_process');
const app                 = express();
const port                = 3000;
// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// Function to Ensure Port Availability
async function ensurePortAvailable(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                try {
                    const platform = process.platform;
                    if (platform === 'win32') {
                        const output = execSync(`netstat -ano | findstr :${port}`).toString();
                        const pid    = output.trim().split(/\s+/).pop();
                        execSync(`taskkill /PID ${pid} /F`);
                    }
                    else {
                        const pid = execSync(`lsof -t -i:${port}`).toString().trim();
                        execSync(`kill -9 ${pid}`);
                    }
                    resolve();
                }
                catch (killErr) {
                    reject(killErr);
                }
            }
            else {
                reject(err);
            }
        });
        server.once('listening', () => {
            server.close(resolve);
        });
        server.listen(port);
    });
}
// WhatsApp Client Configuration
const client        = new Client({
                                     authStrategy: new LocalAuth(),
                                     puppeteer   : {
                                         headless: true,
                                         args    : [
                                             '--no-sandbox', // Disable sandboxing for environments like Docker
                                             '--disable-setuid-sandbox',
                                             '--disable-dev-shm-usage', // Reduce shared memory usage
                                             '--disable-accelerated-2d-canvas',
                                             '--disable-gpu', // Disable GPU acceleration
                                             '--no-first-run',
                                             '--no-zygote',
                                             '--single-process' // Run as a single process
                                         ]
                                     }
                                 });
let qrCode          = null;
let clientInfo      = null;
let isAuthenticated = false;
let isReady         = false;
// Event Listeners
client.on('qr', (qr) => {
    qrCode = qr;
    console.log('QR Code received. Scan it with your WhatsApp.');
});
client.on('ready', () => {
    isReady    = true;
    qrCode     = null;
    clientInfo = client.info;
    console.log('WhatsApp client is ready.');
});
client.on('authenticated', () => {
    isAuthenticated = true;
    console.log('WhatsApp client authenticated.');
});
client.on('disconnected', (reason) => {
    console.error('Client disconnected:', reason);
    isAuthenticated = false;
    isReady         = false;
    client.destroy().then(() => {
        console.log('Restarting client...');
        client.initialize();
    });
});
client.on('error', (err) => {
    console.error('Client encountered an error:', err);
    client.destroy().then(() => {
        console.log('Reinitializing client after error...');
        client.initialize();
    });
});
client.on('auth_failure', (msg) => {
    console.error('Authentication failure:', msg);
});
client.initialize();
// Routes
// Generate QR Code
app.get('/create/qr', async (req, res) => {
    try {
        if (qrCode) {
            const qrImage = await qrcode.toDataURL(qrCode);
            res.send(`<img src="${qrImage}" alt="QR Code" />`);
        }
        else if (isReady) {
            res.json({
                         message   : 'Client is ready.',
                         clientInfo: {
                             pushname: clientInfo.pushname,
                             wid     : clientInfo.wid._serialized,
                             platform: clientInfo.platform
                         }
                     });
        }
        else {
            res.status(400).json({message: 'QR Code not available yet.'});
        }
    }
    catch (err) {
        res.status(500).json({error: 'Failed to generate QR code.', details: err.message});
    }
});
// Send Message
app.post('/send/message', async (req, res) => {
    const {to, message} = req.body;
    if (!to || !message) {
        return res.status(400).json({error: 'Recipient (to) and message are required.'});
    }
    try {
        const chatId = `${to}@c.us`;
        await client.sendMessage(chatId, message);
        res.json({message: 'Message sent successfully.'});
    }
    catch (err) {
        res.status(500).json({error: 'Failed to send message.', details: err.message});
    }
});
// Send Group Message
app.post('/send/group-message', async (req, res) => {
    const {groupId, message} = req.body;
    if (!groupId || !message) {
        return res.status(400).json({error: 'Group ID and message are required.'});
    }
    try {
        const groupChatId = `${groupId}@g.us`;
        await client.sendMessage(groupChatId, message);
        res.json({message: 'Message sent to group successfully.'});
    }
    catch (err) {
        res.status(500).json({error: 'Failed to send group message.', details: err.message});
    }
});
// Client Status
app.get('/status', (req, res) => {
    res.json({
                 isAuthenticated,
                 isReady,
                 message: isReady
                          ? 'Client is ready.'
                          : isAuthenticated
                            ? 'Client is authenticated but not ready.'
                            : 'Client is not authenticated.'
             });
});
// Start Server
ensurePortAvailable(port)
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('Error ensuring port availability:', err.message);
        process.exit(1);
    });
