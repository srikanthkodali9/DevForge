import { useState, useEffect } from 'react';
import { Copy, Check, Download, Palette, QrCode, Plus, Trash } from 'lucide-react';

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

// Helper color utilities
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ----------------------------------------------------
// 1. QR CODE GENERATOR
// ----------------------------------------------------
export function QrGenerator() {
  const [data, setData] = useState('https://google.com');
  const [size, setSize] = useState(250);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data.trim()) {
      setQrUrl('');
      return;
    }
    setLoading(true);
    // Escape colors
    const fg = fgColor.replace('#', '');
    const bg = bgColor.replace('#', '');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      data
    )}&color=${fg}&bgcolor=${bg}`;
    setQrUrl(url);
  }, [data, size, fgColor, bgColor]);

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">
              <QrCode size={16} /> QR Data (URL or Text)
            </label>
            <input
              type="text"
              className="form-input-text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">QR Size ({size}px)</label>
            <input
              type="range"
              min="100"
              max="500"
              step="50"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', marginTop: '0.5rem' }}
            />
          </div>
        </div>

        <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginTop: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label">Foreground Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              />
              <input
                type="text"
                className="form-input-text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Background Color</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              />
              <input
                type="text"
                className="form-input-text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel output-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <span className="output-title" style={{ alignSelf: 'flex-start' }}>Preview</span>
        
        {qrUrl ? (
          <div
            style={{
              padding: '1rem',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <img
              src={qrUrl}
              alt="QR Code"
              onLoad={() => setLoading(false)}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'black',
                  fontWeight: 'bold',
                }}
              >
                Generating...
              </div>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Enter data to generate QR code</span>
        )}

        {qrUrl && (
          <button className="btn btn-primary" onClick={handleDownload} style={{ width: '100%' }}>
            <Download size={16} /> Download PNG Image
          </button>
        )}
      </div>
    </div>
  );
}

interface PaletteSpace {
  name: string;
  colors: string[];
}

function generateSpacePalettes(h: number, s: number, l: number): PaletteSpace[] {
  return [
    {
      name: 'Never-Ending Gradient',
      colors: [
        hslToHex(h, s, Math.max(15, l - 30)),
        hslToHex((h + 10) % 360, s, Math.max(25, l - 18)),
        hslToHex((h + 20) % 360, s, Math.max(35, l - 6)),
        hslToHex((h + 30) % 360, s, Math.min(95, l + 6)),
        hslToHex((h + 40) % 360, s, Math.min(95, l + 18)),
        hslToHex((h + 50) % 360, s, Math.min(95, l + 30)),
      ],
    },
    {
      name: 'Matching Gradient',
      colors: [
        hslToHex((h + 180) % 360, Math.max(30, s - 20), Math.max(20, l - 15)),
        hslToHex((h + 150) % 360, Math.max(30, s - 10), Math.max(30, l - 8)),
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 80) % 360, s, Math.min(95, l + 8)),
        hslToHex((h + 40) % 360, s, Math.min(95, l + 15)),
        hslToHex(h, s, l),
      ],
    },
    {
      name: 'Triadic Space',
      colors: [
        hslToHex(h, s, Math.max(20, l - 15)),
        hslToHex(h, s, l),
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 120) % 360, s, Math.min(95, l + 20)),
        hslToHex((h + 240) % 360, s, l),
        hslToHex((h + 240) % 360, s, Math.max(20, l - 15)),
      ],
    },
    {
      name: 'Analogous Space',
      colors: [
        hslToHex((h - 40 + 360) % 360, Math.max(20, s - 10), Math.max(20, l - 5)),
        hslToHex((h - 20 + 360) % 360, s, l),
        hslToHex(h, s, l),
        hslToHex((h + 20) % 360, s, l),
        hslToHex((h + 40) % 360, Math.max(20, s - 10), Math.min(95, l + 5)),
      ],
    },
    {
      name: 'Dusty Pastel Space',
      colors: [
        hslToHex((h - 60 + 360) % 360, 25, 75),
        hslToHex((h - 30 + 360) % 360, 25, 75),
        hslToHex(h, 25, 75),
        hslToHex((h + 30) % 360, 25, 75),
        hslToHex((h + 60) % 360, 25, 75),
        hslToHex((h + 90) % 360, 25, 75),
      ],
    },
    {
      name: 'Elegant Theme Space',
      colors: [
        hslToHex(h, 35, 30),
        hslToHex((h + 30) % 360, 35, 35),
        hslToHex((h + 60) % 360, 35, 40),
        hslToHex((h + 150) % 360, 30, 35),
        hslToHex((h + 210) % 360, 30, 30),
        hslToHex((h + 240) % 360, 25, 25),
      ],
    },
    {
      name: 'Monochromatic Space',
      colors: [
        hslToHex(h, s, 90),
        hslToHex(h, s, 75),
        hslToHex(h, s, 60),
        hslToHex(h, s, 45),
        hslToHex(h, s, 30),
        hslToHex(h, s, 15),
      ],
    },
    {
      name: 'Highlight & Accent Space',
      colors: [
        hslToHex(h, s, l),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 90) % 360, Math.min(100, s + 20), Math.min(90, l + 10)),
        hslToHex((h - 90 + 360) % 360, Math.min(100, s + 20), Math.min(90, l + 10)),
        hslToHex((h + 150) % 360, s, Math.max(15, l - 20)),
        hslToHex((h + 210) % 360, s, Math.max(15, l - 20)),
      ],
    },
  ];
}

// ----------------------------------------------------
// 2. COLOR PALETTE GENERATOR & CONVERTER
// ----------------------------------------------------
export function ColorConverter() {
  const [color, setColor] = useState('#8b5cf6'); // Default violet
  const [rgb, setRgb] = useState({ r: 139, g: 92, b: 246 });
  const [hsl, setHsl] = useState({ h: 258, s: 90, l: 66 });
  const { copied, copy } = useCopy();

  // Color Dock States
  const [dockedColors, setDockedColors] = useState<string[]>(['#8b5cf6', '#3b82f6', '#10b981']); // Starts with 3 defaults
  const [gradientAngle, setGradientAngle] = useState<number>(135);

  const addCurrentColorToDock = () => {
    if (dockedColors.length >= 6) return;
    if (dockedColors.map(c => c.toLowerCase()).includes(color.toLowerCase())) return;
    setDockedColors([...dockedColors, color.toLowerCase()]);
  };

  const removeColorFromDock = (index: number) => {
    setDockedColors(dockedColors.filter((_, i) => i !== index));
  };

  const moveColorInDock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= dockedColors.length) return;
    const updated = [...dockedColors];
    const temp = updated[fromIndex];
    updated[fromIndex] = updated[toIndex];
    updated[toIndex] = temp;
    setDockedColors(updated);
  };

  useEffect(() => {
    // Sync conversions
    const rgbVal = hexToRgb(color);
    const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
    setRgb(rgbVal);
    setHsl(hslVal);
  }, [color]);

  const handleRgbChange = (key: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [key]: Math.min(255, Math.max(0, val)) };
    setRgb(newRgb);
    const newHex = hslToHex(
      rgbToHsl(newRgb.r, newRgb.g, newRgb.b).h,
      rgbToHsl(newRgb.r, newRgb.g, newRgb.b).s,
      rgbToHsl(newRgb.r, newRgb.g, newRgb.b).l
    );
    setColor(newHex);
  };

  const handleHslChange = (key: 'h' | 's' | 'l', val: number) => {
    const maxVal = key === 'h' ? 360 : 100;
    const newHsl = { ...hsl, [key]: Math.min(maxVal, Math.max(0, val)) };
    setHsl(newHsl);
    const newHex = hslToHex(newHsl.h, newHsl.s, newHsl.l);
    setColor(newHex);
  };

  // Generate Shades & Tints
  const shades = Array.from({ length: 9 }, (_, idx) => {
    const multiplier = (idx + 1) * 10;
    return hslToHex(hsl.h, hsl.s, multiplier);
  });

  const palettes = generateSpacePalettes(hsl.h, hsl.s, hsl.l);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <label className="form-label" style={{ alignSelf: 'flex-start' }}>Color Picker</label>
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '80px', height: '80px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', justifySelf: 'center', gap: '0.5rem', flex: 1 }}>
                <div className="color-swatch" style={{ backgroundColor: color, height: '40px', borderRadius: '4px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{color.toUpperCase()}</code>
                  <button className="btn btn-secondary" onClick={() => copy(color)} style={{ padding: '4px 8px' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ gap: '0.85rem' }}>
            <label className="form-label">
              <Palette size={16} /> Color Codes
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', width: '40px', color: 'var(--text-muted)' }}>RGB:</span>
                <input
                  type="number"
                  className="form-input-text"
                  style={{ padding: '0.4rem 0.6rem' }}
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', Number(e.target.value))}
                />
                <input
                  type="number"
                  className="form-input-text"
                  style={{ padding: '0.4rem 0.6rem' }}
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', Number(e.target.value))}
                />
                <input
                  type="number"
                  className="form-input-text"
                  style={{ padding: '0.4rem 0.6rem' }}
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', width: '40px', color: 'var(--text-muted)' }}>HSL:</span>
                <input
                  type="number"
                  className="form-input-text"
                  style={{ padding: '0.4rem 0.6rem' }}
                  min="0"
                  max="360"
                  value={hsl.h}
                  onChange={(e) => handleHslChange('h', Number(e.target.value))}
                />
                <input
                  type="number"
                  className="form-input-text"
                  style={{ padding: '0.4rem 0.6rem' }}
                  min="0"
                  max="100"
                  value={hsl.s}
                  onChange={(e) => handleHslChange('s', Number(e.target.value))}
                />
                <input
                  type="number"
                  className="form-input-text"
                  style={{ padding: '0.4rem 0.6rem' }}
                  min="0"
                  max="100"
                  value={hsl.l}
                  onChange={(e) => handleHslChange('l', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLOR DOCK & GRADIENT BUILDER */}
      <div className="glass-panel output-panel" style={{ gridColumn: 'span 2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 className="k8s-form-section-title" style={{ margin: 0 }}>Color Dock & Custom Gradient Builder</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-icon-label"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', height: '32px' }}
              onClick={addCurrentColorToDock}
              disabled={dockedColors.length >= 6}
            >
              <Plus size={14} /> Add Active Color ({dockedColors.length}/6)
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)', height: '32px' }}
              onClick={() => setDockedColors([])}
            >
              Clear Dock
            </button>
          </div>
        </div>

        {/* 6 Colors Slots */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: 6 }).map((_, idx) => {
            const c = dockedColors[idx];
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-secondary)',
                  border: c ? `1px solid var(--border-color)` : `1px dashed var(--border-color)`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  position: 'relative',
                  minHeight: '115px',
                  justifyContent: 'center',
                }}
              >
                {c ? (
                  <>
                    <div style={{ width: '100%', height: '32px', borderRadius: '4px', backgroundColor: c }} />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.toUpperCase()}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 4px', fontSize: '0.7rem', height: '20px' }}
                        onClick={() => copy(c)}
                        title="Copy Hex"
                      >
                        <Copy size={10} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 4px', fontSize: '0.7rem', height: '20px', color: 'var(--text-muted)' }}
                        onClick={() => removeColorFromDock(idx)}
                        title="Remove"
                      >
                        <Trash size={10} />
                      </button>
                    </div>
                    {/* Reordering indicators */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '0.1rem' }}>
                      {idx > 0 && (
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
                          onClick={() => moveColorInDock(idx, idx - 1)}
                          title="Move Left"
                        >
                          ◀
                        </button>
                      )}
                      {idx < dockedColors.length - 1 && (
                        <button
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
                          onClick={() => moveColorInDock(idx, idx + 1)}
                          title="Move Right"
                        >
                          ▶
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Empty</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Gradient Generator View */}
        {dockedColors.length >= 2 ? (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Generated Gradient CSS</span>
                <select
                  className="form-input-text"
                  style={{ width: '100px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', height: '28px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  value={gradientAngle}
                  onChange={(e) => setGradientAngle(Number(e.target.value))}
                >
                  <option value="0">0° (Up)</option>
                  <option value="45">45° (Diag)</option>
                  <option value="90">90° (Right)</option>
                  <option value="135">135° (Default)</option>
                  <option value="180">180° (Down)</option>
                  <option value="270">270° (Left)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-icon-label"
                  style={{ height: '28px', fontSize: '0.75rem' }}
                  onClick={() => copy(`background: linear-gradient(${gradientAngle}deg, ${dockedColors.join(', ')});`)}
                >
                  <Copy size={12} /> Copy CSS
                </button>
              </div>
            </div>

            {/* Gradient Visual Preview */}
            <div
              style={{
                width: '100%',
                height: '80px',
                borderRadius: 'var(--radius-sm)',
                background: `linear-gradient(${gradientAngle}deg, ${dockedColors.join(', ')})`,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              }}
            />

            <code style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'block', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
              {`background: linear-gradient(${gradientAngle}deg, ${dockedColors.join(', ')});`}
            </code>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Add at least 2 colors to the dock to build and preview a custom CSS gradient.
          </div>
        )}
      </div>

      <div className="glass-panel output-panel" style={{ gridColumn: 'span 2' }}>
        <h3 className="k8s-form-section-title" style={{ marginTop: 0, marginBottom: '1.25rem' }}>Color Space Palettes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {palettes.map((p, pIdx) => (
            <div
              key={pIdx}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{p.name}</span>
                <button
                  className="btn btn-secondary btn-icon-label"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: '28px' }}
                  onClick={() => {
                    copy(p.colors.map(c => c.toUpperCase()).join(', '));
                  }}
                >
                  <Copy size={12} /> Copy Palette
                </button>
              </div>

              <div style={{ display: 'flex', width: '100%', height: '50px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                {p.colors.map((c, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      flex: 1,
                      backgroundColor: c,
                      cursor: 'pointer',
                    }}
                    title={`Click to copy: ${c.toUpperCase()}`}
                    onClick={() => copy(c)}
                    className="palette-swatch-segment"
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.25rem' }}>
                {p.colors.map((c, cIdx) => (
                  <div
                    key={cIdx}
                    onClick={() => copy(c)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    title="Click to copy"
                  >
                    {c.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel output-panel" style={{ gridColumn: 'span 2' }}>
        <span className="output-title">Monochromatic Shades & Tints (Click to Copy)</span>
        <div className="color-shades-grid">
          {shades.map((s, idx) => (
            <div key={idx} className="shade-item" onClick={() => copy(s)}>
              <div className="shade-box" style={{ backgroundColor: s }} />
              <span className="shade-label">{s.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
