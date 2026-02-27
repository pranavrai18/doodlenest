import { useState, useRef, useCallback } from 'react';

export const useCanvas = () => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#ffffff');
    const [fillColor, setFillColor] = useState('transparent');
    const [brushSize, setBrushSize] = useState(3);
    const [shape, setShape] = useState('rectangle'); // rectangle | circle | line | arrow
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const currentStroke = useRef([]);

    // Canvas theme: 'blank' | 'dots' | 'grid' | 'ruled'
    const [canvasTheme, setCanvasTheme] = useState('dots');

    // Multi-page state
    const [pages, setPages] = useState([null]); // array of imageData (null = blank)
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = pages.length;

    const getCanvasPoint = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }, []);

    const saveState = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack(prev => [...prev.slice(-30), imageData]);
        setRedoStack([]);
    }, []);

    const undo = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || undoStack.length === 0) return null;

        const ctx = canvas.getContext('2d');
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setRedoStack(prev => [...prev, currentState]);

        const previousState = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        ctx.putImageData(previousState, 0, 0);

        return previousState;
    }, [undoStack]);

    const redo = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || redoStack.length === 0) return null;

        const ctx = canvas.getContext('2d');
        const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setUndoStack(prev => [...prev, currentState]);

        const nextState = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        ctx.putImageData(nextState, 0, 0);

        return nextState;
    }, [redoStack]);

    const clearBoard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        saveState();
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [saveState]);

    const getSnapshot = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.toDataURL('image/png');
    }, []);

    // Save current page's imageData before switching
    const saveCurrentPage = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setPages(prev => {
            const updated = [...prev];
            updated[currentPage] = imageData;
            return updated;
        });
    }, [currentPage]);

    // Load a page's imageData onto the canvas
    const loadPage = useCallback((pageIndex) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Clear to white first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load saved imageData if exists
        setPages(prev => {
            if (prev[pageIndex]) {
                // Use setTimeout to ensure state is consistent
                setTimeout(() => {
                    const canvas = canvasRef.current;
                    if (canvas && prev[pageIndex]) {
                        canvas.getContext('2d').putImageData(prev[pageIndex], 0, 0);
                    }
                }, 0);
            }
            return prev;
        });
    }, [canvasRef]);

    const goToPage = useCallback((pageIndex) => {
        if (pageIndex < 0 || pageIndex >= pages.length) return;
        saveCurrentPage();
        setCurrentPage(pageIndex);
        loadPage(pageIndex);
        // Reset undo/redo per page (simplification)
        setUndoStack([]);
        setRedoStack([]);
    }, [pages.length, saveCurrentPage, loadPage]);

    const addPage = useCallback(() => {
        saveCurrentPage();
        const newIndex = pages.length;
        setPages(prev => [...prev, null]);
        setCurrentPage(newIndex);
        // Clear canvas for new page
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        setUndoStack([]);
        setRedoStack([]);
    }, [pages.length, saveCurrentPage, canvasRef]);

    const deletePage = useCallback(() => {
        if (pages.length <= 1) return; // Can't delete last page
        setPages(prev => {
            const updated = [...prev];
            updated.splice(currentPage, 1);
            return updated;
        });
        const newIndex = Math.min(currentPage, pages.length - 2);
        setCurrentPage(newIndex);
        loadPage(newIndex);
        setUndoStack([]);
        setRedoStack([]);
    }, [pages.length, currentPage, loadPage]);


    return {
        canvasRef,
        isDrawing, setIsDrawing,
        tool, setTool,
        color, setColor,
        fillColor, setFillColor,
        brushSize, setBrushSize,
        shape, setShape,
        undoStack, redoStack,
        currentStroke,
        getCanvasPoint,
        saveState,
        undo,
        redo,
        clearBoard,
        getSnapshot,
        canvasTheme, setCanvasTheme,
        // Multi-page
        currentPage, totalPages,
        goToPage, addPage, deletePage
    };
};
