const BrushSize = ({ brushSize, setBrushSize }) => {
    return (
        <div className="brush-size-slider">
            <span className="brush-size-label">{brushSize}px</span>
            <input
                type="range"
                min="1"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                title={`Brush size: ${brushSize}px`}
            />
            <div
                className="brush-preview"
                style={{
                    width: Math.max(Math.min(brushSize, 20), 4) + 'px',
                    height: Math.max(Math.min(brushSize, 20), 4) + 'px',
                }}
            />
        </div>
    );
};

export default BrushSize;
