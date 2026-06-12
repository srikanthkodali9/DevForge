import { useState, useEffect } from 'react';
import { Copy, Check, Info, AlertCircle } from 'lucide-react';

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

// Helper for Base64URL decoding (Unicode-safe)
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = window.atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// ----------------------------------------------------
// 1. JWT DECODER
// ----------------------------------------------------
export function JwtDecoder() {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [expInfo, setExpInfo] = useState<{ date: string; expired: boolean } | null>(null);
  const [error, setError] = useState('');
  const { copied: copiedHeader, copy: copyHeader } = useCopy();
  const { copied: copiedPayload, copy: copyPayload } = useCopy();

  useEffect(() => {
    if (!token.trim()) {
      setHeader('');
      setPayload('');
      setExpInfo(null);
      setError('');
      return;
    }

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      setError('A JWT must contain 3 parts separated by dots (.)');
      setHeader('');
      setPayload('');
      setExpInfo(null);
      return;
    }

    try {
      const decodedHeader = base64UrlDecode(parts[0]);
      const decodedPayload = base64UrlDecode(parts[1]);

      setHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));
      const parsedPayload = JSON.parse(decodedPayload);
      setPayload(JSON.stringify(parsedPayload, null, 2));
      setError('');

      if (parsedPayload.exp) {
        const expMs = parsedPayload.exp * 1000;
        const expDate = new Date(expMs);
        setExpInfo({
          date: expDate.toLocaleString(),
          expired: expMs < Date.now(),
        });
      } else {
        setExpInfo(null);
      }
    } catch (e) {
      setError('Failed to decode JWT token. Ensure it is a valid base64url encoded token.');
      setHeader('');
      setPayload('');
      setExpInfo(null);
    }
  }, [token]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="form-group">
          <label className="form-label">Paste JWT Token</label>
          <textarea
            className="form-input-textarea"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4NTAwMDAwMDB9.signature"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ minHeight: '100px' }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {expInfo && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: expInfo.expired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${expInfo.expired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Info size={16} color={expInfo.expired ? 'var(--accent-danger)' : 'var(--accent-success)'} />
            <span>
              Token Expiration: <strong>{expInfo.date}</strong>{' '}
              {expInfo.expired ? (
                <span style={{ color: 'var(--accent-danger)', fontWeight: 'bold' }}>(Expired)</span>
              ) : (
                <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>(Active)</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="glass-panel output-panel">
          <div className="output-header">
            <span className="output-title" style={{ color: 'var(--accent-danger)' }}>Header (Algorithm & Type)</span>
            {header && (
              <button className="btn btn-secondary btn-icon-label" onClick={() => copyHeader(header)}>
                {copiedHeader ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
          </div>
          <div className="output-display jwt-header" style={{ minHeight: '100px' }}>
            {header || 'Paste a token to inspect header...'}
          </div>
        </div>

        <div className="glass-panel output-panel">
          <div className="output-header">
            <span className="output-title" style={{ color: 'var(--accent-primary)' }}>Payload (Claims / Data)</span>
            {payload && (
              <button className="btn btn-secondary btn-icon-label" onClick={() => copyPayload(payload)}>
                {copiedPayload ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
          </div>
          <div className="output-display jwt-payload" style={{ minHeight: '150px' }}>
            {payload || 'Paste a token to inspect payload...'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. JSON FORMATTER & VALIDATOR
// ----------------------------------------------------
export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indentSize, setIndentSize] = useState<2 | 4 | 'tab'>(2);
  const [error, setError] = useState('');
  const { copied, copy } = useCopy();

  const handleFormat = (minify = false) => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      if (minify) {
        setOutput(JSON.stringify(parsed));
      } else {
        const indent = indentSize === 'tab' ? '\t' : indentSize;
        setOutput(JSON.stringify(parsed, null, indent));
      }
      setError('');
    } catch (e: any) {
      setError(e.message || 'Invalid JSON format');
      setOutput('');
    }
  };

  useEffect(() => {
    handleFormat(false);
  }, [input, indentSize]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Tab Size</label>
            <select
              className="form-input-select"
              value={indentSize}
              onChange={(e) => {
                const val = e.target.value;
                setIndentSize(val === 'tab' ? 'tab' : Number(val) as 2 | 4);
              }}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>

          <div className="form-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => handleFormat(true)}>
              Minify JSON
            </button>
            <button className="btn btn-primary" onClick={() => handleFormat(false)}>
              Prettify JSON
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Input JSON</label>
          <textarea
            className="form-input-textarea"
            placeholder='{\n  "name": "DevForge",\n  "version": 1,\n  "features": ["k8s", "AI"]\n}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Formatted Output</span>
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
// 3. REGEX TESTER
// ----------------------------------------------------
export function RegexTester() {
  const [pattern, setPattern] = useState('[a-zA-Z]+');
  const [flags, setFlags] = useState({
    g: true,
    i: false,
    m: false,
    s: false,
    u: false,
    y: false,
  });
  const [testText, setTestText] = useState('Example text to test regular expressions. 123 matches.');
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState('');

  const toggleFlag = (flagName: 'g' | 'i' | 'm' | 's' | 'u' | 'y') => {
    setFlags((prev) => ({ ...prev, [flagName]: !prev[flagName] }));
  };

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setError('');
      return;
    }

    try {
      const activeFlags = Object.entries(flags)
        .filter(([_, active]) => active)
        .map(([flag]) => flag)
        .join('');

      const regex = new RegExp(pattern, activeFlags);
      const results = [];

      if (activeFlags.includes('g')) {
        let match;
        // Avoid infinite loop if regex matches empty string
        const lastIndices = new Set();
        while ((match = regex.exec(testText)) !== null) {
          if (lastIndices.has(regex.lastIndex)) {
            regex.lastIndex++; // Advance manually
          }
          lastIndices.add(regex.lastIndex);
          results.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (!regex.global) break;
        }
      } else {
        const match = testText.match(regex);
        if (match) {
          results.push({
            value: match[0],
            index: match.index ?? 0,
            groups: match.slice(1),
          });
        }
      }

      setMatches(results);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Invalid regular expression');
      setMatches([]);
    }
  }, [pattern, flags, testText]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Regex Pattern</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                }}
              >
                /
              </span>
              <input
                type="text"
                className="form-input-text"
                style={{ paddingLeft: '1.5rem', paddingRight: '4.5rem', fontFamily: 'var(--font-mono)' }}
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="([a-z]+)"
              />
              <span
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                }}
              >
                /{Object.entries(flags).filter(([_, v]) => v).map(([f]) => f).join('')}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Flags</label>
            <div className="form-row" style={{ marginTop: '0.25rem' }}>
              {(['g', 'i', 'm', 's', 'u', 'y'] as const).map((flag) => (
                <label key={flag} className="form-checkbox-label" style={{ fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    style={{ width: '16px', height: '16px' }}
                    checked={flags[flag]}
                    onChange={() => toggleFlag(flag)}
                  />
                  <strong>{flag}</strong> (
                  {flag === 'g'
                    ? 'global'
                    : flag === 'i'
                    ? 'ignoreCase'
                    : flag === 'm'
                    ? 'multiline'
                    : flag === 's'
                    ? 'dotAll'
                    : flag === 'u'
                    ? 'unicode'
                    : 'sticky'}
                  )
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Test Text</label>
          <textarea
            className="form-input-textarea"
            placeholder="Type text to search with regex..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            style={{ minHeight: '100px', fontFamily: 'var(--font-sans)' }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Matches ({matches.length})</span>
        </div>
        <div className="output-display" style={{ minHeight: '150px' }}>
          {matches.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>No matches found</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '1rem',
                    padding: '0.35rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{idx + 1}</span>
                  <span style={{ color: 'var(--accent-success)', fontWeight: 'bold' }}>"{m.value}"</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Index: {m.index}</span>
                  {m.groups.length > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                      Groups: {m.groups.map((g: any, gidx: any) => `(${gidx + 1}: "${g}")`).join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. CRONTAB GENERATOR
// ----------------------------------------------------
export function CronGenerator() {
  const [min, setMin] = useState('*');
  const [hour, setHour] = useState('*');
  const [dom, setDom] = useState('*');
  const [month, setMonth] = useState('*');
  const [dow, setDow] = useState('*');
  const [cronExpression, setCronExpression] = useState('* * * * *');
  const [translation, setTranslation] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    const expr = `${min} ${hour} ${dom} ${month} ${dow}`;
    setCronExpression(expr);

    // Simple parser translation for UI help
    let expText = 'Runs ';
    if (min === '*' && hour === '*' && dom === '*' && month === '*' && dow === '*') {
      expText += 'every minute.';
    } else {
      const parts = [];
      if (min === '*') parts.push('every minute');
      else parts.push(`at minute ${min}`);

      if (hour === '*') parts.push('of every hour');
      else parts.push(`at hour ${hour.padStart(2, '0')}:00`);

      if (dom === '*') {
        if (dow === '*') {
          parts.push('every day');
        } else {
          const daysMap: any = {
            '0': 'Sunday', '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
            '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '*': 'any day'
          };
          parts.push(`on ${dow.split(',').map(d => daysMap[d] || d).join(', ')}`);
        }
      } else {
        parts.push(`on day of month ${dom}`);
      }

      if (month !== '*') {
        const monthMap: any = {
          '1': 'January', '2': 'February', '3': 'March', '4': 'April',
          '5': 'May', '6': 'June', '7': 'July', '8': 'August',
          '9': 'September', '10': 'October', '11': 'November', '12': 'December'
        };
        parts.push(`in ${month.split(',').map(m => monthMap[m] || m).join(', ')}`);
      }

      expText += parts.join(' ') + '.';
    }
    setTranslation(expText);
  }, [min, hour, dom, month, dow]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div className="form-group">
            <label className="form-label">Minute</label>
            <select className="form-input-select" value={min} onChange={(e) => setMin(e.target.value)}>
              <option value="*">Every minute (*)</option>
              <option value="*/5">Every 5 minutes (*/5)</option>
              <option value="*/15">Every 15 minutes (*/15)</option>
              <option value="0">At start of hour (0)</option>
              <option value="30">At 30 mins past (30)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Hour</label>
            <select className="form-input-select" value={hour} onChange={(e) => setHour(e.target.value)}>
              <option value="*">Every hour (*)</option>
              <option value="*/2">Every 2 hours (*/2)</option>
              <option value="0">Midnight (0)</option>
              <option value="12">Noon (12)</option>
              <option value="8,9,10,11,12,13,14,15,16,17">Work hours (9-5)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Day of Month</label>
            <select className="form-input-select" value={dom} onChange={(e) => setDom(e.target.value)}>
              <option value="*">Every day (*)</option>
              <option value="1">1st of month (1)</option>
              <option value="15">15th of month (15)</option>
              <option value="1,15">1st & 15th of month</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Month</label>
            <select className="form-input-select" value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="*">Every month (*)</option>
              <option value="1">January (1)</option>
              <option value="6">June (6)</option>
              <option value="12">December (12)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Day of Week</label>
            <select className="form-input-select" value={dow} onChange={(e) => setDow(e.target.value)}>
              <option value="*">Any day (*)</option>
              <option value="1,2,3,4,5">Weekdays (1-5)</option>
              <option value="0,6">Weekends (0,6)</option>
              <option value="1">Monday (1)</option>
              <option value="5">Friday (5)</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.925rem' }}>
          <Info size={16} color="var(--accent-primary)" />
          <span>{translation}</span>
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Cron Expression</span>
          <button className="btn btn-secondary btn-icon-label" onClick={() => copy(cronExpression)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div
          className="output-display"
          style={{
            minHeight: '60px',
            fontSize: '1.5rem',
            textAlign: 'center',
            letterSpacing: '2px',
            color: 'var(--accent-primary)',
          }}
        >
          {cronExpression}
        </div>
      </div>
    </div>
  );
}
