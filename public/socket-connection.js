const socketCon = new WebSocket('wss://' + ar1[0] + ':8888');
socketCon.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    console.log(msg);
    const action = msg.action;
    const sender_id = msg.sender_id;
    const data = msg.data;
    if (action) {
        onSocketAction5(action, data, sender_id);
    }
    else {
        onSocketMessage5(msg);
    }
};
function sendAction5(to, action, data) {
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
    sendAction5(null, 'start', NAME);
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