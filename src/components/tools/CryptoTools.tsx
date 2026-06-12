import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Key, Shield, Hash, FileText } from 'lucide-react';

// Common copy helper
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
// 1. HASH GENERATOR
// ----------------------------------------------------
export function HashGenerator() {
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [hashes, setHashes] = useState({
    sha1: '',
    sha256: '',
    sha512: '',
    md5: '', // Simple placeholder/fallback
  });
  const [loading, setLoading] = useState(false);

  // MD5 JS Implementation (Standard MD5 algorithm)
  const md5 = (string: string) => {
    function md5cycle(x: any, k: any) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17,  606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12,  1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7,  1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7,  1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22,  1236535329);

      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14,  643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9,  38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5,  568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20,  1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14,  1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);

      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16,  1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11,  1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4,  681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23,  76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16,  530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);

      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10,  1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6,  1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6,  1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21,  1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15,  718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);

      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }
    function cmn(q: any, a: any, b: any, x: any, s: any, t: any) {
      return add32(rotl(add32(add32(a, q), add32(x, t)), s), b);
    }
    function ff(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
      return cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function gg(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
      return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function hh(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a: any, b: any, c: any, d: any, x: any, s: any, t: any) {
      return cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function rotl(num: any, cnt: any) {
      return (num << cnt) | (num >>> (32 - cnt));
    }
    function add32(x: any, y: any) {
      return (x + y) & 0xffffffff;
    }
    function md51(s: any) {
      var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
      for (i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i & 3) << 3);
      tail[i >> 2] |= 0x80 << ((i & 3) << 3);
      if (i > 55) {
        md5cycle(state, tail);
        for (i = 0; i < 16; i++) tail[i] = 0;
      }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }
    function md5blk(s: any) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    var hex_chr = '0123456789abcdef';
    function rhex(val: any) {
      var str = '', j;
      for (j = 0; j <= 3; j++) str += hex_chr.charAt((val >> (j * 8 + 4)) & 0x0f) + hex_chr.charAt((val >> (j * 8)) & 0x0f);
      return str;
    }
    function hex(x: any) {
      for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]);
      return x.join('');
    }
    if (!string) return '';
    return hex(md51(string));
  };

  const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const calculateHashes = async (data: ArrayBuffer | string) => {
    setLoading(true);
    try {
      let arrayBuffer: ArrayBuffer;
      let textString = '';

      if (data instanceof ArrayBuffer) {
        arrayBuffer = data;
        // Estimate string for MD5
        const dec = new TextDecoder();
        if (data.byteLength < 5000000) { // Under 5MB, convert to string for MD5
          textString = dec.decode(data);
        } else {
          textString = "[File too large for MD5 conversion]";
        }
      } else {
        textString = data;
        const enc = new TextEncoder();
        arrayBuffer = enc.encode(data).buffer;
      }

      // Standard WebCrypto Digests
      const sha1Buffer = await window.crypto.subtle.digest('SHA-1', arrayBuffer);
      const sha256Buffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      const sha512Buffer = await window.crypto.subtle.digest('SHA-512', arrayBuffer);

      setHashes({
        sha1: bufferToHex(sha1Buffer),
        sha256: bufferToHex(sha256Buffer),
        sha512: bufferToHex(sha512Buffer),
        md5: textString.startsWith('[File') ? 'N/A' : md5(textString),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'text') {
      calculateHashes(inputText);
    }
  }, [inputText, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          calculateHashes(event.target.result);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const { copied: copiedMD5, copy: copyMD5 } = useCopy();
  const { copied: copiedSHA1, copy: copySHA1 } = useCopy();
  const { copied: copiedSHA256, copy: copySHA256 } = useCopy();
  const { copied: copiedSHA512, copy: copySHA512 } = useCopy();

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          <button className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
            <Hash size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Text Hash
          </button>
          <button className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`} onClick={() => setActiveTab('file')}>
            <FileText size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            File Hash
          </button>
        </div>

        {activeTab === 'text' ? (
          <div className="form-group">
            <label className="form-label">Input Text</label>
            <textarea
              className="form-input-textarea"
              placeholder="Enter text to generate hashes..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Upload File</label>
            <input
              type="file"
              onChange={handleFileChange}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px dashed var(--border-color)',
                padding: '2rem',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                cursor: 'pointer',
                width: '100%',
              }}
            />
            {file && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                File: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Hashes</span>
          {loading && <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)' }}>Computing...</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'MD5', val: hashes.md5, copyFn: copyMD5, copiedState: copiedMD5 },
            { label: 'SHA-1', val: hashes.sha1, copyFn: copySHA1, copiedState: copiedSHA1 },
            { label: 'SHA-256', val: hashes.sha256, copyFn: copySHA256, copiedState: copiedSHA256 },
            { label: 'SHA-512', val: hashes.sha512, copyFn: copySHA512, copiedState: copiedSHA512 },
          ].map((h) => (
            <div key={h.label} className="form-group" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{h.label}</span>
                <button
                  className="btn btn-secondary btn-icon-label"
                  onClick={() => h.copyFn(h.val)}
                  disabled={!h.val || h.val === 'N/A'}
                  style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {h.copiedState ? <Check size={14} /> : <Copy size={14} />}
                  {h.copiedState ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div
                className="output-display"
                style={{
                  minHeight: 'auto',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  marginTop: '0.25rem',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                {h.val || 'Generate hashes to view output...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. UUID & ULID GENERATOR
// ----------------------------------------------------
export function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [type, setType] = useState<'uuid' | 'ulid'>('uuid');
  const [isUppercase, setIsUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [generatedList, setGeneratedList] = useState<string[]>([]);
  const { copied, copy } = useCopy();

  const generateULID = (): string => {
    const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let time = Date.now();
    let timeStr = '';
    for (let i = 9; i >= 0; i--) {
      timeStr = ENCODING.charAt(time % 32) + timeStr;
      time = Math.floor(time / 32);
    }
    let randStr = '';
    for (let i = 0; i < 16; i++) {
      randStr += ENCODING.charAt(Math.floor(Math.random() * 32));
    }
    return timeStr + randStr;
  };

  const handleGenerate = () => {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      if (type === 'uuid') {
        let val: string = crypto.randomUUID();
        if (noHyphens) val = val.replace(/-/g, '');
        if (isUppercase) val = val.toUpperCase();
        results.push(val);
      } else {
        let val = generateULID();
        if (!isUppercase) val = val.toLowerCase();
        results.push(val);
      }
    }
    setGeneratedList(results);
  };

  useEffect(() => {
    handleGenerate();
  }, [count, type, isUppercase, noHyphens]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="form-input-select"
              value={type}
              onChange={(e) => setType(e.target.value as 'uuid' | 'ulid')}
            >
              <option value="uuid">UUID Version 4</option>
              <option value="ulid">ULID (Universally Unique Lexicographically Sortable Identifier)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity ({count})</label>
            <input
              type="range"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', marginTop: '0.5rem' }}
            />
          </div>
        </div>

        <div className="form-row" style={{ marginTop: '0.5rem' }}>
          <label className="form-checkbox-label">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={isUppercase}
              onChange={(e) => setIsUppercase(e.target.checked)}
            />
            Uppercase Output
          </label>

          {type === 'uuid' && (
            <label className="form-checkbox-label">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={noHyphens}
                onChange={(e) => setNoHyphens(e.target.checked)}
              />
              Remove Hyphens
            </label>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleGenerate} style={{ width: 'fit-content', marginTop: '0.5rem' }}>
          <RefreshCw size={16} />
          Regenerate
        </button>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Generated {type.toUpperCase()}s</span>
          <button
            className="btn btn-secondary btn-icon-label"
            onClick={() => copy(generatedList.join('\n'))}
            disabled={generatedList.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied All' : 'Copy All'}
          </button>
        </div>
        <div className="output-display" style={{ minHeight: '150px' }}>
          {generatedList.join('\n')}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. PASSWORD GENERATOR
// ----------------------------------------------------
export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<{ score: number; label: string; class: string }>({
    score: 0,
    label: 'Very Weak',
    class: '',
  });

  const { copied, copy } = useCopy();

  const generatePassword = () => {
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numbers = '0123456789';
    let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      lower = lower.replace(/[lio]/g, '');
      upper = upper.replace(/[IO]/g, '');
      numbers = numbers.replace(/[01]/g, '');
      symbols = symbols.replace(/[|]/g, '');
    }

    let charPool = '';
    if (includeLower) charPool += lower;
    if (includeUpper) charPool += upper;
    if (includeNumbers) charPool += numbers;
    if (includeSymbols) charPool += symbols;

    if (!charPool) {
      setPassword('Select at least one character set!');
      return;
    }

    let result = '';
    // Ensure we get at least one of each selected set
    const requiredChars: string[] = [];
    if (includeLower) requiredChars.push(lower.charAt(Math.floor(Math.random() * lower.length)));
    if (includeUpper) requiredChars.push(upper.charAt(Math.floor(Math.random() * upper.length)));
    if (includeNumbers) requiredChars.push(numbers.charAt(Math.floor(Math.random() * numbers.length)));
    if (includeSymbols) requiredChars.push(symbols.charAt(Math.floor(Math.random() * symbols.length)));

    for (let i = 0; i < length - requiredChars.length; i++) {
      result += charPool.charAt(Math.floor(Math.random() * charPool.length));
    }

    // Insert required characters at random spots
    const passwordArray = result.split('');
    requiredChars.forEach((char) => {
      const index = Math.floor(Math.random() * (passwordArray.length + 1));
      passwordArray.splice(index, 0, char);
    });

    setPassword(passwordArray.join(''));
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar]);

  useEffect(() => {
    // Calculate password strength
    if (!password || password.startsWith('Select')) {
      setStrength({ score: 0, label: 'Invalid', class: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 14) score++;
    
    let varietyCount = 0;
    if (/[a-z]/.test(password)) varietyCount++;
    if (/[A-Z]/.test(password)) varietyCount++;
    if (/[0-9]/.test(password)) varietyCount++;
    if (/[^a-zA-Z0-9]/.test(password)) varietyCount++;

    if (varietyCount >= 3) score++;
    if (varietyCount === 4 && password.length >= 12) score++;

    let label = 'Very Weak';
    let strengthClass = 'strength-weak';

    if (score === 1) {
      label = 'Weak';
      strengthClass = 'strength-weak';
    } else if (score === 2) {
      label = 'Fair';
      strengthClass = 'strength-fair';
    } else if (score === 3) {
      label = 'Good';
      strengthClass = 'strength-good';
    } else if (score >= 4) {
      label = 'Strong';
      strengthClass = 'strength-strong';
    }

    setStrength({ score, label, class: strengthClass });
  }, [password]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">
              <Key size={16} /> Password Length ({length})
            </label>
            <input
              type="range"
              min="6"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer', marginTop: '0.5rem' }}
            />
          </div>

          <div className="form-group" style={{ gap: '0.65rem' }}>
            <label className="form-label">
              <Shield size={16} /> Options
            </label>
            <div className="form-row">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={includeUpper}
                  onChange={(e) => setIncludeUpper(e.target.checked)}
                />
                Uppercase (A-Z)
              </label>

              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={includeLower}
                  onChange={(e) => setIncludeLower(e.target.checked)}
                />
                Lowercase (a-z)
              </label>

              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                />
                Numbers (0-9)
              </label>

              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                />
                Symbols (!@#$)
              </label>

              <label className="form-checkbox-label" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={excludeSimilar}
                  onChange={(e) => setExcludeSimilar(e.target.checked)}
                />
                Exclude Similar (e.g. i, l, 1, L, o, 0, O)
              </label>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={generatePassword} style={{ width: 'fit-content', marginTop: '0.5rem' }}>
          <RefreshCw size={16} />
          Regenerate
        </button>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Generated Password</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Strength: <span style={{ color: strength.score >= 3 ? 'var(--accent-success)' : strength.score === 2 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>{strength.label}</span>
          </span>
        </div>

        <div className="output-display" style={{ minHeight: '60px', padding: '1rem', fontSize: '1.2rem', textAlign: 'center', wordBreak: 'break-all' }}>
          {password}
        </div>

        <div className="strength-meter">
          <div className={`strength-bar ${strength.class}`}></div>
        </div>

        <div className="output-action-bar">
          <button
            className="btn btn-primary"
            onClick={() => copy(password)}
            disabled={!password || password.startsWith('Select')}
            style={{ width: '100%' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Password' : 'Copy Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
