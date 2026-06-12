import { useState, useEffect } from 'react';
import { Copy, Check, Eye, Edit2 } from 'lucide-react';

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

// Custom LCS line diff algorithm
function diffLines(a: string[], b: string[]) {
  const matrix: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  let i = a.length, j = b.length;
  const result: { type: 'added' | 'removed' | 'normal'; value: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'normal', value: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      result.unshift({ type: 'added', value: b[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
      result.unshift({ type: 'removed', value: a[i - 1] });
      i--;
    }
  }

  return result;
}

// ----------------------------------------------------
// 1. DIFF CHECKER
// ----------------------------------------------------
export function DiffChecker() {
  const [textA, setTextA] = useState('Hello world\nThis is a test\nHere is an unchanged line');
  const [textB, setTextB] = useState('Hello world!\nThis is another test\nHere is an unchanged line\nAnd a new line!');
  const [diffResult, setDiffResult] = useState<any[]>([]);

  useEffect(() => {
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');
    setDiffResult(diffLines(linesA, linesB));
  }, [textA, textB]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Original Text (A)</label>
            <textarea
              className="form-input-textarea"
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              placeholder="Paste original text here..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Modified Text (B)</label>
            <textarea
              className="form-input-textarea"
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              placeholder="Paste modified text here..."
            />
          </div>
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Diff Output</span>
        </div>
        <div className="output-display" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
          {diffResult.map((line, idx) => (
            <div key={idx} className={`diff-line ${line.type}`} style={{ padding: '2px 6px', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '30px', color: 'var(--text-muted)', userSelect: 'none', display: 'inline-block' }}>
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span>{line.value || ' '}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. MARKDOWN PREVIEWER
// ----------------------------------------------------
export function MarkdownPreview() {
  const [input, setInput] = useState(`# Welcome to DevForge Markdown Previewer

This is a **live preview** panel.

## Features:
- Standard headers (h1, h2, h3)
- **Bold** and *italic* text formatting
- Blockquotes
- Bulleted lists
- Inline \`code\` and code blocks:

\`\`\`
const test = "Hello World!";
console.log(test);
\`\`\`

> Blockquotes are also supported natively.
`);
  const [html, setHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'split' | 'preview'>('split');

  useEffect(() => {
    // Custom lightweight markdown parsing
    let parsed = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks
    parsed = parsed.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
    // Inline code
    parsed = parsed.replace(/`([^`]+)`/gim, '<code>$1</code>');
    
    // Headers
    parsed = parsed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    parsed = parsed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    parsed = parsed.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold/Italics
    parsed = parsed.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    parsed = parsed.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Blockquotes
    parsed = parsed.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Lists
    parsed = parsed.replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>');
    parsed = parsed.replace(/<\/ul>\s*<ul>/g, ''); // combine lists

    // Paragraphs
    const blocks = parsed.split(/\n\n+/);
    parsed = blocks
      .map((b) => {
        const trimmed = b.trim();
        if (
          trimmed.startsWith('<h') ||
          trimmed.startsWith('<pre') ||
          trimmed.startsWith('<block') ||
          trimmed.startsWith('<ul') ||
          trimmed.startsWith('<li>')
        ) {
          return b;
        }
        return `<p>${b.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');

    setHtml(parsed);
  }, [input]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel" style={{ padding: '0.75rem 1.5rem' }}>
        <div className="k8s-tabs" style={{ marginBottom: 0 }}>
          <button className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
            <Edit2 size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Editor
          </button>
          <button className={`tab-btn ${activeTab === 'split' ? 'active' : ''}`} onClick={() => setActiveTab('split')}>
            Split View
          </button>
          <button className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
            <Eye size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Live Preview
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: activeTab === 'split' ? '1fr 1fr' : '1fr',
          gap: '1.5rem',
        }}
      >
        {(activeTab === 'editor' || activeTab === 'split') && (
          <div className="glass-panel form-group" style={{ padding: '1.5rem' }}>
            <label className="form-label">Editor</label>
            <textarea
              className="form-input-textarea"
              style={{ minHeight: '400px' }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
        )}

        {(activeTab === 'preview' || activeTab === 'split') && (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label">Preview</label>
            <div className="markdown-preview-pane" dangerouslySetInnerHTML={{ __html: html }} style={{ height: '400px', flex: 1 }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. CASE CONVERTER & WORD COUNTER
// ----------------------------------------------------
export function CaseWordCounter() {
  const [text, setText] = useState('Example text to analyze and convert. The quick brown fox jumps over the lazy dog.');
  const [stats, setStats] = useState({
    chars: 0,
    words: 0,
    lines: 0,
    readTime: 0,
    paragraphs: 0,
  });
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (!text) {
      setStats({ chars: 0, words: 0, lines: 0, readTime: 0, paragraphs: 0 });
      return;
    }

    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim() !== '').length;
    const readTime = Math.ceil(words / 200); // 200 words per minute average reading speed

    setStats({ chars, words, lines, readTime, paragraphs });
  }, [text]);

  const convertCase = (type: 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'pascal') => {
    if (!text) return;
    let converted = '';
    switch (type) {
      case 'upper':
        converted = text.toUpperCase();
        break;
      case 'lower':
        converted = text.toLowerCase();
        break;
      case 'title':
        converted = text.replace(/\b\w/g, (c) => c.toUpperCase());
        break;
      case 'snake':
        converted = text
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^\w]/g, '');
        break;
      case 'camel':
        converted = text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+(.)/g, (_, chr) => chr.toUpperCase());
        break;
      case 'pascal':
        converted = text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/(?:\b|^)(.)/g, (_, chr) => chr.toUpperCase())
          .replace(/\s+/g, '');
        break;
    }
    setText(converted);
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="form-group">
          <label className="form-label">Input Text</label>
          <textarea
            className="form-input-textarea"
            placeholder="Type or paste text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Convert Case</label>
          <div className="form-row">
            <button className="btn btn-secondary" onClick={() => convertCase('upper')}>
              UPPERCASE
            </button>
            <button className="btn btn-secondary" onClick={() => convertCase('lower')}>
              lowercase
            </button>
            <button className="btn btn-secondary" onClick={() => convertCase('title')}>
              Title Case
            </button>
            <button className="btn btn-secondary" onClick={() => convertCase('camel')}>
              camelCase
            </button>
            <button className="btn btn-secondary" onClick={() => convertCase('snake')}>
              snake_case
            </button>
            <button className="btn btn-secondary" onClick={() => convertCase('pascal')}>
              PascalCase
            </button>
          </div>
        </div>
      </div>

      <div className="tool-inputs-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {[
          { label: 'Characters', value: stats.chars },
          { label: 'Words', value: stats.words },
          { label: 'Lines', value: stats.lines },
          { label: 'Paragraphs', value: stats.paragraphs },
          { label: 'Est. Read Time', value: `${stats.readTime} min` },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-panel"
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              {s.label}
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="glass-panel output-panel" style={{ padding: '1rem' }}>
        <button className="btn btn-primary" onClick={() => copy(text)} style={{ width: '100%' }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied Text' : 'Copy Analyzed Text'}
        </button>
      </div>
    </div>
  );
}
