import { useState, useRef, useEffect } from 'react';

const ScreenShare = ({ socket, roomId }) => {
    const [isSharing, setIsSharing] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const localStreamRef = useRef(null);
    const videoRef = useRef(null);
    const peerConnectionsRef = useRef({});

    useEffect(() => {
        const sock = socket?.current;
        if (!sock) return;

        const handleOffer = async ({ offer, senderId }) => {
            try {
                const pc = createPeerConnection(senderId);
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sock.emit('screen-share-answer', {
                    roomId,
                    answer,
                    senderId: sock.id,
                    targetId: senderId
                });
            } catch (err) {
                console.error('Error handling offer:', err);
            }
        };

        const handleAnswer = async ({ answer, senderId }) => {
            try {
                const pc = peerConnectionsRef.current[senderId];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(answer));
                }
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        };

        const handleIceCandidate = async ({ candidate, senderId }) => {
            try {
                const pc = peerConnectionsRef.current[senderId];
                if (pc && candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (err) {
                console.error('Error handling ICE candidate:', err);
            }
        };

        const handleStop = () => {
            setRemoteStream(null);
            Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
            peerConnectionsRef.current = {};
        };

        sock.on('screen-share-offer', handleOffer);
        sock.on('screen-share-answer', handleAnswer);
        sock.on('screen-share-ice-candidate', handleIceCandidate);
        sock.on('screen-share-stop', handleStop);

        return () => {
            sock.off('screen-share-offer', handleOffer);
            sock.off('screen-share-answer', handleAnswer);
            sock.off('screen-share-ice-candidate', handleIceCandidate);
            sock.off('screen-share-stop', handleStop);
        };
    }, [socket, roomId]);

    useEffect(() => {
        if (videoRef.current && remoteStream) {
            videoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    const createPeerConnection = (peerId) => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && socket?.current) {
                socket.current.emit('screen-share-ice-candidate', {
                    roomId,
                    candidate: event.candidate,
                    senderId: socket.current.id
                });
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        peerConnectionsRef.current[peerId] = pc;
        return pc;
    };

    const startSharing = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: 'always' },
                audio: false
            });

            localStreamRef.current = stream;
            setIsSharing(true);

            const sock = socket?.current;
            if (sock) {
                const pc = createPeerConnection('broadcaster');
                stream.getTracks().forEach(track => pc.addTrack(track, stream));

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                sock.emit('screen-share-offer', {
                    roomId,
                    offer,
                    senderId: sock.id
                });
            }

            stream.getVideoTracks()[0].onended = () => {
                stopSharing();
            };
        } catch (err) {
            console.error('Error starting screen share:', err);
        }
    };

    const stopSharing = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};

        setIsSharing(false);
        setRemoteStream(null);

        if (socket?.current) {
            socket.current.emit('screen-share-stop', { roomId });
        }
    };

    return (
        <>
            <button
                className={`vt-btn ${isSharing ? 'active' : ''}`}
                onClick={isSharing ? stopSharing : startSharing}
                title={isSharing ? 'Stop Sharing' : 'Share Screen'}
            >
                {isSharing ? (
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <rect x="8" y="8" width="8" height="8" fill="currentColor" stroke="none" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                )}
            </button>

            {remoteStream && (
                <div className="screen-share-overlay">
                    <video ref={videoRef} autoPlay playsInline />
                    <div className="screen-share-controls">
                        <button className="btn btn-danger" onClick={stopSharing}>
                            Stop Viewing
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ScreenShare;
