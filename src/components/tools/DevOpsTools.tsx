import { useState, useEffect } from 'react';
import { Copy, Check, Info } from 'lucide-react';
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

// Docker run parser
function parseDockerRun(cmd: string) {
  let args = cmd.replace(/\\?\n/g, ' ').trim();
  if (args.startsWith('docker run')) {
    args = args.substring(10).trim();
  }
  
  // Custom token parser respecting quotes
  const tokens: string[] = [];
  let current = '';
  let inQuotes: string | null = null;
  for (let i = 0; i < args.length; i++) {
    const char = args[i];
    if (char === '"' || char === "'") {
      if (inQuotes === char) {
        inQuotes = null;
      } else if (!inQuotes) {
        inQuotes = char;
      } else {
        current += char;
      }
    } else if (char === ' ' && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);

  const config: any = {
    name: 'my-service',
    image: '',
    ports: [],
    volumes: [],
    env: {},
    restart: 'no',
    network: '',
    command: []
  };

  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === '-d' || t === '--detach') {
      i++;
    } else if (t === '--name') {
      config.name = tokens[i + 1] || 'my-service';
      i += 2;
    } else if (t === '-p' || t === '--publish') {
      config.ports.push(tokens[i + 1]);
      i += 2;
    } else if (t === '-v' || t === '--volume') {
      config.volumes.push(tokens[i + 1]);
      i += 2;
    } else if (t === '-e' || t === '--env') {
      const pair = tokens[i + 1] || '';
      const eqIdx = pair.indexOf('=');
      if (eqIdx !== -1) {
        config.env[pair.substring(0, eqIdx)] = pair.substring(eqIdx + 1);
      }
      i += 2;
    } else if (t === '--restart') {
      config.restart = tokens[i + 1] || 'no';
      i += 2;
    } else if (t === '--network') {
      config.network = tokens[i + 1] || '';
      i += 2;
    } else if (t.startsWith('-')) {
      i++;
    } else {
      config.image = t;
      config.command = tokens.slice(i + 1);
      break;
    }
  }
  return config;
}

function composeComposeYaml(config: any) {
  const service: any = {
    image: config.image || 'nginx:latest',
  };
  if (config.restart && config.restart !== 'no') {
    service.restart = config.restart;
  }
  if (config.ports.length > 0) {
    service.ports = config.ports.map((p: string) => p.includes(':') ? p : `${p}:${p}`);
  }
  if (config.volumes.length > 0) {
    service.volumes = config.volumes;
  }
  if (Object.keys(config.env).length > 0) {
    service.environment = config.env;
  }
  if (config.network) {
    service.networks = [config.network];
  }
  if (config.command.length > 0) {
    service.command = config.command;
  }

  const composeObj: any = {
    version: '3.8',
    services: {
      [config.name]: service
    }
  };
  if (config.network) {
    composeObj.networks = {
      [config.network]: {
        driver: 'bridge'
      }
    };
  }
  return yaml.dump(composeObj, { indent: 2 });
}

