import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Canvas = ({ canvasState, socket, roomId, isRecording }) => {
    const { user } = useContext(AuthContext);
    const {
        canvasRef, isDrawing, setIsDrawing,
        tool, color, fillColor, brushSize, shape,
        currentStroke, getCanvasPoint, saveState,
        canvasTheme
    } = canvasState;

    const containerRef = useRef(null);
    const [eraserPos, setEraserPos] = useState({ x: 0, y: 0, visible: false });

    // Shape drawing state
    const shapeStartPoint = useRef(null);
    const shapeSnapshot = useRef(null);

    // Track remote user cursors { senderId: { x, y, username, color, visible } }
    const [remoteCursors, setRemoteCursors] = useState({});
    const cursorTimeouts = useRef({});
    const remoteDrawing = useRef({});

    // Generate consistent color per username
    const getUserColor = (username) => {
        const colors = ['#ff6b9d', '#6c63ff', '#00e676', '#ff9100', '#00b0ff', '#d500f9', '#ffea00', '#ff1744'];
        let hash = 0;
        for (let i = 0; i < (username || '').length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Draw theme pattern on canvas
    const drawCanvasTheme = useCallback((ctx, w, h, theme) => {
        if (!theme || theme === 'blank') return;

        ctx.save();
        if (theme === 'dots') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
            for (let x = 20; x < w; x += 20) {
                for (let y = 20; y < h; y += 20) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (theme === 'grid') {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
            ctx.lineWidth = 0.5;
            for (let x = 30; x < w; x += 30) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }
            for (let y = 30; y < h; y += 30) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        } else if (theme === 'ruled') {
            ctx.strokeStyle = 'rgba(100, 149, 237, 0.18)';
            ctx.lineWidth = 0.5;
            for (let y = 32; y < h; y += 32) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(220, 80, 80, 0.22)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(60, 0);
            ctx.lineTo(60, h);
            ctx.stroke();
        }
        ctx.restore();
    }, []);

    // Draw a shape on the canvas
    const drawShape = useCallback((ctx, shapeType, startPt, endPt, strokeColor, strokeWidth, fill) => {
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const x = Math.min(startPt.x, endPt.x);
        const y = Math.min(startPt.y, endPt.y);
        const w = Math.abs(endPt.x - startPt.x);
        const h = Math.abs(endPt.y - startPt.y);

        if (shapeType === 'rectangle') {
            ctx.rect(x, y, w, h);
            if (fill && fill !== 'transparent') {
                ctx.fillStyle = fill;
                ctx.fill();
            }
            ctx.stroke();
        } else if (shapeType === 'circle') {
            const rx = w / 2;
            const ry = h / 2;
            ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, Math.PI * 2);
            if (fill && fill !== 'transparent') {
                ctx.fillStyle = fill;
                ctx.fill();
            }
            ctx.stroke();
        } else if (shapeType === 'line') {
            ctx.moveTo(startPt.x, startPt.y);
            ctx.lineTo(endPt.x, endPt.y);
            ctx.stroke();
        } else if (shapeType === 'arrow') {
            // Draw the line
            ctx.moveTo(startPt.x, startPt.y);
            ctx.lineTo(endPt.x, endPt.y);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(endPt.y - startPt.y, endPt.x - startPt.x);
            const headLen = Math.max(12, strokeWidth * 4);
            ctx.beginPath();
            ctx.moveTo(endPt.x, endPt.y);
            ctx.lineTo(
                endPt.x - headLen * Math.cos(angle - Math.PI / 6),
                endPt.y - headLen * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endPt.x, endPt.y);
            ctx.lineTo(
                endPt.x - headLen * Math.cos(angle + Math.PI / 6),
                endPt.y - headLen * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
        }
    }, []);

    // Set up canvas dimensions (resize only)
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resize = () => {
            const rect = container.getBoundingClientRect();
            const ctx = canvas.getContext('2d');
            const imageData = canvas.width > 0 ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;

            canvas.width = rect.width;
            canvas.height = rect.height;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drawCanvasTheme(ctx, canvas.width, canvas.height, canvasTheme);

            if (imageData) {
                ctx.putImageData(imageData, 0, 0);
            }
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, [canvasRef, drawCanvasTheme]);

    // Redraw theme when canvasTheme changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || canvas.width === 0) return;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawCanvasTheme(ctx, canvas.width, canvas.height, canvasTheme);
    }, [canvasTheme, canvasRef, drawCanvasTheme]);

    // Listen for remote drawing events (live streaming)
    useEffect(() => {
        const sock = socket?.current;
        if (!sock) return;

        const handleRemoteStart = (data) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            ctx.beginPath();
            ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
            ctx.lineWidth = data.tool === 'eraser' ? data.size * 3 : data.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(data.x, data.y);

            remoteDrawing.current[data.senderId] = {
                tool: data.tool,
                color: data.color,
                size: data.size,
                username: data.username
            };

            updateRemoteCursor(data.senderId, data.x, data.y, data.username, data.color);
        };

        const handleRemoteMove = (data) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const rd = remoteDrawing.current[data.senderId];

            if (rd) {
                ctx.strokeStyle = rd.tool === 'eraser' ? '#ffffff' : rd.color;
                ctx.lineWidth = rd.tool === 'eraser' ? rd.size * 3 : rd.size;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }

            ctx.lineTo(data.x, data.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(data.x, data.y);

            if (rd) {
                updateRemoteCursor(data.senderId, data.x, data.y, rd.username, rd.color);
            }
        };

        const handleClearBoard = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const handleUndo = () => {
            sock.emit('load-session', { roomId });
        };

        const handleSessionLoaded = (session) => {
            if (!session || !session.strokes) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            session.strokes.forEach(stroke => drawFullStroke(stroke));
        };

        sock.on('draw-start', handleRemoteStart);
        sock.on('draw-move', handleRemoteMove);
        sock.on('clear-board', handleClearBoard);
        sock.on('undo', handleUndo);
        sock.on('session-loaded', handleSessionLoaded);

        sock.emit('load-session', { roomId });

        return () => {
            sock.off('draw-start', handleRemoteStart);
            sock.off('draw-move', handleRemoteMove);
            sock.off('clear-board', handleClearBoard);
            sock.off('undo', handleUndo);
            sock.off('session-loaded', handleSessionLoaded);
        };
    }, [socket, roomId, canvasRef]);

    const updateRemoteCursor = (senderId, x, y, username, drawColor) => {
        setRemoteCursors(prev => ({
            ...prev,
            [senderId]: { x, y, username, color: getUserColor(username), visible: true }
        }));

        if (cursorTimeouts.current[senderId]) {
            clearTimeout(cursorTimeouts.current[senderId]);
        }
        cursorTimeouts.current[senderId] = setTimeout(() => {
            setRemoteCursors(prev => ({
                ...prev,
                [senderId]: { ...prev[senderId], visible: false }
            }));
        }, 2000);
    };

    const drawFullStroke = useCallback((stroke) => {
        const canvas = canvasRef.current;
        if (!canvas || !stroke.points || stroke.points.length < 2) return;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
        ctx.lineWidth = stroke.tool === 'eraser' ? stroke.size * 3 : stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
    }, [canvasRef]);

    const startDrawing = (e) => {
        e.preventDefault();
        const point = getCanvasPoint(e);
        if (!point) return;

        saveState();
        setIsDrawing(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (tool === 'shape') {
            // Save the canvas snapshot for shape preview
            shapeStartPoint.current = point;
            shapeSnapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else {
            // Freehand drawing (pencil/eraser)
            currentStroke.current = [point];
            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(point.x, point.y);

            if (socket?.current) {
                socket.current.volatile.emit('draw-start', {
                    roomId,
                    senderId: socket.current.id,
                    username: user?.username || 'Unknown',
                    x: point.x,
                    y: point.y,
                    tool,
                    color,
                    size: brushSize
                });
            }
        }
    };

    const draw = (e) => {
        e.preventDefault();

        if (tool === 'eraser' && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setEraserPos({ x: clientX - rect.left, y: clientY - rect.top, visible: true });
        }

        if (!isDrawing) return;

        const point = getCanvasPoint(e);
        if (!point) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (tool === 'shape') {
            // Restore snapshot and draw shape preview
            if (shapeSnapshot.current) {
                ctx.putImageData(shapeSnapshot.current, 0, 0);
            }
            drawShape(ctx, shape, shapeStartPoint.current, point, color, brushSize, fillColor);
        } else {
            // Freehand drawing
            currentStroke.current.push(point);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();

            if (socket?.current) {
                socket.current.volatile.emit('draw-move', {
                    roomId,
                    senderId: socket.current.id,
                    x: point.x,
                    y: point.y
                });
            }
        }
    };

    const stopDrawing = (e) => {
        if (e) e.preventDefault();
        if (!isDrawing) return;

        setIsDrawing(false);

        if (tool === 'shape') {
            // Shape is already drawn on the canvas from the last preview
            shapeStartPoint.current = null;
            shapeSnapshot.current = null;
        } else {
            // Freehand stroke complete — emit to server
            if (currentStroke.current.length > 1 && socket?.current) {
                const stroke = {
                    tool,
                    color,
                    size: brushSize,
                    points: currentStroke.current,
                    timestamp: Date.now()
                };
                socket.current.emit('draw-stroke', { roomId, stroke });

                if (isRecording) {
                    socket.current.emit('record-event', {
                        roomId,
                        event: { type: 'stroke', data: stroke }
                    });
                }
            }
            currentStroke.current = [];
        }
    };

    return (
        <div
            ref={containerRef}
            className={`whiteboard-canvas-area`}
            style={{ flex: 1 }}
            onMouseMove={(e) => {
                if (tool === 'eraser') {
                    const rect = containerRef.current.getBoundingClientRect();
                    setEraserPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
                }
            }}
            onMouseLeave={() => setEraserPos(prev => ({ ...prev, visible: false }))}
            onMouseEnter={() => { if (tool === 'eraser') setEraserPos(prev => ({ ...prev, visible: true })); }}
        >
            <canvas
                ref={canvasRef}
                className={tool === 'eraser' ? 'eraser-cursor' : (tool === 'shape' ? 'crosshair-cursor' : '')}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />

            {/* Visible eraser cursor */}
            {tool === 'eraser' && eraserPos.visible && (
                <div
                    className="eraser-circle"
                    style={{
                        position: 'absolute',
                        left: eraserPos.x - (brushSize * 1.5),
                        top: eraserPos.y - (brushSize * 1.5),
                        width: brushSize * 3,
                        height: brushSize * 3,
                        borderRadius: '50%',
                        border: '2px solid #ff6b9d',
                        background: 'rgba(255, 107, 157, 0.1)',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                />
            )}

            {/* Remote user cursor labels */}
            {Object.entries(remoteCursors).map(([id, cursor]) => (
                cursor.visible && (
                    <div
                        key={id}
                        style={{
                            position: 'absolute',
                            left: cursor.x + 12,
                            top: cursor.y - 8,
                            pointerEvents: 'none',
                            zIndex: 20,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'left 0.05s linear, top 0.05s linear',
                        }}
                    >
                        <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: cursor.color,
                            boxShadow: `0 0 6px ${cursor.color}80`,
                            flexShrink: 0,
                        }} />
                        <div style={{
                            background: cursor.color,
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '8px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            letterSpacing: '0.3px',
                        }}>
                            {cursor.username}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
};

export default Canvas;
