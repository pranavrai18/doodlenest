import { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleGoogleResponse = useCallback(async (response) => {
        setError('');
        setLoading(true);
        try {
            await googleLogin(response.credential);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
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
                document.getElementById('google-signin-btn'),
                { theme: 'outline', size: 'large', width: 370, text: 'signin_with', shape: 'pill' }
            );
        }
    }, [handleGoogleResponse]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
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
                        <h1>Welcome Back</h1>
                        <p>Sign in to your DoodleNest account</p>
                    </div>

                    <div className="card premium-glass">
                        {error && <div className="alert alert-error">{error}</div>}

                        {/* Google Sign-In Button */}
                        <div id="google-signin-btn" className="google-btn-wrapper"></div>

                        <div className="auth-divider">
                            <span>or sign in with email</span>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    id="login-email"
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
                                    id="login-password"
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>

                            <button
                                id="login-submit"
                                type="submit"
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                                disabled={loading}
                            >
                                {loading ? <span className="loading-spinner" /> : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    <div className="auth-footer">
                        Don't have an account? <Link to="/register">Create one</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
