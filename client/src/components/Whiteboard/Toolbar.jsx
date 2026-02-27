import { useState } from 'react';
import API from '../../api/axios';
import ColorPicker from './ColorPicker';
import BrushSize from './BrushSize';
import CanvasThemePicker from './CanvasThemePicker';

const Toolbar = ({ canvasState, socket, roomId, isRecording, setIsRecording, children }) => {
    const {
        tool, setTool,
        color, setColor,
        fillColor, setFillColor,
        brushSize, setBrushSize,
        shape, setShape,
        undo, redo,
        undoStack, redoStack,
        canvasTheme, setCanvasTheme
    } = canvasState;

    const [showShapePicker, setShowShapePicker] = useState(false);

    const handleClearBoard = () => {
        clearBoard();
        if (socket?.current) socket.current.emit('clear-board', { roomId });
    };

    const handleUndo = () => {
        const result = undo();
        if (result && socket?.current) socket.current.emit('undo', { roomId });
    };

    const handleRedo = () => {
        const result = redo();
        if (result && socket?.current) socket.current.emit('redo', { roomId });
    };

    const handleSaveImage = () => {
        const dataUrl = getSnapshot();
        if (!dataUrl) return;
        const link = document.createElement('a');
        link.download = `whiteboard-${roomId}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <div className="toolbar vertical">
            {/* Drawing Tools */}
            <div className="vt-group">
                <button className={`vt-btn ${tool === 'pencil' ? 'active' : ''}`} onClick={() => setTool('pencil')} title="Pencil (P)">
                    <svg viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                </button>
                <button className={`vt-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')} title="Eraser (E)">
                    <svg viewBox="0 0 24 24"><path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0L20.5 10.1a2 2 0 0 1 0 2.82L13 20" /><path d="M6 20h14" /></svg>
                </button>
                <button className={`vt-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')} title="Text (T)">
                    <svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
                </button>
                <div className="vt-sub">
                    <button className={`vt-btn ${tool === 'shape' ? 'active' : ''}`} onClick={() => { setTool('shape'); setShowShapePicker(p => !p); }} title="Shapes">
                        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                    </button>
                    {showShapePicker && (
                        <div className="vt-flyout">
                            <div className="vt-flyout-grid">
                                <button className={`vt-btn ${shape === 'rectangle' ? 'active' : ''}`} onClick={() => { setShape('rectangle'); setShowShapePicker(false); }} title="Rectangle">
                                    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                                </button>
                                <button className={`vt-btn ${shape === 'circle' ? 'active' : ''}`} onClick={() => { setShape('circle'); setShowShapePicker(false); }} title="Circle">
                                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                                </button>
                                <button className={`vt-btn ${shape === 'line' ? 'active' : ''}`} onClick={() => { setShape('line'); setShowShapePicker(false); }} title="Line">
                                    <svg viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5" /></svg>
                                </button>
                                <button className={`vt-btn ${shape === 'arrow' ? 'active' : ''}`} onClick={() => { setShape('arrow'); setShowShapePicker(false); }} title="Arrow">
                                    <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="vt-sep" />

            {/* Color + Size */}
            <div className="vt-group">
                <ColorPicker color={color} setColor={setColor} />
                <BrushSize brushSize={brushSize} setBrushSize={setBrushSize} />
            </div>

            <div className="vt-sep" />

            {/* Canvas Style */}
            <div className="vt-group">
                <CanvasThemePicker canvasTheme={canvasTheme} setCanvasTheme={setCanvasTheme} />
            </div>

            <div className="vt-sep" />

            {/* Actions */}
            <div className="vt-group">
                <button className="vt-btn" onClick={handleUndo} disabled={undoStack.length === 0} title="Undo" style={{ opacity: undoStack.length === 0 ? 0.3 : 1 }}>
                    <svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                </button>
                <button className="vt-btn" onClick={handleRedo} disabled={redoStack.length === 0} title="Redo" style={{ opacity: redoStack.length === 0 ? 0.3 : 1 }}>
                    <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" /></svg>
                </button>
                <button className="vt-btn" onClick={handleClearBoard} title="Clear Board">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
                <button className="vt-btn" onClick={handleSaveImage} title="Save as PNG">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </button>
            </div>

            <div className="vt-sep" />

            {/* Share + Record */}
            <div className="vt-group">
                {children}
                <button
                    className={`vt-btn ${isRecording ? 'vt-rec-active' : ''}`}
                    onClick={() => setIsRecording(p => !p)}
                    title={isRecording ? 'Stop Recording' : 'Record'}
                >
                    <svg viewBox="0 0 24 24" style={{ fill: isRecording ? '#fff' : 'currentColor', stroke: 'none' }}><circle cx="12" cy="12" r="8" /></svg>
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
