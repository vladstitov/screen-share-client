'use strict';
var isChannelReady = false;
let isSharing = false;
let localStream5;
let peer5;
let remoteStream5;
var turnReady;
let shared_id = {
    get() {
        return this.id;
    },
    id: null,
    set(id) {
        this.id = id;
        document.getElementById('shared_id').innerText = id;
    }
};
let clients = {
    get() {
        return this.clients;
    },
    clients: null,
    async set(clients) {
        this.clients = clients;
        let str = '';
        clients.forEach(function (v) {
            str += '<li>' + v.id + ' <b> ' + v.sharing + '</b></li>';
        });
        document.getElementById('clients').innerHTML = str;
        if (clients.length > 1) {
            if (!peer5)
                peer5 = await createPeerConnection();
            if (isSharing) {
                addTracks5(peer5);
                const offer = await createOffer5(peer5);
                clients.forEach(function (v) {
                    if (!v.sharing) {
                        sendAction5(v.id, 'offer', offer);
                    }
                });
            }
        }
    }
};
var pcConfig = {
    'iceServers': [{
            'urls': 'stun:stun.l.google.com:19302'
        }]
};
const NAME1 = window.location.hash?.slice(1) || Date.now().toString();
console.log(NAME1);
const ar1 = window.location.host.split(':');
// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};
/////////////////////////////////////////////
var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');
function socketEmit(msg, data) {
    console.log('!!!!!!! emit socket');
}
function onSocketMessage5(data) {
    console.log(' on socket message ', data);
}
function sendMessage5(message) {
}
function onSocketAction5(action, data, sender_id) {
    console.log('action:' + action + ' sender ' + sender_id, data);
    switch (action) {
        case 'welcome':
            console.log(data);
            clients.set(data);
            break;
        case 'offer':
            setOfferGetAnswer(peer5, data).then(answer => {
                sendAction5(sender_id, 'answer', answer);
            });
            break;
        case 'answer':
            peer5.setRemoteDescription(new RTCSessionDescription(data));
            break;
        case 'candidate':
            ///if(isStarted) {
            const candidate = new RTCIceCandidate({
                sdpMLineIndex: data.label,
                candidate: data.candidate
            });
            peer5.addIceCandidate(candidate);
            //}
            break;
        case 'bye':
            /// if(isStarted) {
            handleRemoteHangup();
            //}
            break;
        default:
            break;
    }
    /* if (action === 'got user media') {
       maybeStart();
     } else if (action === 'offer') {
       if (!isInitiator && !isStarted) {
         maybeStart();
       }
       peer.setRemoteDescription(new RTCSessionDescription(data));
       doAnswer();
     } else if (action === 'answer' && isStarted) {
       peer.setRemoteDescription(new RTCSessionDescription(data));
     } else if (action === 'candidate' && isStarted) {
       const candidate = new RTCIceCandidate({
         sdpMLineIndex: data.label,
         candidate: data.candidate
       });
       peer.addIceCandidate(candidate);
     } else if (action === 'bye' && isStarted) {
       handleRemoteHangup();
     }*/
}
///////////////////////////////////////////////////////////
function messageAction(action) {
    switch (action) {
        case 'join':
            isChannelReady = true;
            break;
    }
}
////////////////////////////////////////////////
////////////////////////////////////////////////////
const localVideo5 = document.querySelector('#localVideo');
const remoteVideo5 = document.querySelector('#remoteVideo');
var constraints = {
    video: true
};
console.log('Getting user media with constraints', constraints);
/*
if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}*/
function addTracks5(peer) {
    const tracks = localStream5.getTracks();
    tracks.forEach(function (v) {
        console.log('adding track ', v);
        peer.addTrack(v);
    });
}
function maybeStart() {
    console.log('maybeStart() isChannelReady ' + isChannelReady + '  isStaring' + isSharing + ' localStream ', localStream5?.getTracks());
    /*  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
    
    
    
        isStarted = true;
        console.log('isInitiator', isSharing);
        if (isSharing) {
          /// doCall();
        }
      }*/
}
/*
window.onbeforeunload = function() {
  sendMessage('bye');
};
*/
/////////////////////////////////////////////////////////
function createPeerConnection() {
    const peer = new RTCPeerConnection(pcConfig);
    peer.onicecandidate = handleIceCandidate;
    peer.onicecandidate = ({ candidate }) => {
        if (!candidate)
            return;
        console.log('ICECANDIDATE', candidate.foundation);
        /// sendSocketMessage( {to: sharedID, action: 'iceCandidate', data:{ candidate} });
    };
    peer.oniceconnectionstatechange = () => {
        console.log('PEER_CHANGED=', peerConnection.iceConnectionState);
        // If ICE state is disconnected stop
        if (peerConnection.iceConnectionState === 'disconnected') {
            alert('Connection has been closed stopping...');
            ///  socket.close();
        }
    };
    peer.ontrack = ({ track }) => {
        console.log('ONTRACK', track);
        if (!remoteStream5)
            remoteStream5 = new MediaStream();
        remoteStream5.addTrack(track);
        // @ts-ignore
        localVideo5.srcObject = remoteStream5;
    };
    peer.ondatachannel = ({ channel }) => {
        console.log('ON_DATA_CHANNEL');
        dataChannel = channel;
        /// initializeDataChannelListeners();
    };
    // @ts-ignore
    peer.onaddstream = (evt) => {
        console.log('remote stream added');
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
function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendAction5(null, 'candidate', { type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate });
    }
    else {
        console.log('End of candidates.');
    }
}
function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}
async function createOffer5(peer) {
    if (!peer)
        return console.error('no peer');
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
}
async function setOfferGetAnswer(peer, offer) {
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    return answer;
    /// await peerConnection.setLocalDescription(answer);
}
function doAnswer() {
    console.log('Sending answer to peer.');
    peer5.createAnswer().then(setLocalAndSendMessage, onCreateSessionDescriptionError);
}
function setLocalAndSendMessage(sessionDescription) {
    peer5.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    const action = sessionDescription.type;
    sendAction5(null, action, sessionDescription);
}
function onCreateSessionDescriptionError(error) {
    console.warn('Failed to create session description: ' + error.toString());
}
function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
}
/*function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}*/
function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isSharing = false;
}
function stop() {
    /// isStarted = false;
    peer5.close();
    peer5 = null;
}
/////////////////////////////////////
async function getShared5() {
    sendAction5(null, 'get-shared-id', null);
}
async function shareScreen5() {
    isSharing = true;
    try {
        localStream5 = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
    catch (error) {
        console.warn('failed to get local media stream', error);
    }
    if (localStream5) {
        // @ts-ignore
        localVideo5.srcObject = localStream5;
        sendAction5(null, 'sharing', null);
        // maybeStart();
    }
}
//////////////////////////////////////////////////////////SOCKET//////////////////
const socket5 = new WebSocket('wss://' + ar1[0] + ':8888');
socket5.onmessage = (evt) => {
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
    socket5.send(JSON.stringify({ to, action, data }));
}
socket5.onerror = (error) => {
    console.error('socket::error', error);
};
socket5.onclose = () => {
    console.log('socket::close');
    /// stopAll();
};
socket5.onopen = async () => {
    console.log('socket::open');
    sendAction5(null, 'start', NAME1);
};
function getRemote5(action, data) {
    return new Promise(function (resole, reject) {
        const onData = (evt) => {
            const msg = JSON.parse(evt.data);
            console.log(msg);
            const act = msg.action;
            const data = msg.data;
            if (act === action) {
                socket5.removeEventListener('message', onData);
                resole(data);
            }
        };
        socket5.addEventListener('message', onData);
    });
}
//# sourceMappingURL=my-main.js.map