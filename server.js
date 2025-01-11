// Gerekli paketleri yükleme
const express             = require('express');
const qrcode              = require('qrcode');
const {Client, LocalAuth} = require('whatsapp-web.js');
const fs                  = require('fs');
const path                = require('path');
const net                 = require('net');
const {execSync}          = require('child_process');
const app                 = express();
const port                = 3000;
// Port kontrolü ve serbest bırakma fonksiyonu
async function ensurePortAvailable(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.warn(`Port ${port} is in use. Attempting to free it...`);
                try {
                    const platform = process.platform;
                    if (platform === 'win32') {
                        // Windows için işlem sonlandırma
                        const output = execSync(`netstat -ano | findstr :${port}`).toString();
                        const pid    = output.trim().split(/\s+/).pop();
                        execSync(`taskkill /PID ${pid} /F`);
                    }
                    else {
                        // Unix tabanlı sistemler için işlem sonlandırma
                        const pid = execSync(`lsof -t -i:${port}`).toString().trim();
                        execSync(`kill -9 ${pid}`);
                    }
                    console.log(`Port ${port} has been freed.`);
                    resolve();
                }
                catch (killErr) {
                    console.error(`Failed to free port ${port}:`, killErr.message);
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
// WhatsApp istemcisini başlat
const client          = new Client({
                                       authStrategy: new LocalAuth()
                                   });
let qrCode            = null;
let isAuthenticated   = false;
let isReady           = false;
let isQrCodeAvailable = false;
let clientInfo        = null;
client.on('qr', (qr) => {
    qrCode            = qr;
    isQrCodeAvailable = true;
    console.log('QR Code received. Scan it with your WhatsApp.');
});
client.on('ready', () => {
    console.log('WhatsApp client is ready.');
    qrCode            = null; // QR kodu temizle
    isReady           = true;
    isQrCodeAvailable = false;
    clientInfo        = client.info; // Client bilgilerini kaydet
});
client.on('authenticated', () => {
    console.log('WhatsApp client is authenticated.');
    isAuthenticated = true;
});
client.on('disconnected', (reason) => {
    console.log('WhatsApp client was logged out:', reason);
    qrCode            = null;
    isAuthenticated   = false;
    isReady           = false;
    isQrCodeAvailable = false;
    clientInfo        = null;
    client.destroy();
    client.initialize();
});
client.initialize();
// QR kod oluşturma endpointi
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
// Mesaj gönderme endpointi
app.get('/send/message', async (req, res) => {
    try {
        const {to, message} = req.query;
        if (!to || !message) {
            return res.status(400).send({error: 'Recipient (to) and message are required'});
        }
        const phoneRegex = /^[1-9][0-9]{10,14}$/;
        if (!phoneRegex.test(to)) {
            return res.status(400).send({error: 'Invalid phone number format. Use international format without "+" (e.g., 905xxxxxxxxx).'});
        }
        const chatId = `${to}@c.us`;
        await client.sendMessage(chatId, message);
        return res.send({message: 'Message sent successfully.'});
    }
    catch (err) {
        return res.status(500).send({error: 'Failed to send message', details: err.message});
    }
});
// Durum kontrol endpointi
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
// Sunucuyu başlat
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
