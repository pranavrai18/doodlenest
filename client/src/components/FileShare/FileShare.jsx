import { useState, useRef, useEffect } from 'react';
import API from '../../api/axios';

const FileShare = ({ socket, roomId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchFiles();

        const sock = socket?.current;
        if (!sock) return;

        const handleFileShared = (fileData) => {
            setFiles(prev => [...prev, fileData]);
        };

        sock.on('file-shared', handleFileShared);

        return () => {
            sock.off('file-shared', handleFileShared);
        };
    }, [socket, roomId]);

    const fetchFiles = async () => {
        try {
            const res = await API.get(`/files/${roomId}`);
            setFiles(res.data);
        } catch (err) {
            console.error('Error fetching files:', err);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await API.post(`/files/upload/${roomId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setFiles(prev => [...prev, res.data]);

            if (socket?.current) {
                socket.current.emit('file-shared', { roomId, fileData: res.data });
            }
        } catch (err) {
            console.error('Error uploading file:', err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            pdf: '📄', doc: '📝', docx: '📝', txt: '📃',
            png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',
            mp4: '🎬', avi: '🎬', mov: '🎬',
            mp3: '🎵', wav: '🎵',
            zip: '📦', rar: '📦',
            js: '⚙️', py: '🐍', html: '🌐', css: '🎨'
        };
        return icons[ext] || '📎';
    };

    return (
        <div className="fileshare-container">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{ display: 'none' }}
                id="file-upload-input"
            />

            <div
                className="file-upload-zone"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="icon">
                    <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: 'none', stroke: 'var(--accent-primary)', strokeWidth: 1.5 }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                </div>
                <p>{uploading ? 'Uploading…' : 'Click to upload a file'}</p>
                <p style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.6 }}>Max 10MB</p>
            </div>

            <div className="file-list">
                {files.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px', fontSize: '0.82rem' }}>
                        No files shared yet
                    </div>
                ) : (
                    files.map((file, idx) => (
                        <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-item"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <span className="file-item-icon">{getFileIcon(file.originalName || file.filename)}</span>
                            <div className="file-item-info">
                                <div className="file-item-name">{file.originalName || file.filename}</div>
                                <div className="file-item-size">
                                    {formatSize(file.size)} {file.uploadedBy && `• ${file.uploadedBy}`}
                                </div>
                            </div>
                        </a>
                    ))
                )}
            </div>
        </div>
    );
};

export default FileShare;
