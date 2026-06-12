import { useState, useEffect } from 'react';
import { Copy, Check, Plus, Trash2, Cpu, FileJson } from 'lucide-react';

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
// 1. PROMPT TEMPLATE BUILDER
// ----------------------------------------------------
export function PromptBuilder() {
  const [activeTemplate, setActiveTemplate] = useState<'system' | 'fewshot' | 'refactor' | 'cot'>('system');
  const [promptOutput, setPromptOutput] = useState('');
  const { copied, copy } = useCopy();

  // System State
  const [sysRole, setSysRole] = useState('Senior Security Architect');
  const [sysTask, setSysTask] = useState('Audit this code for vulnerabilities.');
  const [sysConstraints, setSysConstraints] = useState('Provide references to OWASP Top 10. Do not write code in responses.');
  const [sysFormat, setSysFormat] = useState('Markdown Table');

  // Few Shot State
  const [fewTask, setFewTask] = useState('Convert SQL statements to MongoDB queries.');
  const [fewExample1In, setFewExample1In] = useState('SELECT * FROM users WHERE age > 21;');
  const [fewExample1Out, setFewExample1Out] = useState('db.users.find({ age: { $gt: 21 } });');
  const [fewInput, setFewInput] = useState('SELECT name FROM companies WHERE employees < 100;');

  // Refactor State
  const [refCode, setRefCode] = useState('function process(items) {\n  let result = [];\n  for(let i=0; i<items.length; i++) {\n    if (items[i].active) {\n      result.push(items[i].value * 2);\n    }\n  }\n  return result;\n}');
  const [refGoal, setRefGoal] = useState('Rewrite using ES6 array methods, optimizing for readability.');

  // Chain of Thought State
  const [cotProblem, setCotProblem] = useState('Calculate the subnet mask and host range for 192.168.10.35/27.');

  useEffect(() => {
    let prompt = '';
    if (activeTemplate === 'system') {
      prompt = `System Instructions:
You are an expert ${sysRole}.
Your task is: ${sysTask}

Constraints:
${sysConstraints}

Output Format:
Please present your final output as a ${sysFormat}.`;
    } else if (activeTemplate === 'fewshot') {
      prompt = `Task: ${fewTask}

Example 1:
Input: ${fewExample1In}
Output: ${fewExample1Out}

Input: ${fewInput}
Output:`;
    } else if (activeTemplate === 'refactor') {
      prompt = `Refactor request:
Please review the following code:
\`\`\`javascript
${refCode}
\`\`\`

Objective:
${refGoal}

Provide the optimized code, explain the changes, and note any performance/readability improvements.`;
    } else if (activeTemplate === 'cot') {
      prompt = `Please solve the following problem step-by-step:

Problem:
${cotProblem}

Guidelines:
1. Break down the problem into logical phases.
2. Outline the formulas or concepts used.
3. Show your calculation details for each step.
4. Verify your final answer before displaying it.`;
    }
    setPromptOutput(prompt);
  }, [
    activeTemplate,
    sysRole,
    sysTask,
    sysConstraints,
    sysFormat,
    fewTask,
    fewExample1In,
    fewExample1Out,
    fewInput,
    refCode,
    refGoal,
    cotProblem,
  ]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          {[
            { id: 'system', name: 'System Role' },
            { id: 'fewshot', name: 'Few-Shot Examples' },
            { id: 'refactor', name: 'Code Refactoring' },
            { id: 'cot', name: 'Chain-of-Thought' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTemplate === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTemplate(tab.id as any)}
            >
              <Cpu size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* 1. SYSTEM */}
        {activeTemplate === 'system' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">System Role / Persona</label>
              <input type="text" className="form-input-text" value={sysRole} onChange={(e) => setSysRole(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Goal / Task</label>
              <input type="text" className="form-input-text" value={sysTask} onChange={(e) => setSysTask(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Format Preference</label>
              <input type="text" className="form-input-text" value={sysFormat} onChange={(e) => setSysFormat(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Constraints</label>
              <textarea className="form-input-textarea" value={sysConstraints} onChange={(e) => setSysConstraints(e.target.value)} style={{ minHeight: '100px' }} />
            </div>
          </div>
        )}

        {/* 2. FEW-SHOT */}
        {activeTemplate === 'fewshot' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Task Description</label>
              <input type="text" className="form-input-text" value={fewTask} onChange={(e) => setFewTask(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Example Input 1</label>
              <input type="text" className="form-input-text" value={fewExample1In} onChange={(e) => setFewExample1In(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Example Output 1</label>
              <input type="text" className="form-input-text" value={fewExample1Out} onChange={(e) => setFewExample1Out(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Real Input</label>
              <input type="text" className="form-input-text" value={fewInput} onChange={(e) => setFewInput(e.target.value)} />
            </div>
          </div>
        )}

        {/* 3. REFACTOR */}
        {activeTemplate === 'refactor' && (
          <div className="tool-inputs-grid">
            <div className="form-group">
              <label className="form-label">Code block to refactor</label>
              <textarea className="form-input-textarea" value={refCode} onChange={(e) => setRefCode(e.target.value)} style={{ minHeight: '180px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Refactoring Goal</label>
              <input type="text" className="form-input-text" value={refGoal} onChange={(e) => setRefGoal(e.target.value)} />
            </div>
          </div>
        )}

        {/* 4. CHAIN-OF-THOUGHT */}
        {activeTemplate === 'cot' && (
          <div className="tool-inputs-grid">
            <div className="form-group">
              <label className="form-label">Problem Description</label>
              <textarea className="form-input-textarea" value={cotProblem} onChange={(e) => setCotProblem(e.target.value)} style={{ minHeight: '150px' }} />
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Assembled Prompt</span>
          <button className="btn btn-primary btn-icon-label" onClick={() => copy(promptOutput)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Prompt'}
          </button>
        </div>
        <div className="output-display" style={{ minHeight: '200px' }}>
          {promptOutput}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. STRUCTURED JSON SCHEMA GENERATOR
// ----------------------------------------------------
interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

export function JsonSchemaGenerator() {
  const [fields, setFields] = useState<SchemaField[]>([
    { name: 'id', type: 'number', description: 'Unique identifier for the item', required: true },
    { name: 'title', type: 'string', description: 'Headline title of the entity', required: true },
    { name: 'completed', type: 'boolean', description: 'Status indicating task completion', required: false },
  ]);
  const [schemaName, setSchemaName] = useState('TaskResponse');
  const [strict, setStrict] = useState(true);
  const [schemaOutput, setSchemaOutput] = useState('');
  const { copied, copy } = useCopy();

  const addField = () => {
    setFields((prev) => [...prev, { name: '', type: 'string', description: '', required: false }]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, val: any) => {
    setFields((prev) =>
      prev.map((f, idx) => (idx === index ? { ...f, [key]: val } : f))
    );
  };

  useEffect(() => {
    const properties: any = {};
    const required: string[] = [];

    fields.forEach((f) => {
      if (!f.name.trim()) return;

      const fieldDef: any = {
        type: f.type,
      };

      if (f.description.trim()) {
        fieldDef.description = f.description;
      }

      if (f.type === 'array') {
        fieldDef.items = { type: 'string' }; // default fallback items
      }

      properties[f.name.trim()] = fieldDef;

      if (f.required) {
        required.push(f.name.trim());
      }
    });

    const schema: any = {
      name: schemaName.trim() || 'ResponseSchema',
      schema: {
        type: 'object',
        properties,
        required,
      },
    };

    if (strict) {
      schema.schema.additionalProperties = false;
      // Strict schemas require all properties listed in required list
      schema.schema.required = Object.keys(properties);
      // Update fields check
      fields.forEach((f) => {
        if (f.name.trim() && !f.required) {
          // Sync UI checkbox if strict is selected
          f.required = true;
        }
      });
    }

    setSchemaOutput(JSON.stringify(schema, null, 2));
  }, [fields, schemaName, strict]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Schema Name</label>
            <input type="text" className="form-input-text" value={schemaName} onChange={(e) => setSchemaName(e.target.value)} />
          </div>

          <div className="form-group" style={{ justifyContent: 'center' }}>
            <label className="form-checkbox-label" style={{ marginTop: '1rem' }}>
              <input
                type="checkbox"
                className="form-checkbox"
                checked={strict}
                onChange={(e) => setStrict(e.target.checked)}
              />
              <strong>Strict Schema</strong> (required for OpenAI/Gemini Structured Outputs)
            </label>
          </div>
        </div>

        <div className="form-group k8s-form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div className="k8s-form-section-title" style={{ margin: 0 }}>
              <FileJson size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Schema Fields
            </div>
            <button className="btn btn-secondary" onClick={addField} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <Plus size={14} /> Add Field
            </button>
          </div>

          <div className="schema-fields-list">
            {fields.map((f, idx) => (
              <div key={idx} className="schema-field-row">
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="Field Name"
                  value={f.name}
                  onChange={(e) => updateField(idx, 'name', e.target.value)}
                />
                <select
                  className="form-input-select"
                  value={f.type}
                  onChange={(e) => updateField(idx, 'type', e.target.value)}
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                </select>
                <input
                  type="text"
                  className="form-input-text"
                  placeholder="Description..."
                  value={f.description}
                  onChange={(e) => updateField(idx, 'description', e.target.value)}
                />
                <label className="form-checkbox-label" style={{ fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    style={{ width: '16px', height: '16px' }}
                    checked={strict ? true : f.required}
                    disabled={strict}
                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                  />
                  Required
                </label>
                <button
                  className="btn btn-secondary"
                  onClick={() => removeField(idx)}
                  style={{ color: 'var(--accent-danger)', border: 'none', padding: '0.5rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Structured Output JSON Schema</span>
          <button className="btn btn-primary btn-icon-label" onClick={() => copy(schemaOutput)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Schema' : 'Copy Schema'}
          </button>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem' }}>
          {schemaOutput}
        </div>
      </div>
    </div>
  );
}
