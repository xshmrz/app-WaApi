// Load required packages
const express             = require('express');
const qrcode              = require('qrcode');
const {Client, LocalAuth} = require('whatsapp-web.js');
const fs                  = require('fs');
const path                = require('path');
const net                 = require('net');
const {execSync}          = require('child_process');
const app                 = express();
const port                = 3000;
// Function to check port availability and release if in use
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
// Initialize the WhatsApp client
const client          = new Client({
                                       authStrategy: new LocalAuth()
                                   });
let qrCode            = null;
let isAuthenticated   = false;
let isReady           = false;
let isQrCodeAvailable = false;
let clientInfo        = null;
// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({extended: true}));
// Event listener for receiving QR code
client.on('qr', (qr) => {
    qrCode            = qr;
    isQrCodeAvailable = true;
});
// Event listener for when the client is ready
client.on('ready', () => {
    qrCode            = null; // Clear QR code
    isReady           = true;
    isQrCodeAvailable = false;
    clientInfo        = client.info; // Save client information
});
// Event listener for successful authentication
client.on('authenticated', () => {
    isAuthenticated = true;
});
// Event listener for client disconnection
client.on('disconnected', (reason) => {
    qrCode            = null;
    isAuthenticated   = false;
    isReady           = false;
    isQrCodeAvailable = false;
    clientInfo        = null;
    client.destroy();
    client.initialize();
});
client.initialize();
// Endpoint to generate QR code
app.get('/create/qr', async (req, res) => {
    try {
        while (!isQrCodeAvailable && !isReady) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
        if (isQrCodeAvailable) {
            const qrImage = await qrcode.toDataURL(qrCode);
            return res.send(`<img src="${qrImage}" alt="QR Code" />`);
        }
        else if (isReady) {
            return res.send({
                                message   : 'Client is already ready. No QR code available.',
                                clientInfo: {
                                    pushname: clientInfo.pushname,
                                    wid     : clientInfo.wid._serialized,
                                    platform: clientInfo.platform
                                }
                            });
        }
    }
    catch (err) {
        return res.status(500).send({error: 'Failed to generate QR code.', details: err.message});
    }
});
// Endpoint to send a message
app.post('/send/message', async (req, res) => {
    try {
        const { to, message } = req.body;
        if (!to || !message) {
            return res.status(400).send({ error: 'Recipient (to) and message are required' });
        }
        const phoneRegex = /^[1-9][0-9]{10,14}$/;
        if (!phoneRegex.test(to)) {
            return res.status(400).send({ error: 'Invalid phone number format. Use international format without "+" (e.g., 905xxxxxxxxx).' });
        }
        const chatId = `${to}@c.us`;
        await client.sendMessage(chatId, message);
        return res.send({ message: 'Message sent successfully.' });
    } catch (err) {
        return res.status(500).send({ error: 'Failed to send message', details: err.message });
    }
});
// Endpoint to send a message to a group
app.post('/send/group-message', async (req, res) => {
    try {
        const { groupId, message } = req.body;
        if (!groupId || !message) {
            return res.status(400).send({ error: 'Group ID (groupId) and message are required' });
        }
        const groupChatId = `${groupId}@g.us`;
        await client.sendMessage(groupChatId, message);
        return res.send({ message: 'Message sent to group successfully.' });
    } catch (err) {
        return res.status(500).send({ error: 'Failed to send message to group', details: err.message });
    }
});
// Endpoint to check client status
app.get('/status', async (req, res) => {
    try {
        return res.send({
                            isAuthenticated,
                            isReady,
                            message: isReady ? 'Client is ready.' : (isAuthenticated ? 'Client is authenticated but not ready.' : 'Client is not authenticated.')
                        });
    }
    catch (err) {
        return res.status(500).send({error: 'Failed to retrieve status.', details: err.message});
    }
});
// Start the server
ensurePortAvailable(port)
    .then(() => {
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
