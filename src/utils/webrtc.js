let peerConnection;
let dataChannel;
let isOfferer = false;

const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function getIsOfferer() {
  return isOfferer;
}
export function setIsOfferer(value) {
  isOfferer = value;
}

export function startWebRTC(socket, onMessage, onLog, onReadyChange) {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('signal', { type: 'candidate', data: e.candidate });
    }
  };

  if (isOfferer) {
    dataChannel = peerConnection.createDataChannel('chat');
    setupDataChannel(onMessage, onLog, onReadyChange);
  } else {
    peerConnection.ondatachannel = e => {
      dataChannel = e.channel;
      setupDataChannel(onMessage, onLog, onReadyChange);
    };
  }
}

export async function createOffer(socket, onLog) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('signal', { type: 'offer', data: offer });
  onLog('Offer sent');
}

export async function handleOffer(offer, socket, onMessage, onLog, onReadyChange) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        socket.emit('signal', { type: 'candidate', data: e.candidate });
      }
    };
    peerConnection.ondatachannel = event => {
      dataChannel = event.channel;
      setupDataChannel(onMessage, onLog, onReadyChange);
    };
  }

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('signal', { type: 'answer', data: answer });
}

export async function handleAnswer(answer, onLog) {
  await peerConnection.setRemoteDescription(answer);
  onLog('Answer received and set');
}

export async function handleCandidate(candidate, onLog) {
  try {
    await peerConnection.addIceCandidate(candidate);
    onLog('ICE candidate added');
  } catch (e) {
    onLog('Failed to add ICE candidate');
  }
}

export function sendMessage(msg, onLog) {
  if (dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(msg);
    onLog(`You: ${msg}`);
  } else {
    onLog('Data channel not open');
  }
}
export function getDataChannel() {
  return dataChannel;
}

export function getPeerConnection() {
  return peerConnection;
}


function setupDataChannel(onMessage, onLog, onReadyChange) {
  dataChannel.onopen = () => {
    onLog('Data channel open');
    onReadyChange(true);
  };
  dataChannel.onclose = () => {
    onLog('Data channel closed');
    onReadyChange(false);
  };
  dataChannel.onmessage = e => {
    onLog(`Peer: ${e.data}`);
    onMessage(e.data);
  };
  dataChannel.onerror = e => onLog('Data channel error: ' + e);
}
