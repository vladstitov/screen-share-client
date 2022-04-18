"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const app = express();
const createHttpsServer = () => {
    return https.createServer({
        cert: fs.readFileSync(path.resolve(__dirname, './../ssl/cert.pem')),
        key: fs.readFileSync(path.resolve(__dirname, './../ssl/cert.key'))
    });
};
const appServer = https.createServer({
    cert: fs.readFileSync(path.resolve(__dirname, './../ssl/cert.pem')),
    key: fs.readFileSync(path.resolve(__dirname, './../ssl/cert.key'))
}, app).listen(3000);
app.use(express.static(path.resolve(__dirname, './../public')));
const wsServer = https.createServer({
    cert: fs.readFileSync(path.resolve(__dirname, './../ssl/cert.pem')),
    key: fs.readFileSync(path.resolve(__dirname, './../ssl/cert.key'))
});
const wss = new WebSocket.Server({ server: wsServer });
wss.on('connection', (socket) => {
    console.log('new connection');
    socket.on('message', (data) => {
        try {
            const jsonMessage = JSON.parse(String(data));
            handleJsonMessage(socket, jsonMessage);
        }
        catch (error) {
            console.error('failed to handle onmessage', error);
        }
    });
    socket.once('close', () => {
        console.log('socket::close');
    });
});
const handleJsonMessage = (socket, jsonMessage) => {
    const action = jsonMessage.action;
    const to = jsonMessage.to;
    const data = jsonMessage.data;
    const sender_id = socket.id;
    switch (action) {
        case 'start':
            socket.id = jsonMessage.data.NAME;
            emitMessage(socket, { action: 'welcome', data: getClients() });
            break;
        case 'sharing':
            socket.sharing = true;
            break;
        case 'get-share':
            const sharing = getShared();
            emitMessage(socket, { action: 'sharing', data: sharing?.id });
            break;
        case 'connected':
            for (let item of wss.clients) {
                if (item !== socket)
                    emitMessage(item, { action: 'client', data: { id: socket.id, sharing: socket.sharing } });
            }
            break;
        default:
            if (!to) {
                console.log('ERROR  no to');
                return;
            }
            const client = getSocketById(to);
            if (!client) {
                return console.log('failed to find remote socket with to ' + to);
            }
            /* if (jsonMessage.action !== 'offer') {
               delete jsonMessage.data.remoteId;
             } else {
               jsonMessage.data.remoteId = socket.id;
             }*/
            emitMessage(client, { action, data, sender_id });
    }
};
const emitMessage = (socket, obj) => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(obj));
    }
    else
        console.log('ERROR CLOSED ' + socket.id);
};
function getShared() {
    return Array.from(wss.clients).find(clients => clients.sharing);
}
// @ts-ignore
const getClients = () => Array.from(wss.clients).map(clients => {
    return { id: clients.id, sharing: clients.sharing };
});
// @ts-ignore
const getSocketById = (socketId) => Array.from(wss.clients).find((client => client.id === socketId));
wsServer.listen(8888);
console.log('app server listening on port 3000');
console.log('wss server listening on port 8888');
//# sourceMappingURL=server.js.map