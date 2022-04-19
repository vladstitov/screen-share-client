import * as express from  'express';
import * as https  from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as WebSocket from "ws";
import {Server} from "ws";
const app = express();

interface MySocket extends WebSocket {
  id: string;
  sharing: boolean;

}

interface MyServer extends Server {
  clients:Set<MySocket>
}


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


const wss: MyServer = new WebSocket.Server({ server: wsServer }) as any;

wss.on('connection', (socket) => {
  console.log('new connection');
  socket.on('message', (data) => {
    try {
      const jsonMessage = JSON.parse(String(data));
      handleJsonMessage(socket, jsonMessage);
    } catch (error) {
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
  console.log(action,sender_id, data );

  switch (action) {
    case 'start':
      socket.id = data;
      const clients = getClients();
      for(let item of wss.clients) {
         emitMessage(item, {action:'welcome', data: clients});
      }
      break;
    case 'sharing':
      socket.sharing = true;
      const clients2 = getClients();
      for(let item of wss.clients) {
        emitMessage(item, {action:'welcome', data: clients2});
      }
      break;

    default:
      if (!to) {
        console.log('ERROR  no to')
        return
      }
      if(to === 'others') {
        for(let item of wss.clients) {
          if(item !== socket)  emitMessage(item, {action: action, data});
        }
      } else {
        const client = getSocketById(to);
        if (!client) emitMessage(socket, {action: 'error', data: 'no ' + sender_id});
        else  emitMessage(client, {action, data, sender_id});
      }



     /* if (jsonMessage.action !== 'offer') {
        delete jsonMessage.data.remoteId;
      } else {
        jsonMessage.data.remoteId = socket.id;
      }*/




  }
};


const emitMessage = (socket, obj ) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(obj));
  } else console.log('ERROR CLOSED ' + socket.id)
};


function getShared(): MySocket {
  return Array.from(wss.clients).find(clients => clients.sharing) as any;
}

// @ts-ignore
const getClients = () => Array.from(wss.clients).map(clients => {
  return {id:clients.id, sharing: clients.sharing}});
// @ts-ignore
const getSocketById = (socketId) => Array.from(wss.clients).find((client => client.id === socketId));

wsServer.listen(8888);
console.log('app server listening on port 3000');
console.log('wss server listening on port 8888');
