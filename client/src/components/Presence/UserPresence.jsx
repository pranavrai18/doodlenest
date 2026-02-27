import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const UserPresence = ({ socket, roomId, hostUsername }) => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const sock = socket?.current;
        if (!sock) return;

        const handleUsersInRoom = (roomUsers) => {
            setUsers(roomUsers);
        };

        sock.on('users-in-room', handleUsersInRoom);
        sock.on('user-joined', () => { });
        sock.on('user-left', () => { });

        sock.emit('get-users', { roomId });

        return () => {
            sock.off('users-in-room', handleUsersInRoom);
            sock.off('user-joined');
            sock.off('user-left');
        };
    }, [socket, roomId]);

    const getInitials = (name) => {
        return name ? name.slice(0, 2).toUpperCase() : '??';
    };

    const getUserColor = (username) => {
        const colors = ['#ff6b9d', '#6c63ff', '#00e676', '#ff9100', '#00b0ff', '#d500f9', '#ffea00', '#ff1744'];
        let hash = 0;
        for (let i = 0; i < (username || '').length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="presence-container">
            <div className="presence-header">
                <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, fill: 'var(--success)', stroke: 'none' }}>
                    <circle cx="12" cy="12" r="6" />
                </svg>
                Online
                <span className="online-count">{users.length}</span>
            </div>
            <div className="presence-list">
                {users.map((u, idx) => (
                    <div key={u.socketId || idx} className="presence-user">
                        <div
                            className="presence-avatar"
                            style={{ background: getUserColor(u.username) }}
                        >
                            {getInitials(u.username)}
                        </div>
                        <div className="presence-user-info">
                            <div className="presence-username">
                                {u.username}
                                {u.username === user?.username && (
                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}> (You)</span>
                                )}
                            </div>
                            <div className="presence-role">
                                {u.username === hostUsername ? (
                                    <><span className="host-badge">👑</span> Host</>
                                ) : (
                                    'Participant'
                                )}
                            </div>
                        </div>
                        <div className="online-dot" />
                    </div>
                ))}
                {users.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.82rem' }}>
                        No users online
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPresence;
