import { useState, useEffect } from 'react';
import { Copy, Check, Plus, Trash2, Cpu, FileJson, Sparkles } from 'lucide-react';

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
const ROLE_PRESETS = {
  custom: {
    role: 'Senior Security Architect',
    task: 'Audit this code for vulnerabilities.',
    constraints: 'Provide references to OWASP Top 10. Do not write code in responses.',
    format: 'Markdown Table'
  },
  devops: {
    role: 'Devops Expert',
    task: 'Configure, optimize, or troubleshoot DevOps pipelines, Dockerfiles, or Kubernetes resources.',
    constraints: 'Ensure multi-stage builds, rootless container security, minimal image footprint, and clean logging.',
    format: 'YAML / Configuration guidelines and detailed walkthrough'
  },
  architect: {
    role: 'System Architect',
    task: 'Design a highly resilient, globally distributed, and scalable software architecture.',
    constraints: 'Specify caching layers, message queues, storage layout, data replication policies, and high-availability design.',
    format: 'Structured System Architecture Specification'
  },
  developer: {
    role: 'Software Developer expert',
    task: 'Implement clean, efficient, and maintainable code block solving this problem.',
    constraints: 'Apply appropriate design patterns, ensure optimal time complexity, write basic unit test suggestions, and handle boundary conditions.',
    format: 'Fully functional code block with documentation'
  },
  writer: {
    role: 'Tech Writer',
    task: 'Write comprehensive, developer-friendly documentation for this codebase or feature.',
    constraints: 'Use clear headings, provide complete usage examples, write in active voice, and follow standard markdown conventions.',
    format: 'Technical Markdown Documentation'
  },
  general: {
    role: 'General Specialist',
    task: 'Analyze the given request or problem and provide a detailed, accurate response.',
    constraints: 'Ensure clear structure, fact-based logical deductions, and concise actionable steps.',
    format: 'Structured markdown explanation'
  }
};

