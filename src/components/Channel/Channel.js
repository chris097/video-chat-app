import { useEffect, useRef } from 'react';
import AgoraRTM from 'agora-rtm-sdk';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {BsFillCameraVideoFill, BsFillMicFill, BsFillTelephoneFill} from 'react-icons/bs'



const Channel = () => {

    const iconStyle = 'bg-[rgb(179,102,249,.9)] cursor-pointer p-5 rounded-full flex justify-center items-center';
    const iconWidth = 'w-7 h-7';

    let APP_ID = "78cd6032b7c647b1b8c0fd0ad378d8f0";

    let token = null;
    let uid = String(Math.floor(Math.random() * 10000));

    let client;
    let channel;

    let localStream;
    let remoteStream;
    let peerConnection;

    const navigate = useNavigate()
    
    const { channelId } = useParams();

    const servers = {
        iceServers: [
            { urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302'] }
        ]
    }

    const initVideoRef = useRef();
    const nextVideoRef = useRef();
    const cameraRef = useRef();
    const audioRef = useRef();
    
    if (!channelId) navigate('/looby')

    let constraints = {
        video: {
            width:{min: 640, ideal: 1920, max: 1920},
            height:{min: 480, ideal: 1080, max: 1080}
        },
        audio: true
    }

    const init = async () => {
        client = new AgoraRTM.createInstance(APP_ID);

        await client.login({ uid, token });

        channel = client.createChannel(channelId);
        await channel.join()

        channel.on("MemberJoined", handleUserJoined);
        channel.on("MemberLeft", handleUserLeft)

        client.on("MessageFromPeer", handleMessageFromPeer);
    
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        initVideoRef.current.srcObject = localStream;

    };

    const handleUserLeft = (MemberId) => {
        nextVideoRef.current.style.display = 'none'
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

    const createPeerConnection = async (MemberId) => {
        peerConnection = new RTCPeerConnection(servers);
    
        remoteStream = new MediaStream();
        nextVideoRef.current.srcObject = remoteStream;
        nextVideoRef.current.style.display = 'block'

        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia(constraints)
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
                client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'candidate', 'candidate': event.candidate }) }, MemberId)
            }
        }
    }

    const createOffer = async (MemberId) => {
        await createPeerConnection(MemberId)

        let offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, MemberId)

    };

    const createAnswer = async (MemberId, offer) => {
        await createPeerConnection(MemberId)

        await peerConnection.setRemoteDescription(offer);

        let answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, MemberId)
    }

    const addAnswer = async (answer) => {
        if (!peerConnection.currentRemoteDescription) {
            peerConnection.setRemoteDescription(answer)
        }
    };

    const leaveChannel = async () => {
        await channel.leave();
        await client.logout();
    };

    const toggleCamera = async () => {
        let videoTracks = localStream.getTracks().find(track => track.kind === 'video');

        if (videoTracks.enabled) {
            videoTracks.enabled = false
            cameraRef.current.style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            videoTracks.enabled = true
            cameraRef.current.style.backgroundColor = 'rgb(179, 102, 249, .9)'
        }
    }

    const toggleMic = async () => {
        let audioTracks = localStream.getTracks().find(track => track.kind === 'audio');

        if (audioTracks.enabled) {
            audioTracks.enabled = false
            audioRef.current.style.backgroundColor = 'rgb(255, 80, 80)'
        } else {
            audioTracks.enabled = true
            audioRef.current.style.backgroundColor = 'rgb(179, 102, 249, .9)'
        }
    }

    window.addEventListener('beforeunload', leaveChannel)

  
    useEffect(() => {
        init()
    }, [])


    return (
        <div className='grid grid-cols-1 h-screen overflow-hidden'>
            <video autoPlay playsInline className='bg-black w-full h-full object-cover' ref={initVideoRef} />
            <video autoPlay playsInline
                className='bg-black w-[300px] h-[170px] top-5 left-5 rounded-md fixed border-2 object-cover border-[#b366f9] shadow-[3px 3px 15px -1px rgba(0,0,0,.77)] hidden'
                ref={nextVideoRef} />

            <div className='fixed left-0 flex justify-center mx-auto w-full gap-5 bottom-10'>
                <div ref={cameraRef} className={`${iconStyle}`} onClick={toggleCamera}>
                    <BsFillCameraVideoFill color='#fff' className={`${iconWidth}`} />
                </div>
                <div ref={audioRef} onClick={toggleMic} className={`${iconStyle}`}>
                    <BsFillMicFill color='#fff' className={`${iconWidth}`} />
                </div>
                <Link to="/lobby">
                    <div className='bg-[rgb(255,80,80,1)] cursor-pointer p-5 rounded-full flex justify-center items-center'>
                    <BsFillTelephoneFill color='#fff' className={`${iconWidth}`}  />
                </div>
                </Link>
            </div>
        </div>
    );
};

export default Channel;