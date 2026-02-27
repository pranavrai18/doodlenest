import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api/axios';
import Navbar from '../common/Navbar';

const TIPS = [
    { icon: '✏️', title: 'Draw Freely', desc: 'Use the pencil tool to sketch ideas in real-time' },
    { icon: '🔗', title: 'Share & Collaborate', desc: 'Copy your Room ID and invite teammates to join' },
    { icon: '📐', title: 'Shape Tools', desc: 'Try rectangles, circles, lines and arrows from the toolbar' },
    { icon: '🎨', title: 'Canvas Themes', desc: 'Switch between grid, dots, ruled, and blank backgrounds' },
    { icon: '💾', title: 'Export Work', desc: 'Save your whiteboard as a PNG image anytime' },
    { icon: '📄', title: 'Multi-Page', desc: 'Add multiple pages to organize your ideas' },
];

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pinnedRooms, setPinnedRooms] = useState(() => {
        try { return JSON.parse(localStorage.getItem('pinnedRooms') || '[]'); } catch { return []; }
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        localStorage.setItem('pinnedRooms', JSON.stringify(pinnedRooms));
    }, [pinnedRooms]);

    const fetchRooms = async () => {
        try {
            const res = await API.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    // Derived stats
    const stats = useMemo(() => {
        const created = rooms.filter(r => r.host?.username === user?.username).length;
        return {
            total: rooms.length,
            created,
            joined: rooms.length - created
        };
    }, [rooms, user]);

    // Filtered rooms
    const filteredRooms = useMemo(() => {
        if (!searchQuery.trim()) return rooms;
        const q = searchQuery.toLowerCase();
        return rooms.filter(r => r.name.toLowerCase().includes(q) || r.roomId.toLowerCase().includes(q));
    }, [rooms, searchQuery]);

    // Separate pinned and unpinned
    const { pinned, unpinned } = useMemo(() => {
        const p = filteredRooms.filter(r => pinnedRooms.includes(r.roomId));
        const u = filteredRooms.filter(r => !pinnedRooms.includes(r.roomId));
        return { pinned: p, unpinned: u };
    }, [filteredRooms, pinnedRooms]);

    // Recent activity from rooms
    const recentActivity = useMemo(() => {
        return [...rooms]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 4)
            .map(r => ({
                room: r.name,
                roomId: r.roomId,
                isHost: r.host?.username === user?.username,
                time: new Date(r.updatedAt || r.createdAt)
            }));
    }, [rooms, user]);

    const togglePin = (roomId) => {
        setPinnedRooms(prev =>
            prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
        );
    };

    const formatTimeAgo = (date) => {
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newRoomName.trim()) {
            setError('Please enter a room name');
            return;
        }

        try {
            const res = await API.post('/rooms', { name: newRoomName });
            setRooms(prev => [res.data, ...prev]);
            setNewRoomName('');
            setSuccess(`Room "${res.data.name}" created! ID: ${res.data.roomId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!joinRoomId.trim()) {
            setError('Please enter a Room ID');
            return;
        }

        try {
            await API.post('/rooms/join', { roomId: joinRoomId.trim().toUpperCase() });
            navigate(`/room/${joinRoomId.trim().toUpperCase()}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join room');
        }
    };

    const handleEnterRoom = (roomId) => {
        navigate(`/room/${roomId}`);
    };

    const handleDeleteRoom = async (roomId) => {
        try {
            await API.delete(`/rooms/${roomId}`);
            setRooms(prev => prev.filter(r => r.roomId !== roomId));
            setSuccess('Room deleted successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete room');
        }
    };

    const copyRoomId = (roomId) => {
        navigator.clipboard.writeText(roomId);
        setSuccess(`Room ID ${roomId} copied to clipboard!`);
        setTimeout(() => setSuccess(''), 2000);
    };

    const renderRoomCard = (room) => (
        <div key={room._id} className="card room-card glass-card" onClick={() => handleEnterRoom(room.roomId)}>
            <div className="room-card-header">
                <h4>{room.name}</h4>
                <button
                    className={`pin-btn ${pinnedRooms.includes(room.roomId) ? 'pinned' : ''}`}
                    onClick={(e) => { e.stopPropagation(); togglePin(room.roomId); }}
                    title={pinnedRooms.includes(room.roomId) ? 'Unpin' : 'Pin'}
                >
                    📌
                </button>
            </div>
            <div className="room-card-meta">
                <span
                    className="room-id-badge"
                    onClick={(e) => { e.stopPropagation(); copyRoomId(room.roomId); }}
                >
                    🔑 {room.roomId}
                </span>
                <span>👥 {room.participants?.length || 0}</span>
                <span>🏠 {room.host?.username === user?.username ? 'Host' : 'Member'}</span>
            </div>
            <div className="room-card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-sm btn-primary" onClick={() => handleEnterRoom(room.roomId)}>
                    Enter
                </button>
                {room.host?.username === user?.username && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRoom(room.roomId)}>
                        Delete
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="dashboard-wrapper">
            {/* Animated Background Elements */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>
            <div className="bg-grid-overlay"></div>

            <Navbar />
            <div className="dashboard animate-fade-in premium-glass">
                <div className="dashboard-header">
                    <h1>👋 Welcome, {user?.username}!</h1>
                    <p>Create a new whiteboard room or join an existing one</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Stats Bar */}
                <div className="stats-bar">
                    <div className="stat-card glass-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.total}</span>
                            <span className="stat-label">Total Rooms</span>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">🎨</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.created}</span>
                            <span className="stat-label">Created</span>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">🤝</div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.joined}</span>
                            <span className="stat-label">Joined</span>
                        </div>
                    </div>
                    <div className="stat-card glass-card">
                        <div className="stat-icon">📌</div>
                        <div className="stat-info">
                            <span className="stat-value">{pinnedRooms.length}</span>
                            <span className="stat-label">Pinned</span>
                        </div>
                    </div>
                </div>

                {/* Profile Card + Quick Tips Row */}
                <div className="dash-info-row">
                    {/* Profile Card */}
                    <div className="profile-card glass-card">
                        <div className="profile-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
                        <div className="profile-details">
                            <h3>{user?.username}</h3>
                            <p>{user?.email}</p>
                            <span className="profile-badge">✨ Active Member</span>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="tips-card glass-card">
                        <h3>⚡ Quick Tips</h3>
                        <div className="tips-grid">
                            {TIPS.map((tip, i) => (
                                <div key={i} className="tip-item">
                                    <span className="tip-icon">{tip.icon}</span>
                                    <div>
                                        <strong>{tip.title}</strong>
                                        <p>{tip.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="dashboard-actions">
                    <div className="card action-card glass-card">
                        <h3>🎨 Create Room</h3>
                        <form onSubmit={handleCreateRoom}>
                            <input
                                id="create-room-name"
                                type="text"
                                className="form-input"
                                placeholder="Enter room name..."
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                            />
                            <button id="create-room-btn" type="submit" className="btn btn-primary">
                                Create Room
                            </button>
                        </form>
                    </div>

                    <div className="card action-card glass-card">
                        <h3>🔗 Join Room</h3>
                        <form onSubmit={handleJoinRoom}>
                            <input
                                id="join-room-id"
                                type="text"
                                className="form-input"
                                placeholder="Enter Room ID..."
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                                style={{ textTransform: 'uppercase' }}
                            />
                            <button id="join-room-btn" type="submit" className="btn btn-primary">
                                Join Room
                            </button>
                        </form>
                    </div>
                </div>

                {/* Recent Activity */}
                {recentActivity.length > 0 && (
                    <div className="activity-section">
                        <h2>🕐 Recent Activity</h2>
                        <div className="activity-feed">
                            {recentActivity.map((a, i) => (
                                <div key={i} className="activity-item glass-card" onClick={() => handleEnterRoom(a.roomId)}>
                                    <div className="activity-dot" />
                                    <div className="activity-content">
                                        <span>You {a.isHost ? 'created' : 'joined'} <strong>{a.room}</strong></span>
                                        <span className="activity-time">{formatTimeAgo(a.time)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rooms Section */}
                <div className="rooms-section">
                    <div className="rooms-section-header">
                        <h2>📋 Your Rooms</h2>
                        <div className="room-search">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="🔍 Search rooms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="empty-state glass-card">
                            <div className="icon">🎨</div>
                            <h3>No rooms yet</h3>
                            <p>Create your first whiteboard room to get started!</p>
                        </div>
                    ) : (
                        <>
                            {pinned.length > 0 && (
                                <>
                                    <h3 className="rooms-sub-header">📌 Pinned</h3>
                                    <div className="rooms-grid">{pinned.map(renderRoomCard)}</div>
                                </>
                            )}
                            {unpinned.length > 0 && (
                                <>
                                    {pinned.length > 0 && <h3 className="rooms-sub-header">All Rooms</h3>}
                                    <div className="rooms-grid">{unpinned.map(renderRoomCard)}</div>
                                </>
                            )}
                            {filteredRooms.length === 0 && searchQuery && (
                                <div className="empty-state glass-card">
                                    <div className="icon">🔍</div>
                                    <h3>No rooms match "{searchQuery}"</h3>
                                    <p>Try a different search term</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
