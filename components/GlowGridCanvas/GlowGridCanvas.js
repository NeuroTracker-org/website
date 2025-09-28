import { useEffect, useRef, useState } from 'react';

// STYLES
import styles from './GlowGridCanvas.module.css';

const GlowGridCanvas = () => {
    const canvasRef = useRef(null);
    const [mousePos, setMousePos] = useState({ mouseX: -1000, mouseY: -1000 });
    const gridSize = 140; // Size of each grid square (including the border gap)
    const borderSize = 1; // Border size for the first grid (1px)

    // Function to draw the first grid with 1px borders
    const drawGridWithStroke = (ctx, width, height) => {
        const rows = Math.ceil(height / gridSize);
        const cols = Math.ceil(width / gridSize);

        ctx.strokeStyle = '#13171e'; // Border color for the first grid
        ctx.lineWidth = borderSize; // 1px border

        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const x = col * gridSize;
                const y = row * gridSize;

                // Draw the 1px border grid
                ctx.strokeRect(x, y, gridSize, gridSize);
            }
        }
    };

    // Function to draw the second grid with filled squares, with gaps equal to border size
    const drawGridWithFill = (ctx, width, height) => {
        const rows = Math.ceil(height / gridSize);
        const cols = Math.ceil(width / gridSize);

        ctx.fillStyle = 'rgba(16, 19, 25, 0.98)'; // Fill color for the second grid

        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const x = col * gridSize + borderSize; // Shift by border size to create the gap
                const y = row * gridSize + borderSize;

                const squareSize = gridSize - 2 * borderSize; // Adjust square size to leave gaps
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
    };

    // Function to draw the cursor (blurred circle) with overlay effect
    const drawCursor = (ctx) => {
        ctx.save();

        const gradient = ctx.createRadialGradient(
            mousePos.mouseX,
            mousePos.mouseY,
            10,
            mousePos.mouseX,
            mousePos.mouseY,
            200
        );
        gradient.addColorStop(0, 'rgba(5,100,255, 0.7)'); // Bright at center
        gradient.addColorStop(1, 'rgba(5,100,255, 0)'); // Fades out

        // Simulate mix-blend-mode: overlay
        ctx.globalCompositeOperation = 'overlay'; //overlay or lighten
        ctx.fillStyle = gradient;

        // Draw the cursor (blurred circle)
        ctx.beginPath();
        ctx.arc(mousePos.mouseX, mousePos.mouseY, 200, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    // Function to draw the grid with dots
    const drawGridWithDots = (ctx, width, height) => {
        const rows = Math.ceil(height / gridSize);
        const cols = Math.ceil(width / gridSize);

        ctx.fillStyle = '#00368f'; // Dot color

        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const x = col * gridSize;
                const y = row * gridSize;

                const dotRadius = 1.5;

                // Top-left corner
                ctx.beginPath();
                ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();

                // Top-right corner
                ctx.beginPath();
                ctx.arc(x + gridSize, y, dotRadius, 0, Math.PI * 2);
                ctx.fill();

                // Bottom-left corner
                ctx.beginPath();
                ctx.arc(x, y + gridSize, dotRadius, 0, Math.PI * 2);
                ctx.fill();

                // Bottom-right corner
                ctx.beginPath();
                ctx.arc(x + gridSize, y + gridSize, dotRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    };

    // Function to redraw the entire scene
    const drawScene = (ctx, width, height) => {
        ctx.clearRect(0, 0, width, height);

        drawGridWithStroke(ctx, width, height);
        drawCursor(ctx);
        drawGridWithFill(ctx, width, height);
        drawGridWithDots(ctx, width, height);
    };

    // Set up the canvas and handle events
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawScene(ctx, canvas.width, canvas.height);
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            setMousePos({
                mouseX: e.clientX - rect.left,
                mouseY: e.clientY - rect.top,
            });
        };

        // Initial canvas setup
        resizeCanvas();

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mousePos]);

    return (
        <div className={styles.canvasContainer}>
            <canvas ref={canvasRef} id="glowGridCanvas" style={{ display: 'block', width: '100%', height: '100vh' }}></canvas>
        </div>
    );
};

export default GlowGridCanvas;