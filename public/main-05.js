'use strict';
var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var peer;
var remoteStream;
var turnReady;
var pcConfig = {
    'iceServers': [{
            'urls': 'stun:stun.l.google.com:19302'
        }]
};
const NAME = window.location.hash?.slice(1);
console.log(NAME);
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
function onSocketAction5(action, data) {
    console.log('action:' + action, data);
    switch (action) {
        case 'sharing':
            const id = data;
            break;
        case 'no-sharing':
            break;
        case 'connected':
            maybeStart();
            break;
        case 'offer':
            if (!isInitiator && !isStarted) {
                maybeStart();
            }
            peer.setRemoteDescription(new RTCSessionDescription(data));
            doAnswer();
            break;
        case 'answer':
            if (isStarted) {
                peer.setRemoteDescription(new RTCSessionDescription(data));
            }
            break;
        case 'candidate':
            if (isStarted) {
                const candidate = new RTCIceCandidate({
                    sdpMLineIndex: data.label,
                    candidate: data.candidate
                });
                peer.addIceCandidate(candidate);
            }
            break;
        case 'bye':
            if (isStarted) {
                handleRemoteHangup();
            }
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
function maybeStart() {
    console.log('maybeStart() isChannelReady ' + isChannelReady + '  isStarted:' + isStarted + ' localStream ', localStream?.getTracks());
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        peer.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            doCall();
        }
    }
}
/*
window.onbeforeunload = function() {
  sendMessage('bye');
};
*/
/////////////////////////////////////////////////////////
function createPeerConnection() {
    try {
        peer = new RTCPeerConnection(pcConfig);
        peer.onicecandidate = handleIceCandidate;
        peer.onaddstream = handleRemoteStreamAdded;
        peer.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
    }
    catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}
function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
        sendAction5('candidate', { type: 'candidate',
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
function doCall() {
    console.log('Sending offer to peer');
    peer.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}
function doAnswer() {
    console.log('Sending answer to peer.');
    peer.createAnswer().then(setLocalAndSendMessage, onCreateSessionDescriptionError);
}
function setLocalAndSendMessage(sessionDescription) {
    peer.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    const action = sessionDescription.type;
    sendAction5(action, sessionDescription);
}
function onCreateSessionDescriptionError(error) {
    console.warn('Failed to create session description: ' + error.toString());
}
function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    // @ts-ignore
    remoteVideo5.srcObject = remoteStream;
}
function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}
/*function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}*/
function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}
function stop() {
    isStarted = false;
    peer.close();
    peer = null;
}
/////////////////////////////////////
async function shareScreen5() {
    isInitiator = true;
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }
    catch (error) {
        console.warn('failed to get local media stream', error);
    }
    if (localStream) {
        sendAction5('sharing', { NAME });
        // @ts-ignore
        localVideo5.srcObject = localStream;
        maybeStart();
    }
}
//////////////////////////////////////////////////////////SOCKET//////////////////
const socket5 = new WebSocket('wss://' + ar1[0] + ':8888');
socket5.onmessage = async ({ data }) => {
    const msg = JSON.parse(data);
    console.log(msg);
    const action = msg.action;
    if (action) {
        onSocketAction5(action, msg);
    }
    else {
        onSocketMessage5(msg);
    }
};
function sendAction5(action, data) {
    socket5.send(JSON.stringify({ action, data }));
}
socket5.onerror = (error) => {
    console.error('socket::error', error);
};
socket5.onclose = () => {
    console.log('socket::close');
    /// stopAll();
};
socket5.onopen = () => {
    console.log('socket::open');
    sendAction5('connected', { NAME });
};
//# sourceMappingURL=main-05.js.map