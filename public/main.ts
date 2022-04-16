const localVideo:{srcObject: any} = document.getElementById('localVideo') as any;
const remoteVideo: {srcObject: any} = document.getElementById('remoteVideo') as any;
const callButton:{disabled: boolean} = document.getElementById('callButton') as any;
const hangupButton: {disabled: boolean} = document.getElementById('hangupButton') as any;
const screenShareButton: {disabled: boolean} = document.getElementById('screenShareButton') as any;
const shareScreenCheck: {checked: boolean} =  document.getElementById('isShareScreen') as any;

const ar = window.location.host.split(':');

const socket = new WebSocket('wss://'+ar[0]+':8888');

let peerConnection;
let dataChannel;
let localMediaStream;
const remoteMediaStream = new MediaStream();
let myID: string;
let sharedID: string;

socket.onopen = () => {
  console.log('socket::open');
};


socket.onmessage = async ({ data }) => {
  try {
    const jsonMessage = JSON.parse(data);
    console.log('message', jsonMessage);

    switch (jsonMessage.action) {
      case 'start':
        myID = jsonMessage.id;
        sharedID = jsonMessage.sharedID;
        document.getElementById('localId').innerHTML = myID;
        document.getElementById('sharedID').innerHTML = sharedID;
        callButton.disabled = false;
        await initializePeerConnection();
        initializeDataChannel();
      /*  const senders = peerConnection.getSenders()
          console.log('senders', senders);*/
        break;

      case 'offer':
        sharedID = jsonMessage.data.remoteId;
        delete jsonMessage.data.remoteId;
        await initializePeerConnection();

        await peerConnection.setRemoteDescription(new RTCSessionDescription(jsonMessage.data.offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        sendSocketMessage({ to: sharedID, action: 'answer', data:{ answer}});
        break;
      case 'answer':

        await peerConnection.setRemoteDescription(new RTCSessionDescription(jsonMessage.data.answer));
        break;

      case 'iceCandidate':

        await peerConnection.addIceCandidate(jsonMessage.data.candidate);
        break;
      default: console.warn('unknown action', jsonMessage.to);
    }
  } catch (error) {
    console.error('failed to handle socket message', error);
  }
};

socket.onerror = (error) => {
  console.error('socket::error', error);
};

socket.onclose = () => {
  console.log('socket::close');
  stopAll();
};

const sendSocketMessage = (message: {to?: string, action?: string,  data?: any}) => {
  socket.send(JSON.stringify(message));
};


const start = async () => {
  sendSocketMessage({action: 'start'});
};



const getScreen = async () => {

  const remoteId = sharedID;

  try {

    console.log('call: ', remoteId);

   /// await initializePeerConnection(localMediaStream?localMediaStream.getTracks(): null);
   /// initializeDataChannel();

   const offer = await peerConnection.createOffer();
   await peerConnection.setLocalDescription(offer);

    sendSocketMessage({to: remoteId, data: offer});


  } catch (error) {
    console.error('failed to initialize call', error);
  }
};

const hangup = () => socket.close();

const stopAll = () => {
  if (!localVideo.srcObject) return;

  for (const track of localVideo.srcObject.getTracks()) {
    console.log('stop track', track);
    track.stop();
  }

  for (const sender of peerConnection.getSenders()) {
    sender.track.stop();
  }

  dataChannel.close();
  peerConnection.close();
  callButton.disabled = true;
  hangupButton.disabled = true;
  screenShareButton.disabled = true;
  localVideo.srcObject = undefined;
  remoteVideo.srcObject = undefined;
};

/*

const getLocalMediaStream = async () => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    console.log('got local media stream');
    localVideo.srcObject = mediaStream;
    return mediaStream;
  } catch (error) {
    console.error('failed to get local media stream', error);
  }
};
*/


const initializePeerConnection = async () => {
  console.log('initializePeerConnection ');
  const config = { iceServers: [{ urls: [ 'stun:stun1.l.google.com:19302' ] } ] };

  peerConnection = new RTCPeerConnection(config);
  peerConnection.onicecandidate = ({ candidate }) => {
    if (!candidate) return;

    console.log('ICECANDIDATE', candidate.foundation);
    sendSocketMessage( {to: sharedID, action: 'iceCandidate', data:{ candidate} });
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log('PEER_CHANGED=', peerConnection.iceConnectionState);
    // If ICE state is disconnected stop
    if (peerConnection.iceConnectionState === 'disconnected') {
      alert('Connection has been closed stopping...');
      socket.close();
    }
  };

  peerConnection.ontrack = ({ track }) => {
    console.log('ONTRACK', track);
    remoteMediaStream.addTrack(track);
    remoteVideo.srcObject = remoteMediaStream;
  };

  peerConnection.ondatachannel = ({ channel }) => {
    console.log('ON_DATA_CHANNEL');
    dataChannel = channel;
   /// initializeDataChannelListeners();
  };


  hangupButton.disabled = false;
  screenShareButton.disabled = false;

  return peerConnection
};


function addTracks(mediaTracks) {
  for (const track of mediaTracks) {
    peerConnection.addTrack(track);
  }
}

const initializeDataChannel = () => {
  console.log('initializeDataChannel')
  const config = { ordered: true };
  dataChannel = peerConnection.createDataChannel('dataChannel', config);
  initializeDataChannelListeners();
};

const initializeDataChannelListeners = () => {
  console.log('initializeDataChannelListeners');
  dataChannel.onopen = () => console.log('dataChannel opened');
  dataChannel.onclose = () => console.log('dataChannel closed');
  dataChannel.onerror = (error) => console.error('dataChannel error:', error);

  dataChannel.onmessage = ({ data }) => {
    console.log('dataChannel data', data);
  };
};

const shareScreen = async () => {
  const mediaStream = await getLocalScreenCaptureStream();
  localMediaStream = mediaStream
  localVideo.srcObject = mediaStream;
  sendSocketMessage({action: 'set-share'} );

  /// const screenTrack = mediaStream.getVideoTracks()[0];

 /* if (screenTrack) {
    console.log('replace camera track with screen track');
    /// replaceTrack(screenTrack);
  }*/
};

const getLocalScreenCaptureStream = async () => {
  try {
    const constraints: DisplayMediaStreamConstraints = { video: { cursor: 'always' }, audio: false } as any;
    const screenCaptureStream = await navigator.mediaDevices.getDisplayMedia(constraints);

    return screenCaptureStream;
  } catch (error) {
    console.error('failed to get local screen', error);
  }
};

const replaceTrack = (newTrack) => {

  const sender = peerConnection.getSenders().find(sender =>
    sender.track.kind === newTrack.kind 
  );

  if (!sender) {
    console.warn('failed to find sender');

    return;
  }

  sender.replaceTrack(newTrack);
};

const sendMessage = () => {

  const message: string = (document.getElementById('chatMessage') as any).value;

  if (!message) {
    alert('no message entered');

    return;
  }

  if (!dataChannel || dataChannel.readyState !== 'open') {
    alert('data channel is undefined or is not connected');

    return;
  }
  
  console.log('sending message', message);
  const data = {
    message,
    time: new Date()
  };

  dataChannel.send(JSON.stringify(data));

  // @ts-ignore
  document.getElementById('chatMessage').value = '';
};
