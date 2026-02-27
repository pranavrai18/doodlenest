import { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleGoogleResponse = useCallback(async (response) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(response.credential);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [googleLogin, navigate]);

    useEffect(() => {
        /* global google */
        if (window.google) {
            google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse
            });
            google.accounts.id.renderButton(
                document.getElementById('google-signup-btn'),
                { theme: 'outline', size: 'large', width: '100%', text: 'signup_with', shape: 'pill' }
            );
        }
    }, [handleGoogleResponse]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await register(username, email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-split-layout animate-fade-in">
            <div className="auth-hero">
                <div className="auth-hero-content">
                    <div className="logo-icon-large">⬡</div>
                    <h2>Unleash your creativity.</h2>
                    <p>Join DoodleNest, the most intuitive real-time collaborative whiteboard designed for teams that build the future.</p>
                </div>
            </div>

            <div className="auth-form-side">
                <div className="auth-container">
                    <div className="auth-header">
                        <h1>Create Account</h1>
                        <p>Join DoodleNest and start collaborating</p>
                    </div>

                    <div className="card premium-glass">
                        {error && <div className="alert alert-error">{error}</div>}

                        {/* Google Sign-Up Button */}
                        <div id="google-signup-btn" className="google-btn-wrapper"></div>

                        <div className="auth-divider">
                            <span>or sign up with email</span>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    id="register-username"
                                    type="text"
                                    className="form-input"
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    id="register-email"
                                    type="email"
                                    className="form-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    id="register-password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Min 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    id="register-confirm-password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Re-enter password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>

                            <button
                                id="register-submit"
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? <span className="loading-spinner" /> : 'Create Account'}
                            </button>
                        </form>
                    </div>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
