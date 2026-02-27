import { useState } from 'react';

const ColorPicker = ({ color, setColor }) => {
    const [showTray, setShowTray] = useState(false);

    const colors = [
        '#1a1a2e', '#ffffff',
        '#ff1744', '#ff6b9d',
        '#ff9100', '#ffea00',
        '#00e676', '#00b0ff',
        '#6c63ff', '#d500f9'
    ];

    return (
        <div className="vt-sub">
            <button
                className="vt-btn"
                onClick={() => setShowTray(p => !p)}
                title="Color"
                style={{ position: 'relative' }}
            >
                <span className="color-current" style={{ backgroundColor: color }} />
            </button>
            {showTray && (
                <div className="vt-flyout color-tray">
                    <div className="color-tray-grid">
                        {colors.map(c => (
                            <div
                                key={c}
                                className={`color-tray-dot ${color === c ? 'active' : ''}`}
                                style={{
                                    backgroundColor: c,
                                    boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.15)' : 'none'
                                }}
                                onClick={() => { setColor(c); setShowTray(false); }}
                            />
                        ))}
                    </div>
                    <div className="color-tray-custom">
                        <input
                            type="color"
                            value={color}
                            onChange={e => { setColor(e.target.value); setShowTray(false); }}
                            title="Custom"
                        />
                        <span>Custom</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorPicker;