export function PromptBuilder() {
  const [activeTemplate, setActiveTemplate] = useState<'system' | 'fewshot' | 'refactor' | 'cot'>('system');
  const [promptOutput, setPromptOutput] = useState('');
  const { copied, copy } = useCopy();

  // System State
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [sysRole, setSysRole] = useState(ROLE_PRESETS.custom.role);
  const [sysTask, setSysTask] = useState(ROLE_PRESETS.custom.task);
  const [sysConstraints, setSysConstraints] = useState(ROLE_PRESETS.custom.constraints);
  const [sysFormat, setSysFormat] = useState(ROLE_PRESETS.custom.format);

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = ROLE_PRESETS[presetKey as keyof typeof ROLE_PRESETS];
    if (preset) {
      setSysRole(preset.role);
      setSysTask(preset.task);
      setSysConstraints(preset.constraints);
      setSysFormat(preset.format);
    }
  };

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
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Role Preset</label>
              <select
                className="form-input-select"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                <option value="custom">✍️ Custom Role</option>
                <option value="devops">🛠️ Devops Expert</option>
                <option value="architect">🏛️ System Architect</option>
                <option value="developer">💻 Software Developer expert</option>
                <option value="writer">📝 Tech Writer</option>
                <option value="general">🧠 General Specialist</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">System Role / Persona</label>
              <input
                type="text"
                className="form-input-text"
                value={sysRole}
                onChange={(e) => {
                  setSysRole(e.target.value);
                  setSelectedPreset('custom');
                }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Goal / Task</label>
              <input
                type="text"
                className="form-input-text"
                value={sysTask}
                onChange={(e) => {
                  setSysTask(e.target.value);
                  setSelectedPreset('custom');
                }}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Format Preference</label>
              <input
                type="text"
                className="form-input-text"
                value={sysFormat}
                onChange={(e) => {
                  setSysFormat(e.target.value);
                  setSelectedPreset('custom');
                }}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Constraints</label>
              <textarea
                className="form-input-textarea"
                value={sysConstraints}
                onChange={(e) => {
                  setSysConstraints(e.target.value);
                  setSelectedPreset('custom');
                }}
                style={{ minHeight: '100px' }}
              />
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

// ----------------------------------------------------
// 3. AI IMAGE PROMPT GENERATOR (ComfyUI & Stable Diffusion)
// ----------------------------------------------------
export function ImagePromptGenerator() {
  const [subject, setSubject] = useState('a majestic lone wolf standing on top of a snowy mountain peak');
  const [targetModel, setTargetModel] = useState<'nanobanana' | 'stable-diffusion'>('nanobanana');
  const [stylePreset, setStylePreset] = useState('photorealistic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [lighting, setLighting] = useState('sunset-glow');
  const [cameraLens, setCameraLens] = useState('dslr-50mm');
  const [mood, setMood] = useState('dramatic');
  const [qualityBoosters, setQualityBoosters] = useState<string[]>(['cinematic-composition', 'sharp-focus']);
  const [customModifiers, setCustomModifiers] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('low quality, worst quality, blurry, bad anatomy, deformed hands, extra limbs, watermark, signature');

  const [positiveOutput, setPositiveOutput] = useState('');
  const { copied: copiedPos, copy: copyPos } = useCopy();
  const { copied: copiedNeg, copy: copyNeg } = useCopy();

  const presets = {
    styles: [
      { id: 'photorealistic', name: '📷 Photorealistic', desc: 'Real-life photographic details' },
      { id: 'anime', name: '🎨 Anime / Manga', desc: 'Hand-drawn, vibrant animated feel' },
      { id: 'digital-art', name: '🖥️ Digital Art', desc: 'Concept illustration, Artstation style' },
      { id: 'cyberpunk', name: '🌆 Cyberpunk', desc: 'Neon lights and sci-fi technology' },
      { id: 'fantasy', name: '🧝 Fantasy / Mythic', desc: 'Magical particles and environments' },
      { id: 'cinematic', name: '🎬 Cinematic Film', desc: 'Movie still, dramatic color grade' },
      { id: '3d-render', name: '📦 3D Render', desc: 'Octane or Blender style details' },
    ],
    lighting: [
      { id: 'sunset-glow', name: 'Sunset Golden Hour' },
      { id: 'neon-glow', name: 'Neon Cyberpunk Lighting' },
      { id: 'volumetric', name: 'Volumetric Sun Rays' },
      { id: 'studio', name: 'Professional Studio Lights' },
      { id: 'low-light', name: 'Moody Low Light & Contrast' },
      { id: 'none', name: 'No Specific Lighting' },
    ],
    camera: [
      { id: 'dslr-50mm', name: 'DSLR 50mm Lens' },
      { id: 'wide-angle', name: 'Grand Wide Angle' },
      { id: 'macro', name: 'Macro Close-Up' },
      { id: 'drone', name: 'Aerial Drone view' },
      { id: 'POV', name: 'First-Person POV' },
      { id: 'none', name: 'No Specific Camera' },
    ]
  };

  const toggleBooster = (booster: string) => {
    setQualityBoosters((prev) =>
      prev.includes(booster) ? prev.filter((b) => b !== booster) : [...prev, booster]
    );
  };

  useEffect(() => {
    const isNanobanana = targetModel === 'nanobanana';
    
    // Style description
    let styleStr = '';
    if (stylePreset === 'photorealistic') {
      styleStr = isNanobanana 
        ? 'A high-fidelity photorealistic photograph, showing natural textures and lifelike details'
        : 'photorealistic, highly detailed, raw photo, realistic textures';
    } else if (stylePreset === 'anime') {
      styleStr = isNanobanana
        ? 'A beautifully detailed anime illustration with vibrant colors and clean line-art'
        : 'detailed anime style, vibrant colors, line-art, anime aesthetic';
    } else if (stylePreset === 'digital-art') {
      styleStr = isNanobanana
        ? 'A stunning digital concept art illustration, trending on Artstation'
        : 'digital concept art, detailed illustration, trending on artstation';
    } else if (stylePreset === 'cyberpunk') {
      styleStr = isNanobanana
        ? 'A futuristic cyberpunk scene with glowing neon lights and high-tech cybernetic details'
        : 'cyberpunk aesthetic, glowing neon lights, futuristic city elements';
    } else if (stylePreset === 'fantasy') {
      styleStr = isNanobanana
        ? 'An epic fantasy painting, capturing a mystical atmosphere with ethereal glowing particles'
        : 'fantasy concept art, mystical atmosphere, ethereal glowing particles';
    } else if (stylePreset === 'cinematic') {
      styleStr = isNanobanana
        ? 'A dramatic cinematic film still, featuring high-production value and atmospheric depth'
        : 'cinematic film still, anamorphic lens, volumetric lighting';
    } else if (stylePreset === '3d-render') {
      styleStr = isNanobanana
        ? 'A detailed 3D render, showcasing clean raytraced highlights and intricate modeling'
        : '3d render, octane render, raytraced details, blender render';
    }

    // Lighting description
    let lightingStr = '';
    if (lighting === 'sunset-glow') {
      lightingStr = isNanobanana ? 'bathed in warm golden hour sunset lighting with soft shadows' : 'golden hour, warm sunset lighting, soft shadows';
    } else if (lighting === 'neon-glow') {
      lightingStr = isNanobanana ? 'illuminated by glowing neon colored lights' : 'neon lighting, vibrant colored glow, synthwave lights';
    } else if (lighting === 'volumetric') {
      lightingStr = isNanobanana ? 'enhanced by strong volumetric light beams breaking through atmospheric haze' : 'volumetric lighting, sun rays, atmospheric haze';
    } else if (lighting === 'studio') {
      lightingStr = isNanobanana ? 'lit using a professional studio key and fill lighting setup' : 'studio lighting, soft key light, professional studio portrait';
    } else if (lighting === 'low-light') {
      lightingStr = isNanobanana ? 'captured in moody low light with high-contrast shadows' : 'moody low light, dim lighting, high contrast shadows';
    }

    // Camera description
    let cameraStr = '';
    if (cameraLens === 'dslr-50mm') {
      cameraStr = isNanobanana ? 'using a DSLR camera with a 50mm f/1.8 lens creating a shallow depth of field' : 'captured with DSLR camera, 50mm f/1.8 lens, shallow depth of field';
    } else if (cameraLens === 'wide-angle') {
      cameraStr = isNanobanana ? 'taken on a wide-angle lens capturing a grand, expansive perspective' : 'wide angle lens, grand perspective, expansive shot';
    } else if (cameraLens === 'macro') {
      cameraStr = isNanobanana ? 'taken with a macro lens showing an extreme close-up with intense detail' : 'macro lens, extreme close-up, high detail focus';
    } else if (cameraLens === 'drone') {
      cameraStr = isNanobanana ? 'captured from an aerial drone top-down view' : 'aerial drone photography, top-down perspective, high altitude shot';
    } else if (cameraLens === 'POV') {
      cameraStr = isNanobanana ? 'shot in a first-person POV action-cam style' : 'first person POV shot, action camera perspective';
    }

    // Quality boosters
    const activeBoosters: string[] = [];
    if (qualityBoosters.includes('masterpiece')) {
      activeBoosters.push(isNanobanana ? 'masterpiece quality' : 'masterpiece, award-winning');
    }
    if (qualityBoosters.includes('cinematic-composition')) {
      activeBoosters.push(isNanobanana ? 'cinematically composed framing' : 'cinematic composition, rule of thirds');
    }
    if (qualityBoosters.includes('intricate-textures')) {
      activeBoosters.push(isNanobanana ? 'intricate lifelike textures' : 'intricate details, hyper-detailed textures');
    }
    if (qualityBoosters.includes('sharp-focus')) {
      activeBoosters.push(isNanobanana ? 'rendered in sharp crisp focus' : 'sharp focus, crisp details');
    }

    // Mood description
    let moodStr = '';
    if (mood.trim()) {
      moodStr = isNanobanana ? `with a ${mood.trim()} mood` : `${mood.trim()} atmosphere`;
    }

    // Construct final prompt
    let finalPrompt = '';
    if (isNanobanana) {
      // Natural language structure for Nanobanana / Gemini Flash Image node
      let parts = [];
      parts.push(`${styleStr} depicting ${subject.trim()}.`);
      
      let elements = [];
      if (lightingStr) elements.push(lightingStr);
      if (cameraStr) elements.push(cameraStr);
      if (moodStr) elements.push(moodStr);
      
      if (elements.length > 0) {
        parts.push(`The scene is ${elements.join(', ')}.`);
      }

      if (activeBoosters.length > 0) {
        parts.push(`The image features ${activeBoosters.join(' and ')}.`);
      }

      if (aspectRatio && aspectRatio !== '1:1') {
        parts.push(`Formatted in a ${aspectRatio} aspect ratio.`);
      }

      if (customModifiers.trim()) {
        parts.push(customModifiers.trim());
      }

      finalPrompt = parts.join(' ');
    } else {
      // Tag salad structure for Stable Diffusion
      let tags = [];
      tags.push(styleStr);
      tags.push(subject.trim());
      if (lightingStr) tags.push(lightingStr);
      if (cameraStr) tags.push(cameraStr);
      if (moodStr) tags.push(moodStr);
      activeBoosters.forEach(b => tags.push(b));
      if (aspectRatio) tags.push(`aspect ratio ${aspectRatio}`);
      if (customModifiers.trim()) tags.push(customModifiers.trim());
      
      finalPrompt = tags.filter(Boolean).join(', ');
    }

    setPositiveOutput(finalPrompt);
  }, [subject, targetModel, stylePreset, aspectRatio, lighting, cameraLens, mood, qualityBoosters, customModifiers]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Model Target Tab */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span className="form-label">Target Engine / Model</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              className={`btn ${targetModel === 'nanobanana' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTargetModel('nanobanana')}
            >
              🍌 ComfyUI Nano Banana (Gemini)
            </button>
            <button
              className={`btn ${targetModel === 'stable-diffusion' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTargetModel('stable-diffusion')}
            >
              🌌 Stable Diffusion (SDXL / SD3)
            </button>
          </div>
          <span className="form-label-desc" style={{ marginTop: '0.15rem' }}>
            {targetModel === 'nanobanana'
              ? 'Optimizes for natural, grammatically rich descriptions preferred by Google Gemini Flash API.'
              : 'Optimizes for tag-separated, comma-split descriptors standard for Stable Diffusion models.'}
          </span>
        </div>

        {/* Core Subject */}
        <div className="form-group">
          <label className="form-label">Core Subject Description</label>
          <textarea
            className="form-input-text"
            rows={3}
            placeholder="Describe the main subject, actions, or scene elements..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        {/* Style Presets Grid */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Style Presets</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
            {presets.styles.map((s) => (
              <button
                key={s.id}
                className={`btn ${stylePreset === s.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStylePreset(s.id)}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.6rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.1rem',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Grid selectors */}
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Lighting Style</label>
            <select
              className="form-input-text"
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {presets.lighting.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Camera & Lens</label>
            <select
              className="form-input-text"
              value={cameraLens}
              onChange={(e) => setCameraLens(e.target.value)}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              {presets.camera.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Aspect Ratio</label>
            <select
              className="form-input-text"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="1:1">1:1 (Square - Avatars)</option>
              <option value="16:9">16:9 (Landscape - Desktop)</option>
              <option value="9:16">9:16 (Portrait - Phone)</option>
              <option value="4:3">4:3 (Classic TV)</option>
              <option value="21:9">21:9 (Ultrawide Cinematic)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mood / Atmosphere</label>
            <input
              type="text"
              className="form-input-text"
              placeholder="e.g. ethereal, eerie, joyous"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            />
          </div>
        </div>

        {/* Quality Boosters Checkboxes */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Quality & Detail Boosters</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { id: 'masterpiece', label: '🏆 Masterpiece Grade' },
              { id: 'cinematic-composition', label: '🎬 Cinematic Composition' },
              { id: 'intricate-textures', label: '🔬 Intricate Textures' },
              { id: 'sharp-focus', label: '🔍 Sharp Focus' },
            ].map((b) => (
              <label
                key={b.id}
                className="form-checkbox-label"
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: qualityBoosters.includes(b.id) ? 'var(--bg-secondary)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  className="form-checkbox"
                  style={{ width: '16px', height: '16px' }}
                  checked={qualityBoosters.includes(b.id)}
                  onChange={() => toggleBooster(b.id)}
                />
                {b.label}
              </label>
            ))}
          </div>
        </div>

        {/* Custom Modifiers */}
        <div className="form-group">
          <label className="form-label">Custom Modifiers (Suffix)</label>
          <input
            type="text"
            className="form-input-text"
            placeholder="Add custom trigger tags or specific artist styles..."
            value={customModifiers}
            onChange={(e) => setCustomModifiers(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel output-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Positive Prompt */}
        <div>
          <div className="output-header">
            <span className="output-title">Generated Positive Prompt</span>
            <button className="btn btn-primary btn-icon-label" onClick={() => copyPos(positiveOutput)}>
              {copiedPos ? <Check size={16} /> : <Copy size={16} />}
              {copiedPos ? 'Copied' : 'Copy Prompt'}
            </button>
          </div>
          <div className="output-display" style={{ minHeight: '130px', fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
            {positiveOutput}
          </div>
        </div>

        {/* Stable Diffusion Negative Prompt (Conditional) */}
        {targetModel === 'stable-diffusion' && (
          <div>
            <div className="output-header">
              <span className="output-title">Negative Prompt (SD only)</span>
              <button className="btn btn-secondary btn-icon-label" onClick={() => copyNeg(negativePrompt)}>
                {copiedNeg ? <Check size={16} /> : <Copy size={16} />}
                {copiedNeg ? 'Copied' : 'Copy Neg'}
              </button>
            </div>
            <textarea
              className="form-input-text"
              rows={3}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              style={{ fontSize: '0.85rem', fontFamily: 'monospace', resize: 'vertical', background: 'var(--bg-primary)' }}
            />
          </div>
        )}

        {/* Info node / tip */}
        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            <Sparkles size={16} style={{ marginTop: '0.15rem' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>ComfyUI Nano Banana Tip</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <strong>Google Gemini Flash (Nano Banana)</strong> understands language semantically. Instead of using disconnected keyword lists (e.g. <code>photo, high quality, 4k</code>), write in structured natural English paragraphs to guide the model\'s spatial layout, style consistency, and lighting details.
          </p>
        </div>
      </div>
    </div>
  );
}
