import { useState, useRef } from 'react';
import { Download, Plus, Trash2, Settings2, Tag } from 'lucide-react';

type NumberingStyle = 'bottom-up' | 'top-down';
type TitlePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface Config {
  title: string;
  titlePosition: TitlePosition;
  rows: number;
  cols: number;
  rotation: number;
  pinPitch: number;
  pinSize: number;
  numbering: NumberingStyle;
}

interface PinLabel {
  id: string;
  pinNumber: number;
  text: string;
  color: string;
  lineLength: number;
  lineAngle: number;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#eab308', // Yellow
  '#f97316', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#000000', // Black
  '#6b7280', // Gray
];

export default function App() {
  const svgRef = useRef<SVGSVGElement>(null);

  const [config, setConfig] = useState<Config>({
    title: "PEUGEOT 307\n2006-2013 CLUSTER\nPINOUT",
    titlePosition: 'bottom-left',
    rows: 2,
    cols: 9,
    rotation: -18,
    pinPitch: 26,
    pinSize: 12,
    numbering: 'bottom-up'
  });

  const [canvasBg, setCanvasBg] = useState<'black' | 'white'>('white');

  const [labels, setLabels] = useState<PinLabel[]>([
    { id: '1', pinNumber: 1, text: 'CAN-L', color: '#10b981', lineLength: 120, lineAngle: 72 },
    { id: '2', pinNumber: 8, text: 'GND', color: '#000000', lineLength: 120, lineAngle: 72 },
    { id: '3', pinNumber: 9, text: '+12V', color: '#ef4444', lineLength: 160, lineAngle: 72 },
    { id: '4', pinNumber: 18, text: 'CAN-H', color: '#3b82f6', lineLength: 120, lineAngle: -108 },
  ]);

  const getPinNumber = (r: number, c: number) => {
    if (config.numbering === 'bottom-up') {
      const bottomRowIdx = config.rows - 1 - r;
      return bottomRowIdx * config.cols + c + 1;
    }
    return r * config.cols + c + 1;
  };

  const getPinPosition = (r: number, c: number) => {
    const localX = (c - (config.cols - 1) / 2) * config.pinPitch;
    const localY = (r - (config.rows - 1) / 2) * config.pinPitch;
    
    const angleRad = config.rotation * Math.PI / 180;
    const x = localX * Math.cos(angleRad) - localY * Math.sin(angleRad);
    const y = localX * Math.sin(angleRad) + localY * Math.cos(angleRad);
    
    return { x, y };
  };

  const drawOuterShell = (w: number, h: number) => {
    const c = 20; 
    return `M ${-w/2 + c} ${-h/2} L ${w/2 - c} ${-h/2} L ${w/2} ${-h/2 + c} L ${w/2} ${h/2 - c} L ${w/2 - c} ${h/2} L ${-w/2 + c} ${h/2} L ${-w/2} ${h/2 - c} L ${-w/2} ${-h/2 + c} Z`;
  };

  const drawInnerShell = (w: number, h: number) => {
    const notchW = Math.min(30, w * 0.5);
    const notchD = 8;
    return `M ${-w/2} ${-h/2} L ${-notchW/2} ${-h/2} L ${-notchW/2} ${-h/2 + notchD} L ${notchW/2} ${-h/2 + notchD} L ${notchW/2} ${-h/2} L ${w/2} ${-h/2} L ${w/2} ${h/2} L ${notchW/2} ${h/2} L ${notchW/2} ${h/2 - notchD} L ${-notchW/2} ${h/2 - notchD} L ${-notchW/2} ${h/2} L ${-w/2} ${h/2} Z`;
  };

  const exportImage = () => {
    const svg = svgRef.current;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = canvasBg === 'black' ? "#0f0f0f" : "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png", 1.0);
      
      const downloadLink = document.createElement("a");
      downloadLink.download = "pinout-diagram.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const addLabel = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setLabels([...labels, {
      id: newId,
      pinNumber: 1,
      text: 'NEW PIN',
      color: '#f97316',
      lineLength: 100,
      lineAngle: config.rotation + 90
    }]);
  };

  const updateLabel = (id: string, updates: Partial<PinLabel>) => {
    setLabels(labels.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLabel = (id: string) => {
    setLabels(labels.filter(l => l.id !== id));
  };

  const updateAllLineAngles = (angle: number) => {
    setLabels(labels.map(l => ({ ...l, lineAngle: angle })));
  };

  const innerW = config.cols * config.pinPitch + 40;
  const innerH = config.rows * config.pinPitch + 30;
  const outerW = innerW + 80;
  const outerH = innerH + 50;

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-neutral-200 font-sans overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-[420px] bg-[#0E0E0E] border-r border-neutral-800 flex flex-col h-full shadow-lg z-10">
        <div className="p-4 border-b border-neutral-800 bg-[#111111] flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Pinout Generator</h1>
            <p className="text-xs text-neutral-500">Create automotive cluster diagrams</p>
          </div>
          <button 
            onClick={exportImage} 
            className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} /> Export PNG
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-8 pb-20">
          {/* General Settings */}
          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Settings2 size={14} /> Connector Settings
            </h2>
            
            <div className="space-y-4 bg-[#111111] p-4 rounded-xl border border-neutral-800">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Diagram Title</label>
                <textarea 
                  value={config.title} 
                  onChange={e => setConfig({...config, title: e.target.value})}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Rows</label>
                  <input type="number" min="1" max="10" value={config.rows} onChange={e => setConfig({...config, rows: parseInt(e.target.value) || 1})} className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Columns</label>
                  <input type="number" min="1" max="60" value={config.cols} onChange={e => setConfig({...config, cols: parseInt(e.target.value) || 1})} className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Connector Angle</label>
                  <span className="text-xs text-neutral-400 bg-neutral-800 px-2 rounded">{config.rotation}°</span>
                </div>
                <input type="range" min="-180" max="180" value={config.rotation} onChange={e => setConfig({...config, rotation: parseInt(e.target.value)})} className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Numbering Order</label>
                  <select value={config.numbering} onChange={e => setConfig({...config, numbering: e.target.value as NumberingStyle})} className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="bottom-up">Bottom Up</option>
                    <option value="top-down">Top Down</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Title Position</label>
                  <select value={config.titlePosition} onChange={e => setConfig({...config, titlePosition: e.target.value as TitlePosition})} className="w-full bg-neutral-900 border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Canvas Background</label>
                <div className="flex gap-2 bg-neutral-900 p-1 rounded-md border border-neutral-800">
                  <button 
                    onClick={() => setCanvasBg('black')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${canvasBg === 'black' ? 'bg-[#0f0f0f] text-neutral-200 shadow-sm border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >Dark</button>
                  <button 
                    onClick={() => setCanvasBg('white')} 
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${canvasBg === 'white' ? 'bg-white text-black shadow-sm border border-neutral-300' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >Light</button>
                </div>
              </div>
            </div>
          </section>

          {/* Pin Labels */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                <Tag size={14} /> Active Pins
              </h2>
              <button 
                onClick={addLabel} 
                className="text-xs flex items-center gap-1 bg-blue-900/20 text-blue-400 px-3 py-1.5 rounded-md border border-blue-800/50 hover:bg-blue-900/40 font-medium transition-colors"
              >
                <Plus size={14} /> Add Pin Label
              </button>
            </div>
            
            <div className="space-y-3">
              {labels.length > 0 && (
                <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase text-neutral-500 font-bold flex items-center gap-2">Global Line Angle Override</label>
                  </div>
                  <input 
                    type="range" min="-180" max="180" 
                    value={labels[0]?.lineAngle || 0}
                    onChange={e => updateAllLineAngles(parseInt(e.target.value))} 
                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                  />
                  <p className="text-[10px] text-neutral-600">Changes angle for all pins below simultaneously</p>
                </div>
              )}
              {labels.map((label) => (
                <div key={label.id} className="p-4 bg-[#111111] border border-neutral-800 shadow-sm rounded-xl space-y-4 relative group">
                  <button 
                    onClick={() => removeLabel(label.id)} 
                    className="absolute -top-2 -right-2 bg-red-900/50 border border-red-800 text-red-400 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/80 shadow-sm"
                    title="Remove Label"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex gap-3">
                    <div className="w-20">
                      <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Pin #</label>
                      <input 
                        type="number" 
                        value={label.pinNumber} 
                        onChange={e => updateLabel(label.id, { pinNumber: parseInt(e.target.value) || 1 })} 
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-sm font-bold text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Signal Name</label>
                      <input 
                        type="text" 
                        value={label.text} 
                        onChange={e => updateLabel(label.id, { text: e.target.value })} 
                        className="w-full bg-neutral-900 border border-neutral-700 rounded p-1.5 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] uppercase text-neutral-500 font-bold">Line Angle</label>
                        <span className="text-[10px] text-neutral-400">{label.lineAngle}°</span>
                      </div>
                      <input 
                        type="range" min="-180" max="180" 
                        value={label.lineAngle} 
                        onChange={e => updateLabel(label.id, { lineAngle: parseInt(e.target.value) })} 
                        className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] uppercase text-neutral-500 font-bold">Line Length</label>
                        <span className="text-[10px] text-neutral-400">{label.lineLength}px</span>
                      </div>
                      <input 
                        type="range" min="30" max="300" 
                        value={label.lineLength} 
                        onChange={e => updateLabel(label.id, { lineLength: parseInt(e.target.value) })} 
                        className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Wire Color</label>
                    <div className="flex gap-1.5 flex-wrap items-center">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => updateLabel(label.id, { color })}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${label.color === color ? 'border-neutral-300 scale-110 shadow-sm' : 'border-neutral-800 hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="h-6 w-px bg-neutral-800 mx-1"></div>
                      <input 
                        type="color" 
                        value={label.color} 
                        onChange={e => updateLabel(label.id, { color: e.target.value })}
                        className="w-7 h-7 p-0 border-0 rounded cursor-pointer overflow-hidden bg-transparent"
                        title="Custom Color"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {labels.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-neutral-800 rounded-xl text-neutral-500 font-medium bg-[#111111]">
                  No signals mapped yet.<br/>Click "Add Pin Label" to start.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col relative bg-[#0A0A0A] bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] bg-[size:20px_20px]">
        <div className="flex-1 overflow-auto flex items-center justify-center p-12">
          
          <svg
            ref={svgRef}
            width="800"
            height="600"
            viewBox="-400 -300 800 600"
            className={`${canvasBg === 'black' ? 'bg-[#0f0f0f]' : 'bg-white'} shadow-[0_0_50px_rgba(59,130,246,0.15)] rounded-xl w-full max-w-[800px] h-auto aspect-[4/3] flex-shrink-0 border-2 border-blue-500/30 transition-colors duration-300`}
          >
            {/* Background */}
            <rect x="-400" y="-300" width="800" height="600" fill={canvasBg === 'black' ? '#0f0f0f' : '#ffffff'} />
            
            {/* Connector Group */}
            <g transform={`rotate(${config.rotation})`}>
              {/* Outer shell (grey housing) */}
              <path 
                d={drawOuterShell(outerW, outerH)} 
                fill={canvasBg === 'black' ? "#262626" : "#9ca3af"} 
                stroke={canvasBg === 'black' ? "#404040" : "#4b5563"} 
                strokeWidth={3} 
                strokeLinejoin="round" 
              />
              
              {/* Mounting holes on housing */}
              <circle cx={-outerW/2 + 20} cy={0} r={6} fill={canvasBg === 'black' ? "#0a0a0a" : "#111827"} />
              <circle cx={outerW/2 - 20} cy={0} r={6} fill={canvasBg === 'black' ? "#0a0a0a" : "#111827"} />

              {/* Inner shell (white connector face) */}
              <path 
                d={drawInnerShell(innerW, innerH)} 
                fill={canvasBg === 'black' ? "#171717" : "#f9fafb"} 
                stroke={canvasBg === 'black' ? "#404040" : "#6b7280"} 
                strokeWidth={2} 
                strokeLinejoin="round" 
              />

              {/* Pins and internal corner numbering */}
              {Array.from({ length: config.rows }).map((_, r) => (
                Array.from({ length: config.cols }).map((_, c) => {
                  const x = (c - (config.cols - 1) / 2) * config.pinPitch;
                  const y = (r - (config.rows - 1) / 2) * config.pinPitch;
                  
                  return (
                    <g key={`pin-group-${r}-${c}`}>
                      {/* The physical pin (square) */}
                      <rect 
                        x={x - config.pinSize/2} 
                        y={y - config.pinSize/2} 
                        width={config.pinSize} 
                        height={config.pinSize} 
                        fill={canvasBg === 'black' ? "#0a0a0a" : "#111827"} 
                      />
                      
                      {/* Corner numbering inside the connector */}
                      {(c === 0 || c === config.cols - 1) && (
                        <text 
                          x={c === 0 ? x - 15 : x + 15} 
                          y={y + 5} 
                          fontSize={14} 
                          fontWeight="bold" 
                          fill={canvasBg === 'black' ? "#a3a3a3" : "#374151"} 
                          textAnchor={c === 0 ? "end" : "start"}
                        >
                          {getPinNumber(r, c)}
                        </text>
                      )}
                    </g>
                  );
                })
              ))}
            </g>

            {/* Signal Labels and Lines */}
            {labels.map(label => {
              let foundR = -1;
              let foundC = -1;
              for (let r = 0; r < config.rows; r++) {
                for (let c = 0; c < config.cols; c++) {
                  if (getPinNumber(r, c) === label.pinNumber) {
                    foundR = r;
                    foundC = c;
                    break;
                  }
                }
                if (foundR !== -1) break;
              }

              if (foundR === -1) return null; 

              const { x, y } = getPinPosition(foundR, foundC);
              const angleRad = label.lineAngle * Math.PI / 180;
              const endX = x + label.lineLength * Math.cos(angleRad);
              const endY = y + label.lineLength * Math.sin(angleRad);
              
              const isRightSide = Math.cos(angleRad) >= -0.01;
              const textAnchor = isRightSide ? "start" : "end";
              const textPadding = isRightSide ? 8 : -8;

              return (
                <g key={label.id}>
                  {/* Origin dot on the pin */}
                  <circle cx={x} cy={y} r={4} fill={label.color} />
                  
                  {/* Pointer line */}
                  <line 
                    x1={x} y1={y} 
                    x2={endX} y2={endY} 
                    stroke={label.color} 
                    strokeWidth={3} 
                  />
                  
                  {/* Text label with outline for readability */}
                  <text 
                    x={endX + textPadding} 
                    y={endY + 7} 
                    fontSize={22} 
                    fontWeight="bold" 
                    fill={label.color} 
                    textAnchor={textAnchor}
                    stroke={canvasBg === 'black' ? '#0f0f0f' : '#ffffff'}
                    strokeWidth={5}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    {label.text}
                  </text>
                </g>
              );
            })}

            {/* Title Block */}
            {(() => {
              const lines = config.title.split('\n');
              let baseX = 0;
              let baseY = 0;
              let textAnchor = "start";
              
              switch (config.titlePosition) {
                case 'top-left':
                  baseX = -360; baseY = -250; textAnchor = 'start'; break;
                case 'bottom-left':
                  baseX = -360; baseY = 210; textAnchor = 'start'; break;
                case 'top-right':
                  baseX = 360; baseY = -250; textAnchor = 'end'; break;
                case 'bottom-right':
                  baseX = 360; baseY = 210; textAnchor = 'end'; break;
              }

              return lines.map((line, i) => (
                <text 
                  key={`title-${i}`} 
                  x={baseX} 
                  y={baseY + i * 32} 
                  fontSize={26} 
                  fontWeight="900" 
                  fill={canvasBg === 'black' ? '#e5e5e5' : '#171717'} 
                  textAnchor={textAnchor}
                  fontFamily="sans-serif"
                >
                  {line}
                </text>
              ));
            })()}
          </svg>

        </div>
      </div>
    </div>
  );
}
