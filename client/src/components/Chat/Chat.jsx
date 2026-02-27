import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Chat = ({ socket, roomId }) => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const sock = socket?.current;
        if (!sock) return;

        sock.emit('load-messages', { roomId });

        const handleMessagesLoaded = (msgs) => {
            setMessages(msgs);
        };

        const handleReceiveMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
        };

        sock.on('messages-loaded', handleMessagesLoaded);
        sock.on('receive-message', handleReceiveMessage);

        return () => {
            sock.off('messages-loaded', handleMessagesLoaded);
            sock.off('receive-message', handleReceiveMessage);
        };
    }, [socket, roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket?.current) return;

        socket.current.emit('send-message', {
            roomId,
            text: newMessage.trim(),
            sender: user.username,
            senderId: user.id
        });

        setNewMessage('');
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp || Date.now());
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty-state">
                        <div className="chat-empty-icon">💬</div>
                        <div>No messages yet — start the conversation!</div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={msg._id || idx} className={`chat-message ${msg.senderName === user.username ? 'own' : ''}`}>
                            <div className="chat-message-header">
                                <span className="chat-message-sender">{msg.senderName}</span>
                                <span className="chat-message-time">{formatTime(msg.createdAt || msg.timestamp)}</span>
                            </div>
                            <div className="chat-message-text">{msg.text}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-bar" onSubmit={handleSend}>
                <input
                    type="text"
                    placeholder="Type a message…"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    id="chat-input"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!newMessage.trim()}>
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chat;
