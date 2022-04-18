'use strict';

var isChannelReady = false;
let isSharing = false;

var localStream: MediaStream
let peer: RTCPeerConnection
var remoteStream;
var turnReady;
let shared_id: string

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

const NAME: string = window.location.hash?.slice(1) || Date.now().toString();
console.log(NAME)
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
console.log(' on socket message ', data)
}

function sendMessage5(message: string) {

}

function onSocketAction5(action: string, data, sender_id: string) {

  console.log('action:' + action + ' sender ' + sender_id, data);
  switch (action) {
    case 'welcome':
      const ar:{id: string, sharing: boolean}[] = data;
      const shared = ar.find(v => v.sharing);
      if(shared) {
        shared_id = shared.id;
      }
      else shared_id = null
        createPeerConnection()
      break;
    case 'sharing':
      const id = data;
      break;
    case 'no-sharing':
      break;
    case 'connected':
      maybeStart();
      break
    case 'client':

      break;
    case 'offer':
      setOfferGetAnswer(peer, data).then(answer => {
        sendAction5('answer', sender_id, answer)

      });

      break;
    case 'answer':
      ///if(isStarted) {
        peer.setRemoteDescription(new RTCSessionDescription(data));
    //  }

      break
    case 'candidate':
      ///if(isStarted) {
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate
        });
        peer.addIceCandidate(candidate);
      //}

      break
    case 'bye':
     /// if(isStarted) {
        handleRemoteHangup();
      //}
      break
    default:
      break
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





function messageAction(action: string) {
  switch (action) {
    case 'join':
      isChannelReady = true;
    break
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

function addTracks5() {
  const tracks: MediaStreamTrack[] = localStream.getTracks()
  tracks.forEach(function (v) {
    console.log('adding track ', v)
    peer.addTrack(v);
  })
}

function maybeStart() {
  console.log('maybeStart() isChannelReady ' + isChannelReady + '  isStaring' +  isSharing + ' localStream ', localStream?.getTracks());

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

function createPeerConnection(): RTCPeerConnection {
    const peer: RTCPeerConnection = new RTCPeerConnection(pcConfig);
    peer.onicecandidate = handleIceCandidate;

  peer.onicecandidate = ({ candidate }) => {
    if (!candidate) return;

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
   /// remoteMediaStream.addTrack(track);
   /// remoteVideo.srcObject = remoteMediaStream;
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
    }
  // @ts-ignore
    peer.onremovestream = (evt) => {
      console.log('remote removed');
    }
    console.log('Created RTCPeerConnection');
  return peer;
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendAction5(null, 'candidate', { type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate})
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

async function createOffer5(peer: RTCPeerConnection) {
  console.log('Sending offer to peer');
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;

}

async function setOfferGetAnswer(peer: RTCPeerConnection,  offer: RTCSessionDescriptionInit):Promise<RTCSessionDescriptionInit> {


  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer: RTCSessionDescriptionInit = await peer.createAnswer();
  return answer;
 /// await peerConnection.setLocalDescription(answer);

}

function doAnswer() {
  console.log('Sending answer to peer.');
  peer.createAnswer().then(setLocalAndSendMessage, onCreateSessionDescriptionError );
}

function setLocalAndSendMessage(sessionDescription) {
  peer.setLocalDescription(sessionDescription);
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
  peer.close();
  peer = null;
}



/////////////////////////////////////

async function shareScreen5() {
  isSharing = true;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });

  } catch (error) {
    console.warn('failed to get local media stream', error);
  }

  if(localStream) {
    // @ts-ignore
    localVideo5.srcObject = localStream;
    sendAction5(null, 'sharing', null);

   // maybeStart();
  }
}

//////////////////////////////////////////////////////////SOCKET//////////////////


const socket5 = new WebSocket('wss://'+ar1[0]+':8888');

socket5.onmessage = (evt) => {
  const msg = JSON.parse(evt.data);
  console.log(msg)
  const action = msg.action;
  const sender_id = msg.sender_id;
  const data = msg.data;

  if(action) {
    onSocketAction5(action, data, sender_id)
  } else {
    onSocketMessage5(msg)
  }
}

function sendAction5(to: string, action: string, data: any) {
  socket5.send(JSON.stringify({action,data}));
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

peer =  createPeerConnection()

  console.log(peer);
  if(NAME === 'MAIN') {

  }
};


/*
*
*
socket5.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

socket5.on('joined', function(room) {
  console.log('joined: ' + room);
  isChannelReady = true;
});

socket5.on('log', function(array) {
  console.log.apply(console, array);
});
*
*
* function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}
* */
