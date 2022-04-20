// @ts-ignore
const pcConfig = {
    'iceServers': [{
            'urls': 'stun:stun.l.google.com:19302'
        }]
};
// @ts-ignore
const ar = window.location.host.split(':');
const socketCon = new WebSocket('wss://' + ar[0] + ':8888');
socketCon.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    const action = msg.action;
    const sender_id = msg.sender_id;
    const data = msg.data;
    if (action) {
        onSocketAction(action, data, sender_id);
    }
    else {
        onSocketMessage(msg);
    }
};
function sendAction(to, action, data) {
    console.log('sending' + to + action, data);
    socketCon.send(JSON.stringify({ to, action, data }));
}
socketCon.onerror = (error) => {
    console.error('socket::error', error);
};
socketCon.onclose = () => {
    console.log('socket::close');
    /// stopAll();
};
socketCon.onopen = async () => {
    console.log('socket::open');
    sendAction(null, 'start', NAME);
};
function getRemote(action, data) {
    return new Promise(function (resole, reject) {
        const onData = (evt) => {
            const msg = JSON.parse(evt.data);
            console.log(msg);
            const act = msg.action;
            const data = msg.data;
            if (act === action) {
                socketCon.removeEventListener('message', onData);
                resole(data);
            }
        };
        socketCon.addEventListener('message', onData);
    });
}
//# sourceMappingURL=socket-connection.js.map