import { useState, useEffect } from 'react';
import { Copy, Check, Download, Plus, Trash, Settings, Cpu, Info } from 'lucide-react';

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
}

interface McpParam {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

interface McpTool {
  name: string;
  description: string;
  params: McpParam[];
}

function generateTypeScriptBoilerplate(name: string, desc: string, toolsList: McpTool[]): string {
  let code = `// MCP Server Boilerplate (TypeScript)
// Description: ${desc}
// Built using @modelcontextprotocol/sdk
// Install dependencies: npm install @modelcontextprotocol/sdk

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize the MCP Server
const server = new Server(
  {
    name: "${name}",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
`;

  toolsList.forEach((t) => {
    code += `      {\n`;
    code += `        name: "${t.name}",\n`;
    code += `        description: "${t.description}",\n`;
    code += `        inputSchema: {\n`;
    code += `          type: "object",\n`;
    code += `          properties: {\n`;
    t.params.forEach((p) => {
      code += `            ${p.name}: { type: "${p.type}", description: "${p.description}" },\n`;
    });
    code += `          },\n`;
    const requiredList = t.params.filter((p) => p.required).map((p) => `"${p.name}"`);
    if (requiredList.length > 0) {
      code += `          required: [${requiredList.join(", ")}],\n`;
    }
    code += `        },\n`;
    code += `      },\n`;
  });

  code += `    ],
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
`;

  toolsList.forEach((t) => {
    code += `    case "${t.name}": {\n`;
    t.params.forEach((p) => {
      code += `      const ${p.name} = args?.${p.name} as ${p.type === 'number' ? 'number' : p.type === 'boolean' ? 'boolean' : 'string'};\n`;
    });
    code += `      
      // TODO: Implement your custom tool logic here
      console.error(\`Executing ${t.name} with arguments:\`, args);

      return {
        content: [
          {
            type: "text",
            text: \`Successfully executed tool ${t.name}. Arguments: \${JSON.stringify(args)}\`
          }
        ]
      };\n`;
    code += `    }\n`;
  });

  code += `    default:
      throw new Error(\`Tool not found: \${name}\`);
  }
});

// Start the server using Stdio transport (ideal for editor integrations)
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP server connected to Stdio transport!");
`;

  return code;
}

function generatePythonBoilerplate(name: string, desc: string, toolsList: McpTool[]): string {
  let code = `# MCP Server Boilerplate (Python)
# Built using the FastMCP SDK
# Install dependency: pip install mcp

from mcp.server.fastmcp import FastMCP

# Create a FastMCP server instance
mcp = FastMCP("${name}", description="${desc}")

`;

  toolsList.forEach((t) => {
    code += `@mcp.tool()\n`;
    let pyParams = t.params.map((p) => {
      let pyType = p.type === 'number' ? 'float' : p.type === 'boolean' ? 'bool' : 'str';
      return `${p.name}: ${pyType}`;
    }).join(', ');
    
    code += `def ${t.name}(${pyParams}) -> str:\n`;
    code += `    """${t.description}"""\n`;
    code += `    # TODO: Implement your custom tool logic here\n`;
    code += `    return f"Successfully executed ${t.name}. Arguments: " + str(locals())\n\n`;
  });

  code += `if __name__ == "__main__":
    mcp.run()
`;

  return code;
}

export function McpToolBuilder() {
  const [activeTab, setActiveTab] = useState<'scaffold' | 'config'>('scaffold');
  
  // Scaffold States
  const [serverName, setServerName] = useState('my-mcp-server');
  const [serverDesc, setServerDesc] = useState('A custom Model Context Protocol server');
  const [language, setLanguage] = useState<'ts' | 'python'>('ts');
  const [toolsList, setToolsList] = useState<McpTool[]>([
    {
      name: 'calculate_latency',
      description: 'Calculate network latency for a host',
      params: [
        { name: 'host', type: 'string', description: 'IP address or hostname', required: true }
      ]
    }
  ]);

  // Config States
  const [configKey, setConfigKey] = useState('my-mcp-server');
  const [configCommand, setConfigCommand] = useState('node');
  const [configArgs, setConfigArgs] = useState('/path/to/server/dist/index.js');
  const [configEnv, setConfigEnv] = useState('API_KEY=your_key_here\nLOG_LEVEL=info');

  const [scaffoldOutput, setScaffoldOutput] = useState('');
  const [configOutput, setConfigOutput] = useState('');
  const { copied, copy } = useCopy();

  // Generate Scaffold Code
  useEffect(() => {
    if (language === 'ts') {
      setScaffoldOutput(generateTypeScriptBoilerplate(serverName, serverDesc, toolsList));
    } else {
      setScaffoldOutput(generatePythonBoilerplate(serverName, serverDesc, toolsList));
    }
  }, [serverName, serverDesc, language, toolsList]);

  // Generate Config JSON
  useEffect(() => {
    const envObj: Record<string, string> = {};
    configEnv.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        envObj[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });

    const argsList = configArgs.split(' ').filter(arg => arg.trim() !== '');

    const configJSON = {
      mcpServers: {
        [configKey]: {
          command: configCommand,
          args: argsList,
          ...(Object.keys(envObj).length > 0 ? { env: envObj } : {})
        }
      }
    };

    setConfigOutput(JSON.stringify(configJSON, null, 2));
  }, [configKey, configCommand, configArgs, configEnv]);

