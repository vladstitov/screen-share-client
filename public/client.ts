
// @ts-ignore
const NAME = 'client';
let peerClient: RTCPeerConnection;
const remoteVid = document.querySelector('#remoteVideo');
const clientStream: MediaStream = new MediaStream();

let sharedNAME: string

function setClientsC(clients: {id: string, sharing: boolean}[]) {
    let str = '';
    clients.forEach(function (v) {
        str += '<li>' + v.id + ' <b> ' + v.sharing + '</b></li>';
    })
    document.getElementById('clients').innerHTML = str;

    const shared = clients.find(v => v.sharing)
    sharedNAME = shared?.id
}

// @ts-ignore
async function onSocketAction(action: string, data: any, sender_id: string) {
    console.log(action, data);
    switch (action) {
        case 'welcome':
            setClientsC(data);
            break
        case 'offer':
            setOfferSendAnswer(data);
            break;
        case 'candidate':

            peerClient.addIceCandidate(data).then(res => {
                console.log(res);
            })

            break;
    }
}


// @ts-ignore
function onSocketMessage(msg){

}

async function setOfferSendAnswer(offer) {
    if(!peerClient) peerClient = createPeerConnectionC()
    await peerClient.setRemoteDescription(new RTCSessionDescription(offer));
    const answer: RTCSessionDescriptionInit = await peerClient.createAnswer();
    if(!sharedNAME) console.warn('no shared ');
   else  sendAction(sharedNAME, 'answer', answer);
}


function createPeerConnectionC(): RTCPeerConnection {
    const peer: RTCPeerConnection = new RTCPeerConnection(pcConfig);
    peer.onicecandidate = (evt) => {
        console.log('candidate ',evt)

    }

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
        clientStream.addTrack(track);
        // @ts-ignore
        localVideo.srcObject = remoteStream5;
    };

    peer.ondatachannel = ({ channel }) => {
        console.log('ON_DATA_CHANNEL');
        dataChannel = channel;
        /// initializeDataChannelListeners();
    };

    // @ts-ignore
    peer.onaddstream = (evt) => {
        console.log('remote stream added ', evt);
        // remoteStream = evt.stream;
        // remoteVideo5.srcObject = remoteStream;
    }
    // @ts-ignore
    peer.onremovestream = (evt) => {
        console.log('remote removed ', evt);
    }
    console.log('Created RTCPeerConnection');
    return peer;
}
