import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { useCanvas } from '../../hooks/useCanvas';
import API from '../../api/axios';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PageNavigator from './PageNavigator';
import Chat from '../Chat/Chat';
import UserPresence from '../Presence/UserPresence';
import ScreenShare from '../ScreenShare/ScreenShare';
import FileShare from '../FileShare/FileShare';
import Navbar from '../common/Navbar';

const WhiteboardRoom = () => {
    const { roomId } = useParams();
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const socket = useSocket(token);
    const canvasState = useCanvas();

    const [room, setRoom] = useState(null);
    const [activeTab, setActiveTab] = useState('chat');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch room details
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await API.get(`/rooms/${roomId}`);
                setRoom(res.data);
            } catch (err) {
                console.error('Room not found');
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [roomId, navigate]);

    // Join socket room
    useEffect(() => {
        const sock = socket?.current;
        if (!sock || !user || !room) return;

        sock.emit('join-room', {
            roomId,
            userId: user.id,
            username: user.username
        });

        return () => {
            sock.emit('leave-room', {
                roomId,
                username: user.username
            });
        };
    }, [socket?.current?.connected, user, room, roomId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                canvasState.undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                canvasState.redo();
            } else if (e.key === 'p' || e.key === 'P') {
                if (document.activeElement.tagName !== 'INPUT') {
                    canvasState.setTool('pencil');
                }
            } else if (e.key === 'e' || e.key === 'E') {
                if (document.activeElement.tagName !== 'INPUT') {
                    canvasState.setTool('eraser');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canvasState]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span className="loading-text">Entering room…</span>
            </div>
        );
    }

    // SVG icons for sidebar tabs
    const ChatIcon = () => (
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    );
    const UsersIcon = () => (
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    );
    const FilesIcon = () => (
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
    );

    return (
        <>
            <Navbar roomName={room?.name} />
            <div className="whiteboard-room">
                {/* Left Toolbar */}
                <Toolbar
                    canvasState={canvasState}
                    socket={socket}
                    roomId={roomId}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                >
                    <ScreenShare socket={socket} roomId={roomId} />
                </Toolbar>

                <div className="whiteboard-main">
                    {/* Canvas */}
                    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Canvas
                            canvasState={canvasState}
                            socket={socket}
                            roomId={roomId}
                            isRecording={isRecording}
                        />
                        <PageNavigator
                            currentPage={canvasState.currentPage}
                            totalPages={canvasState.totalPages}
                            goToPage={canvasState.goToPage}
                            addPage={canvasState.addPage}
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                    <div className="sidebar-tabs">
                        <button
                            className={`sidebar-tab ${activeTab === 'chat' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            <ChatIcon /> Chat
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <UsersIcon /> Users
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'files' ? 'active' : ''}`}
                            onClick={() => setActiveTab('files')}
                        >
                            <FilesIcon /> Files
                        </button>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        {activeTab === 'chat' && (
                            <Chat socket={socket} roomId={roomId} />
                        )}
                        {activeTab === 'users' && (
                            <UserPresence
                                socket={socket}
                                roomId={roomId}
                                hostUsername={room?.host?.username}
                            />
                        )}
                        {activeTab === 'files' && (
                            <FileShare socket={socket} roomId={roomId} />
                        )}
                    </div>
                </div>

                {/* Sidebar toggle */}
                <button
                    className="sidebar-toggle"
                    onClick={() => setSidebarOpen(prev => !prev)}
                    style={{ right: sidebarOpen ? '340px' : '0' }}
                    title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                    {sidebarOpen ? '›' : '‹'}
                </button>
            </div>
        </>
    );
};

export default WhiteboardRoom;