  // Manage Tools List
  const addTool = () => {
    setToolsList([
      ...toolsList,
      {
        name: `new_tool_${toolsList.length + 1}`,
        description: 'New tool description',
        params: []
      }
    ]);
  };

  const removeTool = (index: number) => {
    setToolsList(toolsList.filter((_, i) => i !== index));
  };

  const updateToolField = (toolIndex: number, field: 'name' | 'description', value: string) => {
    const updated = [...toolsList];
    updated[toolIndex] = { ...updated[toolIndex], [field]: value };
    setToolsList(updated);
  };

  const addParam = (toolIndex: number) => {
    const updated = [...toolsList];
    updated[toolIndex].params.push({
      name: `param_${updated[toolIndex].params.length + 1}`,
      type: 'string',
      description: 'Parameter description',
      required: true
    });
    setToolsList(updated);
  };

  const removeParam = (toolIndex: number, paramIndex: number) => {
    const updated = [...toolsList];
    updated[toolIndex].params = updated[toolIndex].params.filter((_, i) => i !== paramIndex);
    setToolsList(updated);
  };

  const updateParamField = (toolIndex: number, paramIndex: number, field: keyof McpParam, value: any) => {
    const updated = [...toolsList];
    updated[toolIndex].params[paramIndex] = {
      ...updated[toolIndex].params[paramIndex],
      [field]: value
    };
    setToolsList(updated);
  };

