import { useEffect, useRef } from 'react';
import AgoraRTM from 'agora-rtm-sdk';
// import { createClient} from 'agora-rtc-sdk-ng';
// import logo from './logo.svg';
import './App.css';



function App() {

  let APP_ID = "78cd6032b7c647b1b8c0fd0ad378d8f0";

  let token = null;
  let uid = String(Math.floor(Math.random() * 10000));

  let client;
  let channel;

  let localStream;
  let remoteStream;
  let peerConnection;

  const servers = {
    iceServers: [
      { urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']}
    ]
  }

  const initVideoRef = useRef();
  const nextVideoRef = useRef();

  const init = async () => {
    client = new AgoraRTM.createInstance(APP_ID);

    await client.login({uid, token });

    channel = client.createChannel('main');
    await channel.join()

    channel.on("MemberJoined", handleUserJoined);
    channel.on("MemberLeft", handleUserLeft)

    client.on("MessageFromPeer", handleMessageFromPeer);
    
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    initVideoRef.current.srcObject = localStream;

  };

  const handleUserLeft = (MemberId) => {
    return nextVideoRef.current.style.display = 'none'
  }

  const handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text)

    if (message.type === 'offer') {
      createAnswer(MemberId, message.offer)
    }

    if (message.type === 'answer') {
      addAnswer(message.answer)
    }

    if (message.type === 'candidate') {
      if (peerConnection) {
        peerConnection.addIceCandidate(message.candidate)
      }
    }

  }

  const handleUserJoined = async (MemberId) => {
    console.log("A new user joined channel:", MemberId)

    createOffer(MemberId);
  };

  const createPeerConnection = async(MemberId) => {
    peerConnection = new RTCPeerConnection(servers);
    
    remoteStream = new MediaStream();
    nextVideoRef.current.srcObject = remoteStream;
    nextVideoRef.current.style.display = 'block'

    if (!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    initVideoRef.current.srcObject = localStream;
    }

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream)
    });

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track)
      })
    };

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        client.sendMessageToPeer({text: JSON.stringify({'type': 'candidate', 'candidate': event.candidate})}, MemberId)
      }
    }
  }

  const createOffer = async (MemberId) => {
    await createPeerConnection(MemberId)

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    client.sendMessageToPeer({text: JSON.stringify({'type': 'offer', 'offer': offer})}, MemberId)

  };

  const createAnswer = async(MemberId, offer) => {
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer({text: JSON.stringify({'type': 'answer', 'answer': answer})}, MemberId)
  }

  const addAnswer = async (answer) => {
    if (!peerConnection.currentRemoteDescription) {
      peerConnection.setRemoteDescription(answer)
    }
  };

  const leaveChannel = async() => {
    await channel.leave();
    await client.logout();
  }

  window.addEventListener('beforeunload', leaveChannel)

  
  useEffect(() => {
      init()
    }, [])


  return (
    <div className='grid grid-cols-2 gap-6'>
      <video autoPlay playsInline className='bg-black w-full h-[300px]' ref={initVideoRef} />
      <video autoPlay playsInline className='bg-black w-full h-[300px] hidden' ref={nextVideoRef} />
    </div>
  );
}

export default App;