// ----------------------------------------------------
// 1. DOCKER RUN TO COMPOSE CONVERTER
// ----------------------------------------------------
export function DockerComposeConverter() {
  const [input, setInput] = useState('docker run -d -p 8080:80 --name web-server -v /var/www:/usr/share/nginx/html --restart always nginx:alpine');
  const [output, setOutput] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    const parsed = parseDockerRun(input);
    setOutput(composeComposeYaml(parsed));
  }, [input]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="form-group">
          <label className="form-label">Docker Run Command</label>
          <textarea
            className="form-input-textarea"
            placeholder="Paste docker run command here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ minHeight: '120px' }}
          />
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">docker-compose.yml</span>
          <button className="btn btn-primary btn-icon-label" onClick={() => copy(output)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="output-display" style={{ minHeight: '200px', fontSize: '0.85rem' }}>
          {output}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. DOCKERFILE GENERATOR
// ----------------------------------------------------
export function DockerfileGenerator() {
  const [lang, setLang] = useState<'node' | 'go' | 'python' | 'html'>('node');
  const [version, setVersion] = useState('20-alpine');
  const [workdir, setWorkdir] = useState('/app');
  const [port, setPort] = useState(3000);
  const [buildCommand, setBuildCommand] = useState('npm run build');
  const [runCommand, setRunCommand] = useState('npm start');
  const [dockerfileOutput, setDockerfileOutput] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    let output = '';
    if (lang === 'node') {
      output = `# --- Build Stage ---
FROM node:${version} AS builder
WORKDIR ${workdir}
COPY package*.json ./
RUN npm ci
COPY . .
RUN ${buildCommand}

# --- Runtime Stage ---
FROM node:${version}
WORKDIR ${workdir}
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder ${workdir}/dist ./dist

# Standard Security Best Practice: Run as non-root user
USER node
EXPOSE ${port}
CMD ["sh", "-c", "${runCommand}"]
`;
    } else if (lang === 'go') {
      output = `# --- Build Stage ---
FROM golang:${version} AS builder
WORKDIR ${workdir}
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# --- Runtime Stage (Distroless for maximum security)
FROM gcr.io/distroless/static-debian12
WORKDIR ${workdir}
COPY --from=builder ${workdir}/main .
EXPOSE ${port}
CMD ["./main"]
`;
    } else if (lang === 'python') {
      output = `# --- Production Dockerfile ---
FROM python:${version}
WORKDIR ${workdir}
ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Run as non-privileged service user
RUN useradd -u 8888 appuser && chown -R appuser ${workdir}
USER appuser

EXPOSE ${port}
CMD ["python", "main.py"]
`;
    } else if (lang === 'html') {
      output = `# --- Static Web Content Server ---
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
    }
    setDockerfileOutput(output);
  }, [lang, version, workdir, port, buildCommand, runCommand]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Template Language</label>
            <select className="form-input-select" value={lang} onChange={(e) => {
              const val = e.target.value as any;
              setLang(val);
              setVersion(val === 'node' ? '20-alpine' : val === 'go' ? '1.22-alpine' : val === 'python' ? '3.11-slim' : 'alpine');
              setPort(val === 'node' ? 3000 : val === 'go' ? 8080 : val === 'python' ? 8000 : 80);
              setRunCommand(val === 'node' ? 'node dist/main.js' : val === 'python' ? 'python main.py' : '');
            }}>
              <option value="node">Node.js (TypeScript/JavaScript)</option>
              <option value="go">Go (Golang)</option>
              <option value="python">Python</option>
              <option value="html">Static HTML (Nginx)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Base Image tag</label>
            <input type="text" className="form-input-text" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Working Directory</label>
            <input type="text" className="form-input-text" value={workdir} onChange={(e) => setWorkdir(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Exposed Container Port</label>
            <input type="number" className="form-input-text" value={port} onChange={(e) => setPort(Number(e.target.value))} />
          </div>

          {lang === 'node' && (
            <div className="form-group">
              <label className="form-label">Build Command</label>
              <input type="text" className="form-input-text" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
            </div>
          )}

          {lang !== 'html' && (
            <div className="form-group">
              <label className="form-label">Runtime Start Command</label>
              <input type="text" className="form-input-text" value={runCommand} onChange={(e) => setRunCommand(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Dockerfile</span>
          <button className="btn btn-primary btn-icon-label" onClick={() => copy(dockerfileOutput)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem' }}>
          {dockerfileOutput}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. CIDR SUBNET CALCULATOR
// ----------------------------------------------------
export function CidrCalculator() {
  const [ip, setIp] = useState('10.0.0.0');
  const [mask, setMask] = useState(24);
  const [targetMask, setTargetMask] = useState(26);
  const [results, setResults] = useState<any>(null);
  const [subnets, setSubnets] = useState<any[]>([]);

  // Sync targetMask when base mask changes
  useEffect(() => {
    if (targetMask <= mask) {
      setTargetMask(Math.min(32, mask + 2));
    }
  }, [mask]);

  // Main subnet logic
  useEffect(() => {
    const ipParts = ip.split('.').map(Number);
    if (ipParts.length !== 4 || ipParts.some(isNaN) || ipParts.some(p => p < 0 || p > 255)) {
      setResults(null);
      return;
    }
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const netmaskNum = mask === 0 ? 0 : (~0 << (32 - mask));
    const networkNum = ipNum & netmaskNum;
    const wildcardNum = ~netmaskNum;
    const broadcastNum = networkNum | wildcardNum;

    const numToIp = (num: number) => [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join('.');

    const networkIp = numToIp(networkNum);
    const netmaskIp = numToIp(netmaskNum);
    const wildcardIp = numToIp(wildcardNum);
    const broadcastIp = numToIp(broadcastNum);

    const firstUsable = mask >= 31 ? '-' : numToIp(networkNum + 1);
    const lastUsable = mask >= 31 ? '-' : numToIp(broadcastNum - 1);
    const totalHosts = mask >= 31 ? 0 : Math.max(0, Math.pow(2, 32 - mask) - 2);

    setResults({
      networkIp,
      netmaskIp,
      wildcardIp,
      broadcastIp,
      firstUsable,
      lastUsable,
      totalHosts
    });
  }, [ip, mask]);

  // Subnet breakdown generation
  useEffect(() => {
    if (!results || targetMask <= mask) {
      setSubnets([]);
      return;
    }

    const ipParts = ip.split('.').map(Number);
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const netmaskNum = mask === 0 ? 0 : (~0 << (32 - mask));
    const baseNetworkNum = ipNum & netmaskNum;

    const chunkSize = Math.pow(2, 32 - targetMask);
    const totalChunks = Math.pow(2, targetMask - mask);
    const displayLimit = Math.min(totalChunks, 64);

    const list = [];
    for (let c = 0; c < displayLimit; c++) {
      const start = baseNetworkNum + (c * chunkSize);
      const end = start + chunkSize - 1;

      const numToIp = (num: number) => [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join('.');

      list.push({
        cidr: `${numToIp(start)}/${targetMask}`,
        range: targetMask >= 31 ? `${numToIp(start)} - ${numToIp(end)}` : `${numToIp(start + 1)} - ${numToIp(end - 1)}`,
        hosts: targetMask >= 31 ? chunkSize : chunkSize - 2
      });
    }
    setSubnets(list);
  }, [ip, mask, targetMask, results]);

  const renderTreeRows = () => {
    const rows = [];
    const maxDepth = Math.min(targetMask, mask + 4); // limit depth for visual size constraints

    const ipParts = ip.split('.').map(Number);
    const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const netmaskNum = mask === 0 ? 0 : (~0 << (32 - mask));
    const baseNetworkNum = ipNum & netmaskNum;

    for (let d = mask; d <= maxDepth; d++) {
      const totalBlocks = Math.pow(2, d - mask);
      const blockSize = Math.pow(2, 32 - d);
      const blockList = [];

      // Render summary row if blocks are too narrow to display
      if (totalBlocks > 16) {
        rows.push(
          <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Level /{d} ({totalBlocks} Subnets)
            </div>
            <div style={{
              height: '35px',
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              {totalBlocks} subnets of size /{d} (too many to show individual blocks)
            </div>
          </div>
        );
        continue;
      }

      for (let b = 0; b < totalBlocks; b++) {
        const start = baseNetworkNum + (b * blockSize);
        const numToIp = (num: number) => [
          (num >>> 24) & 255,
          (num >>> 16) & 255,
          (num >>> 8) & 255,
          num & 255
        ].join('.');

        blockList.push({
          cidr: `${numToIp(start)}/${d}`,
          ip: numToIp(start)
        });
      }

      rows.push(
        <div key={d} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Level /{d} ({totalBlocks} Subnet{totalBlocks > 1 ? 's' : ''})
          </div>
          <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
            {blockList.map((blk, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (d > mask) {
                    setTargetMask(d);
                  }
                }}
                style={{
                  flex: 1,
                  height: '40px',
                  background: d === targetMask ? 'var(--accent-primary-glow)' : 'var(--bg-secondary)',
                  border: `1px solid ${d === targetMask ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: d > mask ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '0 4px',
                  boxShadow: d === targetMask ? 'var(--shadow-glow)' : 'none'
                }}
                className={d > mask ? 'glass-panel-interactive' : ''}
                title={blk.cidr}
              >
                <code style={{
                  fontSize: totalBlocks <= 4 ? '0.8rem' : '0.7rem',
                  fontWeight: 'bold',
                  color: d === targetMask ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  {totalBlocks <= 2 ? blk.cidr : `.${blk.ip.split('.')[3]}`}
                </code>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Base IP Address</label>
            <input type="text" className="form-input-text" value={ip} onChange={(e) => setIp(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Subnet Mask CIDR (/{mask})</label>
            <select className="form-input-select" value={mask} onChange={(e) => setMask(Number(e.target.value))}>
              {Array.from({ length: 33 }, (_, idx) => (
                <option key={idx} value={idx}>
                  /{idx} (Mask: {[(~0 << (32 - idx)) >>> 24 & 255, (~0 << (32 - idx)) >>> 16 & 255, (~0 << (32 - idx)) >>> 8 & 255, (~0 << (32 - idx)) & 255].join('.')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {results && (
        <div className="tool-inputs-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {[
            { label: 'Network IP', val: results.networkIp },
            { label: 'Subnet Mask', val: results.netmaskIp },
            { label: 'Wildcard Mask', val: results.wildcardIp },
            { label: 'Broadcast IP', val: results.broadcastIp },
            { label: 'First Usable', val: results.firstUsable },
            { label: 'Last Usable', val: results.lastUsable },
            { label: 'Total Usable Hosts', val: results.totalHosts.toLocaleString() },
          ].map((r) => (
            <div
              key={r.label}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                {r.label}
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {r.val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Subnet Breakdown Visualizer */}
      {results && (
        <div className="glass-panel output-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span className="output-title">Subnet Breakdown Visualizer</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Break down into:</span>
              <select
                className="form-input-select"
                style={{ width: '120px', padding: '0.35rem 0.5rem' }}
                value={targetMask}
                onChange={(e) => setTargetMask(Number(e.target.value))}
              >
                {Array.from({ length: 33 }, (_, idx) => idx)
                  .filter(m => m > mask)
                  .map(m => (
                    <option key={m} value={m}>/{m}</option>
                  ))
                }
              </select>
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            A <strong>/{mask}</strong> network contains <strong>{Math.pow(2, targetMask - mask).toLocaleString()}</strong> subnets of size <strong>/{targetMask}</strong>.
            {Math.pow(2, targetMask - mask) > 64 && " (Showing first 64)"}
          </div>

          {/* Subnet Binary Partition Map */}
          <div style={{
            padding: '1rem',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Subnet Partition Tree (Binary Map)
            </div>
            {renderTreeRows()}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '0.75rem',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '0.5rem 0'
          }}>
            {subnets.map((sub, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{sub.cidr}</code>
                  <button
                    className="btn btn-secondary btn-icon-label"
                    style={{ padding: '2px 4px', fontSize: '0.75rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(sub.cidr);
                    }}
                    title="Copy CIDR"
                  >
                    Copy
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Range: <code style={{ fontSize: '0.75rem' }}>{sub.range}</code>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Hosts: <strong>{sub.hosts.toLocaleString()}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 4. SSH CONFIG PROFILE BUILDER
// ----------------------------------------------------
// ----------------------------------------------------
// 4. SPLUNK QUERY GENERATOR
// ----------------------------------------------------
export function SplunkQueryGenerator() {
  const [queryType, setQueryType] = useState<'basic' | 'stats' | 'transaction' | 'rex-eval'>('basic');
  const [index, setIndex] = useState('main');
  const [sourcetype, setSourcetype] = useState('kube:container:app');
  const [host, setHost] = useState('');
  const [source, setSource] = useState('');
  const [searchTerms, setSearchTerms] = useState('status=error OR status=fail');
  const [excludeTerms, setExcludeTerms] = useState('DEBUG');
  const [timeRange, setTimeRange] = useState('earliest=-1h');
  const [limitCount, setLimitCount] = useState('100');

  // Stats settings
  const [statsFunction, setStatsFunction] = useState('count');
  const [statsField, setStatsField] = useState('');
  const [statsGroupBy, setStatsGroupBy] = useState('host, status');
  const [statsAlias, setStatsAlias] = useState('count');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Transaction settings
  const [txnField, setTxnField] = useState('session_id');
  const [txnMaxSpan, setTxnMaxSpan] = useState('5m');
  const [txnMaxPause, setTxnMaxPause] = useState('');
  const [txnStart, setTxnStart] = useState('');
  const [txnEnd, setTxnEnd] = useState('');

  // Rex & Eval settings
  const [rexField, setRexField] = useState('_raw');
  const [rexPattern, setRexPattern] = useState('(?<error_code>ERR-\\\d+)');
  const [evalExpr, setEvalExpr] = useState('is_error = if(status >= 400, "yes", "no")');
  const [tableFields, setTableFields] = useState('timestamp, host, status, error_code');

  const [queryOutput, setQueryOutput] = useState('');
  const { copied, copy } = useCopy();

  const applyTemplate = (templateName: string) => {
    switch (templateName) {
      case 'error-rate':
        setIndex('main');
        setSourcetype('kube:container:app');
        setHost('');
        setSource('');
        setSearchTerms('status>=500');
        setExcludeTerms('DEBUG');
        setTimeRange('earliest=-24h');
        setQueryType('stats');
        setStatsFunction('count');
        setStatsField('');
        setStatsGroupBy('host, status');
        setStatsAlias('error_count');
        setSortField('error_count');
        setSortOrder('desc');
        setLimitCount('');
        break;
      case 'user-session':
        setIndex('web');
        setSourcetype('access_combined');
        setHost('');
        setSource('');
        setSearchTerms('action=*');
        setExcludeTerms('');
        setTimeRange('earliest=-1h');
        setQueryType('transaction');
        setTxnField('session_id');
        setTxnMaxSpan('30m');
        setTxnMaxPause('5m');
        setTxnStart('action=login');
        setTxnEnd('action=logout');
        setLimitCount('');
        break;
      case 'extract-ip':
        setIndex('security');
        setSourcetype('firewall');
        setHost('');
        setSource('');
        setSearchTerms('blocked');
        setExcludeTerms('');
        setTimeRange('earliest=-15m');
        setQueryType('rex-eval');
        setRexField('_raw');
        setRexPattern('src_ip=(?<source_ip>\\\d{1,3}\\\.\\\d{1,3}\\\.\\\d{1,3}\\\.\\\d{1,3})');
        setEvalExpr('network_zone = if(cidrmatch("10.0.0.0/8", source_ip), "Internal", "External")');
        setTableFields('_time, source_ip, network_zone');
        setLimitCount('50');
        break;
      case 'perf-api':
        setIndex('api');
        setSourcetype('nginx');
        setHost('');
        setSource('');
        setSearchTerms('response_time>100');
        setExcludeTerms('');
        setTimeRange('earliest=-6h');
        setQueryType('stats');
        setStatsFunction('avg');
        setStatsField('response_time');
        setStatsGroupBy('endpoint');
        setStatsAlias('avg_latency');
        setSortField('avg_latency');
        setSortOrder('desc');
        setLimitCount('');
        break;
    }
  };

  useEffect(() => {
    let parts: string[] = [];
    
    // Base search clauses
    const baseFilters: string[] = [];
    if (index.trim()) baseFilters.push(`index="${index.trim()}"`);
    if (sourcetype.trim()) baseFilters.push(`sourcetype="${sourcetype.trim()}"`);
    if (host.trim()) baseFilters.push(`host="${host.trim()}"`);
    if (source.trim()) baseFilters.push(`source="${source.trim()}"`);
    if (searchTerms.trim()) baseFilters.push(searchTerms.trim());
    if (excludeTerms.trim()) baseFilters.push(`NOT (${excludeTerms.trim()})`);
    if (timeRange.trim()) baseFilters.push(timeRange.trim());

    let baseQuery = baseFilters.join(' ');
    if (baseQuery) {
      parts.push(baseQuery);
    }

    if (queryType === 'stats') {
      let statsClause = '';
      if (statsFunction === 'count' && !statsField.trim()) {
        statsClause = `stats count`;
      } else {
        const fieldStr = statsField.trim() ? statsField.trim() : '*';
        statsClause = `stats ${statsFunction}(${fieldStr})`;
      }

      if (statsAlias.trim()) {
        statsClause += ` as ${statsAlias.trim()}`;
      }

      if (statsGroupBy.trim()) {
        statsClause += ` by ${statsGroupBy.trim()}`;
      }

      parts.push(`| ${statsClause}`);

      if (sortField.trim()) {
        const prefix = sortOrder === 'desc' ? '-' : '';
        parts.push(`| sort ${prefix}${sortField.trim()}`);
      }
    } else if (queryType === 'transaction') {
      if (txnField.trim()) {
        let txnClause = `transaction ${txnField.trim()}`;
        if (txnMaxSpan.trim()) txnClause += ` maxspan=${txnMaxSpan.trim()}`;
        if (txnMaxPause.trim()) txnClause += ` maxpause=${txnMaxPause.trim()}`;
        if (txnStart.trim()) txnClause += ` startswith=(${txnStart.trim()})`;
        if (txnEnd.trim()) txnClause += ` endswith=(${txnEnd.trim()})`;
        parts.push(`| ${txnClause}`);
      }
    } else if (queryType === 'rex-eval') {
      if (rexPattern.trim()) {
        const fieldParam = rexField.trim() && rexField !== '_raw' ? `field=${rexField.trim()} ` : '';
        parts.push(`| rex ${fieldParam}"${rexPattern.trim()}"`);
      }
      if (evalExpr.trim()) {
        parts.push(`| eval ${evalExpr.trim()}`);
      }
      if (tableFields.trim()) {
        parts.push(`| table ${tableFields.trim()}`);
      }
    }

    if (limitCount.trim()) {
      parts.push(`| head ${limitCount.trim()}`);
    }

    // Join with newlines and indentation for readability
    setQueryOutput(parts.join('\n'));
  }, [
    queryType, index, sourcetype, host, source, searchTerms, excludeTerms, timeRange, limitCount,
    statsFunction, statsField, statsGroupBy, statsAlias, sortField, sortOrder,
    txnField, txnMaxSpan, txnMaxPause, txnStart, txnEnd,
    rexField, rexPattern, evalExpr, tableFields
  ]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Templates Section */}
        <div>
          <span className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Quick Templates</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => applyTemplate('error-rate')} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
              🔴 Error Rate over Time
            </button>
            <button className="btn btn-secondary" onClick={() => applyTemplate('user-session')} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
              👤 User Sessions (Transaction)
            </button>
            <button className="btn btn-secondary" onClick={() => applyTemplate('extract-ip')} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
              🔍 Extract & Filter IPs
            </button>
            <button className="btn btn-secondary" onClick={() => applyTemplate('perf-api')} style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>
              ⚡ API Latency Stats
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          {(['basic', 'stats', 'transaction', 'rex-eval'] as const).map((t) => (
            <button
              key={t}
              className={`btn ${queryType === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setQueryType(t)}
              style={{
                textTransform: 'capitalize',
                fontSize: '0.85rem',
                padding: '0.5rem 0.25rem',
                textAlign: 'center',
                justifyContent: 'center'
              }}
            >
              {t === 'rex-eval' ? 'Rex & Eval' : t}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <div className="tool-inputs-grid tool-inputs-grid-2">
          {/* Base Fields (always visible) */}
          <div className="form-group">
            <label className="form-label">Index</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. main"
              value={index}
              onChange={(e) => setIndex(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Sourcetype</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. access_combined"
              value={sourcetype}
              onChange={(e) => setSourcetype(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Host (Optional)</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. web-server-01"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Source (Optional)</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. /var/log/nginx/access.log"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Search Terms / Filter Expression</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. status>=400 OR 'failed login'"
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Exclude Terms (NOT)</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. DEBUG, ping"
              value={excludeTerms}
              onChange={(e) => setExcludeTerms(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time Modifier (SPL-level)</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. earliest=-1h"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            />
          </div>

          {/* Conditional Query Type Panels */}
          {queryType === 'stats' && (
            <>
              <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2', margin: '0.5rem 0' }}>
                <span className="k8s-form-section-title">Stats Aggregator Settings</span>
              </div>
              <div className="form-group">
                <label className="form-label">Stats Function</label>
                <select
                  className="form-input-text"
                  value={statsFunction}
                  onChange={(e) => setStatsFunction(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <option value="count">count</option>
                  <option value="dc">dc (distinct count)</option>
                  <option value="avg">avg</option>
                  <option value="sum">sum</option>
                  <option value="min">min</option>
                  <option value="max">max</option>
                  <option value="values">values</option>
                  <option value="list">list</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Stats Target Field (Optional for count)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. response_time"
                  value={statsField}
                  onChange={(e) => setStatsField(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stats Output Name (as)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. total_requests"
                  value={statsAlias}
                  onChange={(e) => setStatsAlias(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Group By (comma separated)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. clientip, status"
                  value={statsGroupBy}
                  onChange={(e) => setStatsGroupBy(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sort Field (Optional)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. total_requests"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sort Direction</label>
                <select
                  className="form-input-text"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </>
          )}

          {queryType === 'transaction' && (
            <>
              <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2', margin: '0.5rem 0' }}>
                <span className="k8s-form-section-title">Transaction Settings</span>
              </div>
              <div className="form-group">
                <label className="form-label">Transaction Field</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. session_id"
                  value={txnField}
                  onChange={(e) => setTxnField(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Duration (maxspan)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. 5m, 1h"
                  value={txnMaxSpan}
                  onChange={(e) => setTxnMaxSpan(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Max Idle Pause (maxpause)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. 30s"
                  value={txnMaxPause}
                  onChange={(e) => setTxnMaxPause(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Starts With Expression (Optional)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. action=login"
                  value={txnStart}
                  onChange={(e) => setTxnStart(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Ends With Expression (Optional)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="e.g. action=logout OR status=failed"
                  value={txnEnd}
                  onChange={(e) => setTxnEnd(e.target.value)}
                />
              </div>
            </>
          )}

          {queryType === 'rex-eval' && (
            <>
              <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2', margin: '0.5rem 0' }}>
                <span className="k8s-form-section-title">Regex Extraction (rex) & Calculations (eval)</span>
              </div>
              <div className="form-group">
                <label className="form-label">Rex Target Field</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="_raw"
                  value={rexField}
                  onChange={(e) => setRexField(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rex Pattern (Named Groups)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder='e.g. user=(?<user_name>\w+)'
                  value={rexPattern}
                  onChange={(e) => setRexPattern(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Eval Expression</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder='e.g. duration_sec = duration / 1000'
                  value={evalExpr}
                  onChange={(e) => setEvalExpr(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Table Projection Fields (comma separated)</label>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder='e.g. _time, host, user_name, duration_sec'
                  value={tableFields}
                  onChange={(e) => setTableFields(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Common Limit Field (at the bottom) */}
          <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2', margin: '0.5rem 0 0.2rem 0' }}></div>
          <div className="form-group">
            <label className="form-label">Limit Output Count (head)</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. 100 (leave blank to omit)"
              value={limitCount}
              onChange={(e) => setLimitCount(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Generated Splunk SPL Query</span>
          <button className="btn btn-primary btn-icon-label" onClick={() => copy(queryOutput)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Query' : 'Copy Query'}
          </button>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.9rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          {queryOutput}
        </div>
        
        {/* Help Panel */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            <Info size={16} style={{ marginTop: '0.15rem' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Splunk SPL Quick Tip</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            In Splunk Search Processing Language (SPL), pipes (<code style={{ color: 'var(--accent-secondary)' }}>|</code>) route the output of the preceding command into the input of the next command. Start with specific filters (index, sourcetype, host) to optimize query performance.
          </p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. PROMETHEUS ALERT RULES GENERATOR
// ----------------------------------------------------
export function PrometheusAlertRules() {
  const [cpuLimit, setCpuLimit] = useState(85);
  const [cpuTime, setCpuTime] = useState('5m');
  const [memLimit, setMemLimit] = useState(90);
  const [memTime, setMemTime] = useState('5m');
  const [diskLimit, setDiskLimit] = useState(80);
  const [diskTime, setDiskTime] = useState('15m');
  const [yamlOutput, setYamlOutput] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    const rules = {
      groups: [
        {
          name: 'host-alerts',
          rules: [
            {
              alert: 'HighCpuUsage',
              expr: `100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[${cpuTime}])) * 100) > ${cpuLimit}`,
              for: cpuTime,
              labels: {
                severity: 'warning'
              },
              annotations: {
                summary: 'High CPU usage detected on {{ $labels.instance }}',
                description: `CPU usage is above ${cpuLimit}% for more than ${cpuTime}. (current value: {{ $value | printf "%.2f" }}%)`
              }
            },
            {
              alert: 'HighMemoryUsage',
              expr: `(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > ${memLimit}`,
              for: memTime,
              labels: {
                severity: 'warning'
              },
              annotations: {
                summary: 'High Memory usage detected on {{ $labels.instance }}',
                description: `Memory usage is above ${memLimit}% for more than ${memTime}. (current value: {{ $value | printf "%.2f" }}%)`
              }
            },
            {
              alert: 'DiskSpaceFillingUp',
              expr: `(node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_free_bytes{mountpoint="/"}) / node_filesystem_size_bytes{mountpoint="/"} * 100 > ${diskLimit}`,
              for: diskTime,
              labels: {
                severity: 'critical'
              },
              annotations: {
                summary: 'Disk Space running out on {{ $labels.instance }}',
                description: `Disk partition "/" usage is above ${diskLimit}% for more than ${diskTime}. (current value: {{ $value | printf "%.2f" }}%)`
              }
            }
          ]
        }
      ]
    };
    setYamlOutput(yaml.dump(rules, { indent: 2 }));
  }, [cpuLimit, cpuTime, memLimit, memTime, diskLimit, diskTime]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          {/* CPU ALERT */}
          <div className="form-group">
            <label className="form-label">CPU Alert Threshold ({cpuLimit}%)</label>
            <input
              type="range"
              min="50"
              max="99"
              value={cpuLimit}
              onChange={(e) => setCpuLimit(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">CPU Evaluation Time</label>
            <input type="text" className="form-input-text" value={cpuTime} onChange={(e) => setCpuTime(e.target.value)} />
          </div>

          {/* MEMORY ALERT */}
          <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2', padding: 0, border: 'none' }}></div>
          <div className="form-group">
            <label className="form-label">Memory Alert Threshold ({memLimit}%)</label>
            <input
              type="range"
              min="50"
              max="99"
              value={memLimit}
              onChange={(e) => setMemLimit(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Memory Evaluation Time</label>
            <input type="text" className="form-input-text" value={memTime} onChange={(e) => setMemTime(e.target.value)} />
          </div>

          {/* DISK ALERT */}
          <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2', padding: 0, border: 'none' }}></div>
          <div className="form-group">
            <label className="form-label">Disk Alert Threshold ({diskLimit}%)</label>
            <input
              type="range"
              min="50"
              max="99"
              value={diskLimit}
              onChange={(e) => setDiskLimit(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Disk Evaluation Time</label>
            <input type="text" className="form-input-text" value={diskTime} onChange={(e) => setDiskTime(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Prometheus Alert Rules YAML</span>
          <button className="btn btn-primary btn-icon-label" onClick={() => copy(yamlOutput)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem' }}>
          {yamlOutput}
        </div>
      </div>
    </div>
  );
}
