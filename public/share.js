// @ts-ignore
const NAME = 'shared';
let localStream;
let peerShared;
const localVid = document.querySelector('#localVideo');
let client_id;
function setClientsS(clients) {
    let str = '';
    clients.forEach(function (v) {
        str += '<li>' + v.id + ' <b> ' + v.sharing + '</b></li>';
    });
    document.getElementById('clients').innerHTML = str;
    const client = clients.find(v => !v.sharing);
    client_id = client?.id;
    /*if(clients.length > 1) {
        if(!peer5) peer5 = await createPeerConnection();
        if(isSharing) {
            addTracks5(peer5);
            const offer = await createOffer5(peer5);
            clients.forEach(function (v) {
                if(!v.sharing) {
                    sendAction5(v.id, 'offer', offer);
                }
            })

        }
    }    */
}
// @ts-ignore
async function onSocketAction(action, data, sender_id) {
    switch (action) {
        case 'welcome':
            setClientsS(data);
            break;
        case 'answer':
            peerShared.setRemoteDescription(new RTCSessionDescription(data));
            break;
        case 'candidate':
            data.type = 'candidate';
            peerShared.addIceCandidate(data).then(res => {
                /// console.log(res);
            });
    }
}
// @ts-ignore
function onSocketMessage(msg) {
}
async function sendOfferS() {
    if (!peerShared)
        peerShared = await createPeerConnectionS();
    const tracks = localStream.getTracks();
    console.log('tracks', tracks);
    tracks.forEach(function (v) {
        peerShared.addTrack(v);
    });
    const offer = await peerShared.createOffer();
    await peerShared.setLocalDescription(offer);
    if (client_id)
        sendAction(client_id, 'offer', offer);
    else
        console.warn(' NO CLIENT ');
}
function createPeerConnectionS() {
    const peer = new RTCPeerConnection(pcConfig);
    peer.onicecandidate = ({ candidate }) => {
        console.log('icecandidate shared: ', candidate);
        if (!candidate)
            return;
        if (!client_id) {
            console.warn(' no client id');
            return;
        }
        sendAction(client_id, 'candidate', candidate);
        /*  sdpMLineIndex: evt.candidate.sdpMLineIndex,
          /// id: evt.candidate.sdpMid
          candidate: evt.candidate.candidate}*/
    };
    peer.oniceconnectionstatechange = () => {
        console.log('PEER_CHANGED=', peerShared.iceConnectionState);
        // If ICE state is disconnected stop
        /* if (peerConnection.iceConnectionState === 'disconnected') {
             alert('Connection has been closed stopping...');
             ///  socket.close();
         }*/
    };
    peer.ontrack = ({ track }) => {
        console.log('ONTRACK', track);
        /* if(!remoteStream5) remoteStream5 = new MediaStream();
         remoteStream5.addTrack(track);
         // @ts-ignore
         localVideo5.srcObject = remoteStream5;*/
    };
    peer.ondatachannel = ({ channel }) => {
        console.log('ON_DATA_CHANNEL ');
        dataChannel = channel;
        /// initializeDataChannelListeners();
    };
    // @ts-ignore
    peer.onaddstream = (evt) => {
        console.log(' remote stream added');
        // remoteStream = evt.stream;
        // remoteVideo5.srcObject = remoteStream;
    };
    // @ts-ignore
    peer.onremovestream = (evt) => {
        console.log('remote removed');
    };
    console.log('Created RTCPeerConnection');
    return peer;
}
async function shareScreenS() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
    catch (error) {
        console.warn('failed to get local media stream', error);
    }
    if (localStream) {
        // @ts-ignore
        localVideo.srcObject = localStream;
        sendAction(null, 'sharing', null);
        // maybeStart();
    }
}
//# sourceMappingURL=share.js.map