  const handleDownloadCode = () => {
    const filename = language === 'ts' ? 'index.ts' : 'server.py';
    const blob = new Blob([scaffoldOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([configOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'claude_desktop_config.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-workspace-layout">
      {/* Tab Selectors */}
      <div className="glass-panel tool-controls-panel" style={{ gridColumn: 'span 2', padding: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'scaffold' ? 'active' : ''}`}
          onClick={() => setActiveTab('scaffold')}
        >
          <Cpu size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          MCP Server Scaffolder
        </button>
        <button
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Claude/Cursor Config Generator
        </button>
      </div>

      {activeTab === 'scaffold' ? (
        <>
          {/* Scaffold Controls */}
          <div className="glass-panel tool-controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 className="k8s-form-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>Server Core Settings</h3>
            
            <div className="tool-inputs-grid tool-inputs-grid-2">
              <div className="form-group">
                <label className="form-label">Server Name</label>
                <input
                  type="text"
                  className="form-input-text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Runtime / SDK Language</label>
                <select
                  className="form-input-text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <option value="ts">TypeScript / Node.js SDK</option>
                  <option value="python">Python / FastMCP SDK</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Server Description</label>
                <input
                  type="text"
                  className="form-input-text"
                  value={serverDesc}
                  onChange={(e) => setServerDesc(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span className="k8s-form-section-title" style={{ margin: 0 }}>Tools Definitions ({toolsList.length})</span>
              <button className="btn btn-secondary btn-icon-label" onClick={addTool} style={{ padding: '0.4rem 0.8rem' }}>
                <Plus size={14} /> Add Tool
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {toolsList.map((t, tIdx) => (
                <div
                  key={tIdx}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    position: 'relative'
                  }}
                >
                  <button
                    onClick={() => removeTool(tIdx)}
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                    title="Remove Tool"
                  >
                    <Trash size={16} />
                  </button>

                  <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginRight: '1.5rem' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Tool Name</label>
                      <input
                        type="text"
                        className="form-input-text"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={t.name}
                        onChange={(e) => updateToolField(tIdx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Tool Description</label>
                      <input
                        type="text"
                        className="form-input-text"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                        value={t.description}
                        onChange={(e) => updateToolField(tIdx, 'description', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Parameters</span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        onClick={() => addParam(tIdx)}
                      >
                        <Plus size={10} /> Add Param
                      </button>
                    </div>

                    {t.params.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No input arguments defined (parameterless tool).</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {t.params.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            style={{
                              display: 'flex',
                              gap: '0.5rem',
                              alignItems: 'center',
                              background: 'var(--bg-tertiary)',
                              padding: '0.4rem',
                              borderRadius: '4px'
                            }}
                          >
                            <input
                              type="text"
                              className="form-input-text"
                              style={{ flex: 2, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              value={p.name}
                              placeholder="Name"
                              onChange={(e) => updateParamField(tIdx, pIdx, 'name', e.target.value)}
                            />
                            <select
                              className="form-input-text"
                              style={{ flex: 1.5, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              value={p.type}
                              onChange={(e) => updateParamField(tIdx, pIdx, 'type', e.target.value as any)}
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                            </select>
                            <input
                              type="text"
                              className="form-input-text"
                              style={{ flex: 3, padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              value={p.description}
                              placeholder="Param description..."
                              onChange={(e) => updateParamField(tIdx, pIdx, 'description', e.target.value)}
                            />
                            <label className="form-checkbox-label" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', gap: '0.25rem' }}>
                              <input
                                type="checkbox"
                                className="form-checkbox"
                                style={{ width: '14px', height: '14px' }}
                                checked={p.required}
                                onChange={(e) => updateParamField(tIdx, pIdx, 'required', e.target.checked)}
                              />
                              Req
                            </label>
                            <button
                              onClick={() => removeParam(tIdx, pIdx)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scaffold Output */}
          <div className="glass-panel output-panel">
            <div className="output-header">
              <span className="output-title">Server Implementation ({language === 'ts' ? 'index.ts' : 'server.py'})</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-icon-label" onClick={() => copy(scaffoldOutput)}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button className="btn btn-primary btn-icon-label" onClick={handleDownloadCode}>
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
            <div className="output-display" style={{ minHeight: '350px', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {scaffoldOutput}
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                <Info size={16} style={{ marginTop: '0.15rem' }} />
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Running Instructions</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {language === 'ts' ? (
                  <>
                    Initialize project, install standard SDK: <code>npm init -y && npm install @modelcontextprotocol/sdk</code>. Run via standard node executor: <code>node index.js</code>.
                  </>
                ) : (
                  <>
                    Install SDK: <code>pip install mcp</code>. FastMCP starts an automated stdio transport wrapper easily. Run via python executor: <code>python server.py</code>.
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Config Controls */}
          <div className="glass-panel tool-controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 className="k8s-form-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>Configuration Options</h3>
            
            <div className="tool-inputs-grid tool-inputs-grid-2">
              <div className="form-group">
                <label className="form-label">Server Key/ID</label>
                <input
                  type="text"
                  className="form-input-text"
                  value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Command / Executor</label>
                <input
                  type="text"
                  className="form-input-text"
                  value={configCommand}
                  placeholder="node / python / uv / npx"
                  onChange={(e) => setConfigCommand(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Arguments (space-separated)</label>
                <input
                  type="text"
                  className="form-input-text"
                  value={configArgs}
                  placeholder="/path/to/server.js"
                  onChange={(e) => setConfigArgs(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Environment Variables (one KEY=VAL pair per line)</label>
                <textarea
                  className="form-input-textarea"
                  value={configEnv}
                  onChange={(e) => setConfigEnv(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Config Output */}
          <div className="glass-panel output-panel">
            <div className="output-header">
              <span className="output-title">claude_desktop_config.json</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-icon-label" onClick={() => copy(configOutput)}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button className="btn btn-primary btn-icon-label" onClick={handleDownloadConfig}>
                  <Download size={16} /> Download
                </button>
              </div>
            </div>
            <div className="output-display" style={{ minHeight: '250px', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {configOutput}
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                <Info size={16} style={{ marginTop: '0.15rem' }} />
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Where to place this file?</h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Paste these configs into:
                <br />
                • <strong>macOS</strong>: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>
                <br />
                • <strong>Windows</strong>: <code>%APPDATA%\Claude\claude_desktop_config.json</code>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
