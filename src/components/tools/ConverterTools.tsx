import { useState, useEffect } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';
import yaml from 'js-yaml';

// Copy hook
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

// ----------------------------------------------------
// 1. BASE64 ENCODER / DECODER
// ----------------------------------------------------
export function Base64Codec() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (!input) {
      setOutput('');
      setError('');
      return;
    }

    try {
      if (mode === 'encode') {
        // Handle Unicode characters correctly during Base64 encoding
        const bytes = new TextEncoder().encode(input);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
        setOutput(window.btoa(binString));
        setError('');
      } else {
        try {
          const binString = window.atob(input.trim());
          const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
          setOutput(new TextDecoder().decode(bytes));
          setError('');
        } catch (e) {
          setError('Invalid Base64 string for decoding');
          setOutput('');
        }
      }
    } catch (e) {
      setError('An error occurred during conversion');
      setOutput('');
    }
  }, [input, mode]);

  const handleSwap = () => {
    setInput(output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          <button className={`tab-btn ${mode === 'encode' ? 'active' : ''}`} onClick={() => setMode('encode')}>
            Encode Text
          </button>
          <button className={`tab-btn ${mode === 'decode' ? 'active' : ''}`} onClick={() => setMode('decode')}>
            Decode Base64
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Input ({mode === 'encode' ? 'Plain Text' : 'Base64'})</label>
          <textarea
            className="form-input-textarea"
            placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Paste Base64 string to decode...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {output && (
          <button className="btn btn-secondary" onClick={handleSwap} style={{ width: 'fit-content', gap: '8px' }}>
            <ArrowRightLeft size={16} /> Swap Input & Output
          </button>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Output ({mode === 'encode' ? 'Base64' : 'Plain Text'})</span>
          {output && (
            <button className="btn btn-secondary btn-icon-label" onClick={() => copy(output)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        {error ? (
          <div
            className="output-display"
            style={{ color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', minHeight: '150px' }}
          >
            {error}
          </div>
        ) : (
          <div className="output-display" style={{ minHeight: '150px' }}>
            {output || 'Output will appear here...'}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. URL ENCODER / DECODER
// ----------------------------------------------------
export function UrlCodec() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (!input) {
      setOutput('');
      setError('');
      return;
    }

    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
        setError('');
      } else {
        try {
          setOutput(decodeURIComponent(input));
          setError('');
        } catch (e) {
          setError('Malformed URL component - failed to decode');
          setOutput('');
        }
      }
    } catch (e) {
      setError('An error occurred');
      setOutput('');
    }
  }, [input, mode]);

  const handleSwap = () => {
    setInput(output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          <button className={`tab-btn ${mode === 'encode' ? 'active' : ''}`} onClick={() => setMode('encode')}>
            URL Encode
          </button>
          <button className={`tab-btn ${mode === 'decode' ? 'active' : ''}`} onClick={() => setMode('decode')}>
            URL Decode
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Input</label>
          <textarea
            className="form-input-textarea"
            placeholder={mode === 'encode' ? 'Enter URL or query params to encode...' : 'Paste encoded URL string to decode...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {output && (
          <button className="btn btn-secondary" onClick={handleSwap} style={{ width: 'fit-content', gap: '8px' }}>
            <ArrowRightLeft size={16} /> Swap Input & Output
          </button>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Output</span>
          {output && (
            <button className="btn btn-secondary btn-icon-label" onClick={() => copy(output)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        {error ? (
          <div
            className="output-display"
            style={{ color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', minHeight: '150px' }}
          >
            {error}
          </div>
        ) : (
          <div className="output-display" style={{ minHeight: '150px' }}>
            {output || 'Output will appear here...'}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. JSON <-> YAML CONVERTER
// ----------------------------------------------------
export function JsonYamlConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState<'json2yaml' | 'yaml2json'>('json2yaml');
  const [error, setError] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    try {
      if (direction === 'json2yaml') {
        // JSON -> YAML
        const parsed = JSON.parse(input);
        const converted = yaml.dump(parsed, { indent: 2, skipInvalid: true });
        setOutput(converted);
        setError('');
      } else {
        // YAML -> JSON
        const parsed = yaml.load(input);
        if (typeof parsed === 'string' || typeof parsed === 'number' || parsed === undefined) {
          throw new Error('YAML document must evaluate to a structured object or list.');
        }
        const converted = JSON.stringify(parsed, null, 2);
        setOutput(converted);
        setError('');
      }
    } catch (e: any) {
      setError(e.message || 'Syntax error during conversion');
      setOutput('');
    }
  }, [input, direction]);

  const handleSwap = () => {
    setInput(output);
    setDirection(direction === 'json2yaml' ? 'yaml2json' : 'json2yaml');
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          <button
            className={`tab-btn ${direction === 'json2yaml' ? 'active' : ''}`}
            onClick={() => setDirection('json2yaml')}
          >
            JSON to YAML
          </button>
          <button
            className={`tab-btn ${direction === 'yaml2json' ? 'active' : ''}`}
            onClick={() => setDirection('yaml2json')}
          >
            YAML to JSON
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Input ({direction === 'json2yaml' ? 'JSON' : 'YAML'})</label>
          <textarea
            className="form-input-textarea"
            placeholder={
              direction === 'json2yaml'
                ? '{\n  "key": "value",\n  "array": [1, 2, 3]\n}'
                : 'key: value\narray:\n  - 1\n  - 2\n  - 3'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {output && (
          <button className="btn btn-secondary" onClick={handleSwap} style={{ width: 'fit-content', gap: '8px' }}>
            <ArrowRightLeft size={16} /> Swap Input & Output
          </button>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Output ({direction === 'json2yaml' ? 'YAML' : 'JSON'})</span>
          {output && (
            <button className="btn btn-secondary btn-icon-label" onClick={() => copy(output)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        {error ? (
          <div
            className="output-display"
            style={{ color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', minHeight: '150px' }}
          >
            {error}
          </div>
        ) : (
          <div className="output-display" style={{ minHeight: '150px' }}>
            {output || 'Output will appear here...'}
          </div>
        )}
      </div>
    </div>
  );
}
