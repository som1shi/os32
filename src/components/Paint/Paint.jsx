import React, { useRef, useState, useEffect, useCallback } from 'react';
import './Paint.css';

const XP_PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ff8040', '#804000', '#804040', '#408080', '#004080', '#8000ff', '#ff0080', '#ff8080',
  '#ffff80', '#80ff80', '#80ffff', '#8080ff',
];

const TOOLS = [
  { id: 'pencil', label: '✏️', title: 'Pencil' },
  { id: 'eraser', label: '⬜', title: 'Eraser' },
  { id: 'fill', label: '🪣', title: 'Fill' },
  { id: 'line', label: '╱', title: 'Line' },
  { id: 'rect', label: '▭', title: 'Rectangle' },
  { id: 'ellipse', label: '◯', title: 'Ellipse' },
  { id: 'eyedrop', label: '💉', title: 'Eyedropper' },
];

const SIZES = [1, 3, 6, 12];

function getCanvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: Math.round((clientX - rect.left) * scaleX),
    y: Math.round((clientY - rect.top) * scaleY),
  };
}

function floodFill(ctx, startX, startY, fillColorHex) {
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b, 255];
  };

  const idx = (x, y) => (y * w + x) * 4;
  const target = data.slice(idx(startX, startY), idx(startX, startY) + 4);
  const fill = hexToRgb(fillColorHex);

  if (target.every((v, i) => v === fill[i])) return;

  const match = (x, y) => {
    const i = idx(x, y);
    return data[i] === target[0] && data[i + 1] === target[1] && data[i + 2] === target[2] && data[i + 3] === target[3];
  };

  const stack = [[startX, startY]];
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    if (!match(cx, cy)) continue;
    const i = idx(cx, cy);
    data[i] = fill[0]; data[i + 1] = fill[1]; data[i + 2] = fill[2]; data[i + 3] = fill[3];
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawEllipse(ctx, x1, y1, x2, y2) {
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

const Paint = () => {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('pencil');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [strokeSize, setStrokeSize] = useState(3);
  const [activeColorSlot, setActiveColorSlot] = useState('primary');
  const isDrawing = useRef(false);
  const startPos = useRef(null);
  const savedImageData = useRef(null);
  const lastPos = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = primaryColor;
    return ctx;
  }, [strokeSize, primaryColor]);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    const pos = getCanvasPos(canvas, e);
    isDrawing.current = true;
    startPos.current = pos;
    lastPos.current = pos;

    if (activeTool === 'fill') {
      floodFill(ctx, pos.x, pos.y, primaryColor);
      isDrawing.current = false;
      return;
    }

    if (activeTool === 'eyedrop') {
      const pixel = ctx.getImageData(pos.x, pos.y, 1, 1).data;
      const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
      if (activeColorSlot === 'primary') setPrimaryColor(hex);
      else setSecondaryColor(hex);
      isDrawing.current = false;
      return;
    }

    if (['line', 'rect', 'ellipse'].includes(activeTool)) {
      savedImageData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (activeTool === 'pencil') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [activeTool, primaryColor, activeColorSlot, getCtx]);

  const onPointerMove = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = getCtx();
    const pos = getCanvasPos(canvas, e);

    if (activeTool === 'pencil') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
    } else if (activeTool === 'eraser') {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = strokeSize * 4;
      ctx.lineCap = 'square';
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      ctx.restore();
      lastPos.current = pos;
    } else if (savedImageData.current) {
      ctx.putImageData(savedImageData.current, 0, 0);
      const { x: sx, y: sy } = startPos.current;
      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (activeTool === 'rect') {
        ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      } else if (activeTool === 'ellipse') {
        drawEllipse(ctx, sx, sy, pos.x, pos.y);
      }
    }
  }, [activeTool, strokeSize, getCtx]);

  const onPointerUp = useCallback((e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    savedImageData.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
  }, []);

  const handleNew = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'untitled.png';
    a.click();
  }, []);

  const pickColor = useCallback((color) => {
    if (activeColorSlot === 'primary') setPrimaryColor(color);
    else setSecondaryColor(color);
  }, [activeColorSlot]);

  return (
    <div className="paint-app">
      {/* Menu bar */}
      <div className="paint-menubar">
        <div className="paint-menu-item">
          <span>File</span>
          <div className="paint-menu-dropdown">
            <button onMouseDown={(e) => { e.preventDefault(); handleNew(); }}>New</button>
            <button onMouseDown={(e) => { e.preventDefault(); handleSave(); }}>Save as PNG</button>
          </div>
        </div>
        <div className="paint-menu-item">
          <span>Edit</span>
          <div className="paint-menu-dropdown">
            <button onMouseDown={(e) => { e.preventDefault(); handleNew(); }}>Clear Canvas</button>
          </div>
        </div>
      </div>

      <div className="paint-body">
        {/* Toolbar */}
        <div className="paint-toolbar">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              className={`paint-tool-btn${activeTool === tool.id ? ' active' : ''}`}
              title={tool.title}
              onMouseDown={(e) => { e.preventDefault(); setActiveTool(tool.id); }}
            >
              {tool.label}
            </button>
          ))}
          <div className="paint-size-section">
            {SIZES.map(s => (
              <button
                key={s}
                className={`paint-size-btn${strokeSize === s ? ' active' : ''}`}
                title={`${s}px`}
                onMouseDown={(e) => { e.preventDefault(); setStrokeSize(s); }}
              >
                <div className="paint-size-dot" style={{ width: Math.min(s * 1.5, 14), height: Math.min(s * 1.5, 14) }} />
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="paint-canvas-area">
          <canvas
            ref={canvasRef}
            width={800}
            height={540}
            className="paint-canvas"
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
          />
        </div>
      </div>

      {/* Bottom palette */}
      <div className="paint-palette-bar">
        {/* Active color swatches */}
        <div className="paint-color-swatches">
          <div
            className={`paint-swatch-back${activeColorSlot === 'secondary' ? ' selected' : ''}`}
            style={{ background: secondaryColor }}
            title="Secondary color (right-click to select)"
            onClick={() => setActiveColorSlot('secondary')}
          />
          <div
            className={`paint-swatch-front${activeColorSlot === 'primary' ? ' selected' : ''}`}
            style={{ background: primaryColor }}
            title="Primary color"
            onClick={() => setActiveColorSlot('primary')}
          />
        </div>
        {/* Color grid */}
        <div className="paint-palette">
          {XP_PALETTE.map(color => (
            <div
              key={color}
              className="paint-color"
              style={{ background: color }}
              title={color}
              onClick={() => pickColor(color)}
            />
          ))}
        </div>
        {/* Custom color picker */}
        <input
          type="color"
          className="paint-custom-color"
          value={activeColorSlot === 'primary' ? primaryColor : secondaryColor}
          onChange={(e) => pickColor(e.target.value)}
          title="Custom color"
        />
      </div>
    </div>
  );
};

export default Paint;
