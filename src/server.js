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
        console.log('socket', data);
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
    console.log(jsonMessage);
    const action = jsonMessage.action;
    const data = jsonMessage.data;
    switch (action) {
        case 'connected':
            console.log(wss.clients);
            socket.id = jsonMessage.data.NAME;
            socket.sharing = data.sharing;
            emitMessage(socket, { action: 'welcome', data: getClients() });
            console.log(wss.clients);
            break;
        case 'sharing':
            socket.sharing = true;
            break;
        case 'get-share':
            const sharing = getShared();
            if (sharing) {
                emitMessage(socket, { action: 'sharing', data: sharing.id });
            }
            else
                emitMessage(socket, { action: 'no-sharing' });
            break;
        case 'dispatch':
            break;
        default:
            if (!jsonMessage.to)
                return;
            const remotePeerSocket = getSocketById(jsonMessage.to);
            if (!remotePeerSocket) {
                return console.log('failed to find remote socket with id', jsonMessage.to);
            }
            /* if (jsonMessage.action !== 'offer') {
               delete jsonMessage.data.remoteId;
             } else {
               jsonMessage.data.remoteId = socket.id;
             }*/
            emitMessage(remotePeerSocket, jsonMessage);
    }
};
const emitMessage = (socket, jsonMessage) => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(jsonMessage));
    }
};
function getShared() {
    return Array.from(wss.clients).find(clients => clients.sharing);
}
// @ts-ignore
const getClients = () => Array.from(wss.clients).map(clients => clients.id);
// @ts-ignore
const getSocketById = (socketId) => Array.from(wss.clients).find((client => client.id === socketId));
wsServer.listen(8888);
console.log('app server listening on port 3000');
console.log('wss server listening on port 8888');
//# sourceMappingURL=server.js.map