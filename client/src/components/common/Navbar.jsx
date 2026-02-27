import { useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';

const Navbar = ({ roomName }) => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const { roomId } = useParams();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/dashboard" className="navbar-brand">
                    <div className="logo-icon">⬡</div>
                    DoodleNest
                </Link>

                {/* Room breadcrumb */}
                {roomName && (
                    <div className="room-info-bar">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>/</span>
                        <span className="room-info-name">
                            <svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                            {roomName}
                        </span>
                        {roomId && (
                            <span
                                className="room-info-id"
                                onClick={() => { navigator.clipboard.writeText(roomId); }}
                                title="Click to copy Room ID"
                            >
                                #{roomId.slice(-6)}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="navbar-actions">
                <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                {user && (
                    <>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {user.username}
                        </span>
                        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                            Logout
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
