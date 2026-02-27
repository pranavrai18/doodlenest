import { useState, useRef } from 'react';

const themes = [
    { id: 'blank', label: 'Blank', icon: '□' },
    { id: 'dots', label: 'Dots', icon: '⠿' },
    { id: 'grid', label: 'Grid', icon: '⊞' },
    { id: 'ruled', label: 'Ruled', icon: '☰' },
];

const CanvasThemePicker = ({ canvasTheme, setCanvasTheme }) => {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef(null);

    const currentTheme = themes.find(t => t.id === canvasTheme) || themes[0];

    return (
        <div className="canvas-theme-picker" ref={pickerRef}>
            <button
                className="btn btn-icon tooltip"
                data-tooltip="Canvas Style"
                title="Canvas Style"
                onClick={() => setOpen(prev => !prev)}
                style={{ fontSize: '0.9rem' }}
            >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    {canvasTheme === 'grid' && (
                        <>
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="3" y1="15" x2="21" y2="15" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                            <line x1="15" y1="3" x2="15" y2="21" />
                        </>
                    )}
                    {canvasTheme === 'dots' && (
                        <>
                            <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
                            <circle cx="16" cy="8" r="1" fill="currentColor" stroke="none" />
                            <circle cx="8" cy="16" r="1" fill="currentColor" stroke="none" />
                            <circle cx="16" cy="16" r="1" fill="currentColor" stroke="none" />
                            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                        </>
                    )}
                    {canvasTheme === 'ruled' && (
                        <>
                            <line x1="3" y1="8" x2="21" y2="8" />
                            <line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="16" x2="21" y2="16" />
                        </>
                    )}
                </svg>
            </button>

            {open && (
                <div className="canvas-theme-dropdown">
                    <div className="canvas-theme-dropdown-title">Canvas Style</div>
                    <div className="canvas-theme-options">
                        {themes.map(theme => (
                            <button
                                key={theme.id}
                                className={`canvas-theme-option ${canvasTheme === theme.id ? 'active' : ''}`}
                                onClick={() => {
                                    setCanvasTheme(theme.id);
                                    setOpen(false);
                                }}
                                title={theme.label}
                            >
                                <div className={`canvas-theme-preview theme-preview-${theme.id}`} />
                                <span className="canvas-theme-label">{theme.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CanvasThemePicker;
