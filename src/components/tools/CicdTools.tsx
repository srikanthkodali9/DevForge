import { useState, useEffect } from 'react';
import { Copy, Check, Download, Settings } from 'lucide-react';
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
// 1. GITHUB ACTIONS BUILDER
// ----------------------------------------------------
export function GithubActionsBuilder() {
  const [wfName, setWfName] = useState('CI Pipeline');
  const [triggerPush, setTriggerPush] = useState(true);
  const [triggerPR, setTriggerPR] = useState(true);
  const [branchName, setBranchName] = useState('main');
  const [runner, setRunner] = useState('ubuntu-latest');
  const [langType, setLangType] = useState<'node' | 'python' | 'go'>('node');
  const [langVersion, setLangVersion] = useState('20');
  
  // Pipeline Steps
  const [runLint, setRunLint] = useState(true);
  const [runTest, setRunTest] = useState(true);
  const [dockerBuild, setDockerBuild] = useState(false);
  const [dockerRepo, setDockerRepo] = useState('username/app-name');
  
  const [yamlOutput, setYamlOutput] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    const onTrigger: any = {};
    if (triggerPush) {
      onTrigger.push = {
        branches: [branchName]
      };
    }
    if (triggerPR) {
      onTrigger.pull_request = {
        branches: [branchName]
      };
    }

    const steps: any[] = [
      { name: 'Checkout code', uses: 'actions/checkout@v4' }
    ];

    if (langType === 'node') {
      steps.push({
        name: 'Set up Node.js',
        uses: 'actions/setup-node@v4',
        with: {
          'node-version': langVersion,
          cache: 'npm'
        }
      });
      steps.push({ name: 'Install dependencies', run: 'npm ci' });
      if (runLint) steps.push({ name: 'Run linter', run: 'npm run lint' });
      if (runTest) steps.push({ name: 'Run unit tests', run: 'npm test' });
    } else if (langType === 'python') {
      steps.push({
        name: 'Set up Python',
        uses: 'actions/setup-python@v5',
        with: {
          'python-version': langVersion,
          cache: 'pip'
        }
      });
      steps.push({ name: 'Install dependencies', run: 'pip install -r requirements.txt' });
      if (runLint) steps.push({ name: 'Run linter', run: 'flake8 .' });
      if (runTest) steps.push({ name: 'Run unit tests', run: 'pytest' });
    } else if (langType === 'go') {
      steps.push({
        name: 'Set up Go',
        uses: 'actions/setup-go@v5',
        with: {
          'go-version': langVersion,
          cache: true
        }
      });
      steps.push({ name: 'Install dependencies', run: 'go get -v ./...' });
      if (runLint) steps.push({ name: 'Run linter', run: 'go vet ./...' });
      if (runTest) steps.push({ name: 'Run unit tests', run: 'go test ./...' });
    }

    if (dockerBuild) {
      steps.push({
        name: 'Log in to Docker Hub',
        uses: 'docker/login-action@v3',
        with: {
          username: '${{ secrets.DOCKER_USERNAME }}',
          password: '${{ secrets.DOCKER_PASSWORD }}'
        }
      });
      steps.push({
        name: 'Build and push Docker image',
        uses: 'docker/build-push-action@v5',
        with: {
          context: '.',
          push: true,
          tags: `${dockerRepo}:latest, \${{ github.sha }}`
        }
      });
    }

    const workflowObj = {
      name: wfName,
      on: onTrigger,
      jobs: {
        build: {
          'runs-on': runner,
          steps: steps
        }
      }
    };

    setYamlOutput(yaml.dump(workflowObj, { indent: 2 }));
  }, [wfName, triggerPush, triggerPR, branchName, runner, langType, langVersion, runLint, runTest, dockerBuild, dockerRepo]);

  const handleDownload = () => {
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'main.yml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Workflow Name</label>
            <input type="text" className="form-input-text" value={wfName} onChange={(e) => setWfName(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Target Runner OS</label>
            <select className="form-input-select" value={runner} onChange={(e) => setRunner(e.target.value)}>
              <option value="ubuntu-latest">Ubuntu Latest (Linux)</option>
              <option value="windows-latest">Windows Latest</option>
              <option value="macos-latest">macOS Latest</option>
            </select>
          </div>
        </div>

        <div className="form-group k8s-form-section">
          <div className="k8s-form-section-title">Trigger Events</div>
          <div className="form-row">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={triggerPush} onChange={(e) => setTriggerPush(e.target.checked)} />
              On Push
            </label>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={triggerPR} onChange={(e) => setTriggerPR(e.target.checked)} />
              On Pull Request
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Branch:</span>
              <input type="text" className="form-input-text" style={{ padding: '0.35rem 0.5rem', width: '120px' }} value={branchName} onChange={(e) => setBranchName(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="tool-inputs-grid tool-inputs-grid-2 k8s-form-section">
          <div className="form-group">
            <label className="form-label">Language Runtime</label>
            <select className="form-input-select" value={langType} onChange={(e) => {
              const val = e.target.value as any;
              setLangType(val);
              setLangVersion(val === 'node' ? '20' : val === 'python' ? '3.11' : '1.21');
            }}>
              <option value="node">Node.js (JavaScript/TypeScript)</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Runtime Version</label>
            {langType === 'node' && (
              <select className="form-input-select" value={langVersion} onChange={(e) => setLangVersion(e.target.value)}>
                <option value="22">Node 22 (Current)</option>
                <option value="20">Node 20 (LTS)</option>
                <option value="18">Node 18 (Maintenance)</option>
              </select>
            )}
            {langType === 'python' && (
              <select className="form-input-select" value={langVersion} onChange={(e) => setLangVersion(e.target.value)}>
                <option value="3.12">Python 3.12</option>
                <option value="3.11">Python 3.11</option>
                <option value="3.10">Python 3.10</option>
              </select>
            )}
            {langType === 'go' && (
              <select className="form-input-select" value={langVersion} onChange={(e) => setLangVersion(e.target.value)}>
                <option value="1.22">Go 1.22</option>
                <option value="1.21">Go 1.21</option>
                <option value="1.20">Go 1.20</option>
              </select>
            )}
          </div>
        </div>

        <div className="form-group k8s-form-section">
          <div className="k8s-form-section-title">Build & Verification Steps</div>
          <div className="form-row">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runLint} onChange={(e) => setRunLint(e.target.checked)} />
              Run Linter / Verification
            </label>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runTest} onChange={(e) => setRunTest(e.target.checked)} />
              Run Unit Tests
            </label>
            <label className="form-checkbox-label" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
              <input type="checkbox" className="form-checkbox" checked={dockerBuild} onChange={(e) => setDockerBuild(e.target.checked)} />
              Build & Push Docker Image
            </label>
          </div>
          {dockerBuild && (
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Docker Registry Repository</label>
              <input type="text" className="form-input-text" value={dockerRepo} onChange={(e) => setDockerRepo(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">YAML Github Actions Workflow</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-icon-label" onClick={() => copy(yamlOutput)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="btn btn-primary btn-icon-label" onClick={handleDownload}>
              <Download size={16} /> Download Workflow
            </button>
          </div>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem' }}>
          {yamlOutput}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. ARGO GENERATOR
// ----------------------------------------------------
export function ArgoGenerator() {
  const [activeTab, setActiveTab] = useState<'app' | 'project' | 'workflow'>('app');
  const [yamlOutput, setYamlOutput] = useState('');
  const { copied, copy } = useCopy();

  // Application States
  const [appName, setAppName] = useState('my-web-app');
  const [appNamespace, setAppNamespace] = useState('argocd');
  const [appProject, setAppProject] = useState('default');
  const [repoUrl, setRepoUrl] = useState('https://github.com/my-org/my-k8s-repo.git');
  const [targetRevision, setTargetRevision] = useState('HEAD');
  const [appPath, setAppPath] = useState('deploy/environments/staging');
  const [destCluster, setDestCluster] = useState('https://kubernetes.default.svc');
  const [destNamespace, setDestNamespace] = useState('default');
  const [autoSync, setAutoSync] = useState(true);

  // AppProject States
  const [projName, setProjName] = useState('marketing-project');
  const [projNamespace, setProjNamespace] = useState('argocd');
  const [projRepo, setProjRepo] = useState('*');
  const [projCluster, setProjCluster] = useState('*');

  // Workflow States
  const [wfName, setWfName] = useState('build-pipeline');
  const [wfNamespace, setWfNamespace] = useState('argo');
  const [wfImage, setWfImage] = useState('node:20-alpine');
  const [wfScript, setWfScript] = useState('npm install && npm run build');

  useEffect(() => {
    let yamlStr = '';
    if (activeTab === 'app') {
      const appObj: any = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: {
          name: appName,
          namespace: appNamespace
        },
        spec: {
          project: appProject,
          source: {
            repoURL: repoUrl,
            targetRevision: targetRevision,
            path: appPath
          },
          destination: {
            server: destCluster,
            namespace: destNamespace
          }
        }
      };

      if (autoSync) {
        appObj.spec.syncPolicy = {
          automated: {
            prune: true,
            selfHeal: true
          }
        };
      }

      yamlStr = yaml.dump(appObj, { indent: 2 });
    } else if (activeTab === 'project') {
      const projObj = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'AppProject',
        metadata: {
          name: projName,
          namespace: projNamespace
        },
        spec: {
          description: `ArgoCD AppProject policy settings for ${projName}`,
          sourceRepos: [projRepo],
          destinations: [
            {
              namespace: '*',
              server: projCluster
            }
          ],
          clusterResourceWhitelist: [
            {
              group: '*',
              kind: '*'
            }
          ]
        }
      };
      yamlStr = yaml.dump(projObj, { indent: 2 });
    } else if (activeTab === 'workflow') {
      const wfObj = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Workflow',
        metadata: {
          generateName: `${wfName}-`,
          namespace: wfNamespace
        },
        spec: {
          entrypoint: 'pipeline-runner',
          templates: [
            {
              name: 'pipeline-runner',
              container: {
                image: wfImage,
                command: ['sh', '-c'],
                args: [wfScript]
              }
            }
          ]
        }
      };
      yamlStr = yaml.dump(wfObj, { indent: 2 });
    }
    setYamlOutput(yamlStr);
  }, [
    activeTab,
    appName,
    appNamespace,
    appProject,
    repoUrl,
    targetRevision,
    appPath,
    destCluster,
    destNamespace,
    autoSync,
    projName,
    projNamespace,
    projRepo,
    projCluster,
    wfName,
    wfNamespace,
    wfImage,
    wfScript
  ]);

  const handleDownload = () => {
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `argo-${activeTab}-${Date.now()}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          {[
            { id: 'app', name: 'ArgoCD Application' },
            { id: 'project', name: 'ArgoCD Project' },
            { id: 'workflow', name: 'Argo Workflow' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <Settings size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* 1. ARGOCD APPLICATION */}
        {activeTab === 'app' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Application Name</label>
              <input type="text" className="form-input-text" value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Argo Namespace</label>
              <input type="text" className="form-input-text" value={appNamespace} onChange={(e) => setAppNamespace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">ArgoCD Project</label>
              <input type="text" className="form-input-text" value={appProject} onChange={(e) => setAppProject(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Git Repo URL</label>
              <input type="text" className="form-input-text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Revision (Branch/Tag)</label>
              <input type="text" className="form-input-text" value={targetRevision} onChange={(e) => setTargetRevision(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Path to Manifests</label>
              <input type="text" className="form-input-text" value={appPath} onChange={(e) => setAppPath(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Cluster URL</label>
              <input type="text" className="form-input-text" value={destCluster} onChange={(e) => setDestCluster(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Namespace</label>
              <input type="text" className="form-input-text" value={destNamespace} onChange={(e) => setDestNamespace(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-checkbox-label">
                <input type="checkbox" className="form-checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />
                Enable Automated Sync (with Pruning & Self-Healing policies)
              </label>
            </div>
          </div>
        )}

        {/* 2. ARGOCD PROJECT */}
        {activeTab === 'project' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input type="text" className="form-input-text" value={projName} onChange={(e) => setProjName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Namespace</label>
              <input type="text" className="form-input-text" value={projNamespace} onChange={(e) => setProjNamespace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Allowed Source Repository (e.g. *, or repo URL)</label>
              <input type="text" className="form-input-text" value={projRepo} onChange={(e) => setProjRepo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Destination Cluster URL (e.g. *, or server endpoint)</label>
              <input type="text" className="form-input-text" value={projCluster} onChange={(e) => setProjCluster(e.target.value)} />
            </div>
          </div>
        )}

        {/* 3. ARGO WORKFLOW */}
        {activeTab === 'workflow' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Workflow Template Name</label>
              <input type="text" className="form-input-text" value={wfName} onChange={(e) => setWfName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Namespace</label>
              <input type="text" className="form-input-text" value={wfNamespace} onChange={(e) => setWfNamespace(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Execution Container Image</label>
              <input type="text" className="form-input-text" value={wfImage} onChange={(e) => setWfImage(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Shell Commands to Execute</label>
              <textarea className="form-input-textarea" value={wfScript} onChange={(e) => setWfScript(e.target.value)} style={{ minHeight: '100px' }} />
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Argo Resource YAML</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-icon-label" onClick={() => copy(yamlOutput)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="btn btn-primary btn-icon-label" onClick={handleDownload}>
              <Download size={16} /> Download YAML
            </button>
          </div>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem' }}>
          {yamlOutput}
        </div>
      </div>
    </div>
  );
}
