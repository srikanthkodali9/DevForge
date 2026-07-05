import { useState, useEffect } from 'react';
import { Copy, Share2, Lock, Unlock, ArrowLeft, ArrowRight, RefreshCw, History, Settings } from 'lucide-react';

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

// Color Utility Functions
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

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq >= 128 ? '#1e293b' : '#ffffff';
}

function generateRandomColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 40) + 50; // 50% - 90%
  const l = Math.floor(Math.random() * 30) + 40; // 40% - 70%
  return hslToHex(h, s, l);
}

function generateHarmoniousColors(existingColors: string[], lockedList: boolean[]): string[] {
  const schemeType = Math.floor(Math.random() * 5);
  const baseH = Math.floor(Math.random() * 360);
  const baseS = Math.floor(Math.random() * 30) + 55; // 55% - 85%
  const baseL = Math.floor(Math.random() * 20) + 45; // 45% - 65%

  return existingColors.map((c, idx) => {
    if (lockedList[idx]) return c;

    switch (schemeType) {
      case 0: // Monochromatic
        const lStep = 20 + idx * 15;
        return hslToHex(baseH, baseS, lStep);
      case 1: // Analogous
        const hStep = (baseH - 40 + idx * 20 + 360) % 360;
        return hslToHex(hStep, baseS, baseL);
      case 2: // Complementary / Triadic
        if (idx === 0) return hslToHex(baseH, baseS, baseL);
        if (idx === 1) return hslToHex(baseH, baseS, Math.max(15, baseL - 25));
        if (idx === 2) return hslToHex((baseH + 180) % 360, baseS, baseL);
        if (idx === 3) return hslToHex((baseH + 180) % 360, baseS, Math.min(95, baseL + 25));
        return hslToHex((baseH + 30) % 360, baseS, baseL);
      case 3: // Pastel
        return hslToHex((baseH + idx * 72) % 360, 65, 80);
      default: // Mixed random
        return generateRandomColor();
    }
  });
}

export function PaletteGenerator() {
  const [colors, setColors] = useState<string[]>(['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']);
  const [locked, setLocked] = useState<boolean[]>([false, false, false, false, false]);
  const [history, setHistory] = useState<string[][]>([]);
  const { copy } = useCopy();

  // Load History & Query Params on Mount
  useEffect(() => {
    const saved = localStorage.getItem('df-palette-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const paletteParam = params.get('palette');
    if (paletteParam) {
      const parsedColors = paletteParam.split('-').map(c => `#${c}`);
      if (parsedColors.length === 5) {
        setColors(parsedColors);
      }
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        generatePalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [colors, locked, history]);

  const saveToHistory = (palette: string[]) => {
    // Filter duplicates
    const filtered = history.filter(h => h.join(',') !== palette.join(','));
    const updated = [palette, ...filtered].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('df-palette-history', JSON.stringify(updated));
  };

  const generatePalette = () => {
    saveToHistory(colors);
    setColors(generateHarmoniousColors(colors, locked));
  };

  const toggleLock = (index: number) => {
    const updated = [...locked];
    updated[index] = !updated[index];
    setLocked(updated);
  };

  const handleColorChange = (index: number, val: string) => {
    const updated = [...colors];
    updated[index] = val;
    setColors(updated);
  };

  const shiftColor = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= 5) return;

    const newColors = [...colors];
    const tempC = newColors[index];
    newColors[index] = newColors[targetIndex];
    newColors[targetIndex] = tempC;

    const newLocked = [...locked];
    const tempL = newLocked[index];
    newLocked[index] = newLocked[targetIndex];
    newLocked[targetIndex] = tempL;

    setColors(newColors);
    setLocked(newLocked);
  };

  const restorePalette = (historical: string[]) => {
    saveToHistory(colors);
    setColors(historical);
  };

  const getShareLink = () => {
    const params = new URLSearchParams(window.location.search);
    const cleanColors = colors.map(c => c.replace('#', '')).join('-');
    params.set('palette', cleanColors);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    copy(url);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('df-palette-history');
  };

  return (
    <div className="tool-workspace-layout" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top action bar */}
      <div className="glass-panel tool-controls-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-icon-label" onClick={generatePalette}>
            <RefreshCw size={16} /> Generate Palette
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Tip: Press Spacebar to randomize
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-icon-label" onClick={getShareLink}>
            <Share2 size={16} /> Share Link
          </button>
          <button
            className="btn btn-secondary btn-icon-label"
            onClick={() => copy(colors.join(', ').toUpperCase())}
          >
            <Copy size={16} /> Copy HEX List
          </button>
          <button
            className="btn btn-secondary btn-icon-label"
            onClick={() => {
              const variables = colors.map((c, i) => `--color-${i + 1}: ${c.toUpperCase()};`).join('\n');
              copy(variables);
            }}
          >
            <Settings size={16} /> Copy CSS Variables
          </button>
        </div>
      </div>

      {/* Main 5 Columns Display */}
      <div
        style={{
          display: 'flex',
          height: '420px',
          width: '100%',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)'
        }}
      >
        {colors.map((c, idx) => {
          const contrast = getContrastColor(c);
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                backgroundColor: c,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '2rem 1rem',
                transition: 'flex 0.2s ease, background-color 0.15s ease',
              }}
            >
              {/* Color Controls (Overlay at top) */}
              <div
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  alignItems: 'center',
                  color: contrast,
                }}
              >
                {/* Lock button */}
                <button
                  style={{
                    background: 'rgba(0,0,0,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: contrast,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => toggleLock(idx)}
                  title={locked[idx] ? 'Unlock Color' : 'Lock Color'}
                >
                  {locked[idx] ? <Lock size={18} /> : <Unlock size={18} />}
                </button>

                {/* Move helpers */}
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {idx > 0 && (
                    <button
                      style={{ background: 'none', border: 'none', color: contrast, cursor: 'pointer', opacity: 0.8 }}
                      onClick={() => shiftColor(idx, 'left')}
                      title="Move Left"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  {idx < 4 && (
                    <button
                      style={{ background: 'none', border: 'none', color: contrast, cursor: 'pointer', opacity: 0.8 }}
                      onClick={() => shiftColor(idx, 'right')}
                      title="Move Right"
                    >
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Info & Hex Edit */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%'
                }}
              >
                {/* Hidden native color picker input */}
                <input
                  type="color"
                  id={`color-picker-input-${idx}`}
                  value={c}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                  style={{ opacity: 0, position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
                />
                
                {/* Visual picker trigger */}
                <button
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: `2px solid ${contrast}`,
                    backgroundColor: c,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onClick={() => document.getElementById(`color-picker-input-${idx}`)?.click()}
                  title="Open Color Picker"
                />

                {/* Hex Text Box */}
                <input
                  type="text"
                  value={c.toUpperCase()}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'center',
                    color: contrast,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    width: '90px',
                    outline: 'none',
                    letterSpacing: '0.5px'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* History Panel */}
      {history.length > 0 && (
        <div className="glass-panel output-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="output-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} /> Last 10 Generated Palettes
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
              onClick={handleClearHistory}
            >
              Clear History
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((hColors, hIdx) => (
              <div
                key={hIdx}
                onClick={() => restorePalette(hColors)}
                style={{
                  display: 'flex',
                  height: '24px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  transition: 'transform 0.15s ease',
                }}
                className="palette-swatch-segment"
                title="Click to restore this palette"
              >
                {hColors.map((hc, hcIdx) => (
                  <div key={hcIdx} style={{ flex: 1, backgroundColor: hc }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
