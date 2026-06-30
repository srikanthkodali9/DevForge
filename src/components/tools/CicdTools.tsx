import { useState, useEffect } from 'react';
import { Copy, Check, Download, Settings, Info } from 'lucide-react';
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

// ----------------------------------------------------
// 3. GITLAB CI/CD PIPELINE GENERATOR (.gitlab-ci.yml)
// ----------------------------------------------------
export function GitLabCiBuilder() {
  const [baseImage, setBaseImage] = useState('node:20-alpine');
  const [triggerBranch, setTriggerBranch] = useState('main');
  const [runLint, setRunLint] = useState(true);
  const [runTest, setRunTest] = useState(true);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  
  // Docker Push
  const [dockerBuild, setDockerBuild] = useState(false);
  const [registry, setRegistry] = useState('registry.gitlab.com');
  const [imagePath, setImagePath] = useState('my-group/my-project');

  // Deploy Stage
  const [runDeploy, setRunDeploy] = useState(false);
  const [deployEnv, setDeployEnv] = useState('production');
  const [deployScript, setDeployScript] = useState('echo "Deploying application to production server..."');

  const [yamlOutput, setYamlOutput] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    let doc = `# GitLab CI/CD Pipeline Configuration (.gitlab-ci.yml)\n`;
    
    // Global image
    doc += `image: ${baseImage}\n\n`;

    // Cache definition
    if (cacheEnabled) {
      doc += `cache:\n`;
      doc += `  key: \${CI_COMMIT_REF_SLUG}\n`;
      doc += `  paths:\n`;
      if (baseImage.startsWith('node')) {
        doc += `    - .npm/\n`;
        doc += `    - node_modules/\n`;
      } else if (baseImage.startsWith('python')) {
        doc += `    - .cache/pip/\n`;
      } else if (baseImage.startsWith('golang')) {
        doc += `    - .go-cache/\n`;
      } else {
        doc += `    - vendor/\n`;
      }
      doc += `\n`;
    }

    // Stages list
    const activeStages = ['build'];
    if (runLint) activeStages.push('lint');
    if (runTest) activeStages.push('test');
    if (dockerBuild) activeStages.push('package');
    if (runDeploy) activeStages.push('deploy');

    doc += `stages:\n`;
    activeStages.forEach((s) => {
      doc += `  - ${s}\n`;
    });
    doc += `\n`;

    // Before script
    if (cacheEnabled && baseImage.startsWith('node')) {
      doc += `before_script:\n`;
      doc += `  - npm ci --cache .npm --prefer-offline\n\n`;
    }

    // Build stage
    doc += `build-job:\n`;
    doc += `  stage: build\n`;
    doc += `  script:\n`;
    if (baseImage.startsWith('node')) {
      doc += `    - npm run build\n`;
      doc += `  artifacts:\n`;
      doc += `    paths:\n`;
      doc += `      - dist/\n`;
      doc += `    expire_in: 1 week\n`;
    } else if (baseImage.startsWith('python')) {
      doc += `    - pip install -r requirements.txt\n`;
    } else if (baseImage.startsWith('golang')) {
      doc += `    - go build -v -o app\n`;
      doc += `  artifacts:\n`;
      doc += `    paths:\n`;
      doc += `      - app\n`;
    } else {
      doc += `    - echo "Compiling application..."\n`;
    }
    doc += `  rules:\n`;
    doc += `    - if: $CI_COMMIT_BRANCH == "${triggerBranch}"\n\n`;

    // Lint stage
    if (runLint) {
      doc += `lint-job:\n`;
      doc += `  stage: lint\n`;
      doc += `  script:\n`;
      if (baseImage.startsWith('node')) {
        doc += `    - npm run lint\n`;
      } else if (baseImage.startsWith('python')) {
        doc += `    - pip install flake8 && flake8 .\n`;
      } else if (baseImage.startsWith('golang')) {
        doc += `    - go vet ./...\n`;
      } else {
        doc += `    - echo "Running linter checks..."\n`;
      }
      doc += `  rules:\n`;
      doc += `    - if: $CI_COMMIT_BRANCH == "${triggerBranch}"\n\n`;
    }

    // Test stage
    if (runTest) {
      doc += `test-job:\n`;
      doc += `  stage: test\n`;
      doc += `  script:\n`;
      if (baseImage.startsWith('node')) {
        doc += `    - npm test\n`;
      } else if (baseImage.startsWith('python')) {
        doc += `    - pip install pytest && pytest\n`;
      } else if (baseImage.startsWith('golang')) {
        doc += `    - go test -v ./...\n`;
      } else {
        doc += `    - echo "Running unit tests..."\n`;
      }
      doc += `  rules:\n`;
      doc += `    - if: $CI_COMMIT_BRANCH == "${triggerBranch}"\n\n`;
    }

    // Package stage (Docker build)
    if (dockerBuild) {
      doc += `docker-publish:\n`;
      doc += `  stage: package\n`;
      doc += `  image: docker:24-git\n`;
      doc += `  services:\n`;
      doc += `    - docker:24-dind\n`;
      doc += `  variables:\n`;
      doc += `    DOCKER_TLS_CERTDIR: "/certs"\n`;
      doc += `  before_script: []\n`; // Override global npm ci
      doc += `  script:\n`;
      doc += `    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD ${registry}\n`;
      doc += `    - docker build -t ${registry}/${imagePath}:\${CI_COMMIT_SHA} -t ${registry}/${imagePath}:latest .\n`;
      doc += `    - docker push ${registry}/${imagePath}:\${CI_COMMIT_SHA}\n`;
      doc += `    - docker push ${registry}/${imagePath}:latest\n`;
      doc += `  rules:\n`;
      doc += `    - if: $CI_COMMIT_BRANCH == "${triggerBranch}"\n\n`;
    }

    // Deploy stage
    if (runDeploy) {
      doc += `deploy-job:\n`;
      doc += `  stage: deploy\n`;
      doc += `  environment:\n`;
      doc += `    name: ${deployEnv}\n`;
      doc += `    url: https://${deployEnv}.mycompany.com\n`;
      doc += `  before_script: []\n`; // Override global npm ci
      doc += `  script:\n`;
      deployScript.split('\n').forEach((line) => {
        if (line.trim()) doc += `    - ${line.trim()}\n`;
      });
      doc += `  rules:\n`;
      doc += `    - if: $CI_COMMIT_BRANCH == "${triggerBranch}"\n`;
    }

    setYamlOutput(doc);
  }, [baseImage, triggerBranch, runLint, runTest, cacheEnabled, dockerBuild, registry, imagePath, runDeploy, deployEnv, deployScript]);

  const handleDownload = () => {
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '.gitlab-ci.yml';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 className="k8s-form-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>GitLab CI Configuration</h3>
        
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Base Docker Image</label>
            <select
              className="form-input-text"
              value={baseImage}
              onChange={(e) => setBaseImage(e.target.value)}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="node:20-alpine">Node.js 20 (Alpine)</option>
              <option value="python:3.11-slim">Python 3.11 (Slim)</option>
              <option value="golang:1.22-alpine">Go 1.22 (Alpine)</option>
              <option value="alpine:latest">Alpine Linux (Minimal)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target Trigger Branch</label>
            <input type="text" className="form-input-text" value={triggerBranch} onChange={(e) => setTriggerBranch(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={cacheEnabled} onChange={(e) => setCacheEnabled(e.target.checked)} />
              Enable dependency caching (Node modules, pip caches, etc.)
            </label>
          </div>

          <div className="form-group">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runLint} onChange={(e) => setRunLint(e.target.checked)} />
              Run Linter checks (lint-job)
            </label>
          </div>
          <div className="form-group">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runTest} onChange={(e) => setRunTest(e.target.checked)} />
              Run Unit Tests (test-job)
            </label>
          </div>
        </div>

        <div className="form-group k8s-form-section" style={{ padding: 0, border: 'none', margin: 0 }}>
          <span className="k8s-form-section-title">Docker Registry Publishing (GitLab Container Registry)</span>
        </div>

        <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginTop: '-0.5rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={dockerBuild} onChange={(e) => setDockerBuild(e.target.checked)} />
              Build & Push Docker Image in Pipeline
            </label>
          </div>
          
          {dockerBuild && (
            <>
              <div className="form-group">
                <label className="form-label">Registry Host</label>
                <input type="text" className="form-input-text" value={registry} onChange={(e) => setRegistry(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Image Path / Namespace</label>
                <input type="text" className="form-input-text" value={imagePath} onChange={(e) => setImagePath(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="form-group k8s-form-section" style={{ padding: 0, border: 'none', margin: 0 }}>
          <span className="k8s-form-section-title">Deployment Stage Settings</span>
        </div>

        <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginTop: '-0.5rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runDeploy} onChange={(e) => setRunDeploy(e.target.checked)} />
              Add Deploy stage to Pipeline
            </label>
          </div>

          {runDeploy && (
            <>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Deployment Environment</label>
                <input type="text" className="form-input-text" value={deployEnv} onChange={(e) => setDeployEnv(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Deploy Script Commands (one command per line)</label>
                <textarea
                  className="form-input-textarea"
                  value={deployScript}
                  onChange={(e) => setDeployScript(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Generated .gitlab-ci.yml</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-icon-label" onClick={() => copy(yamlOutput)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="btn btn-primary btn-icon-label" onClick={handleDownload}>
              <Download size={16} /> Download
            </button>
          </div>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          {yamlOutput}
        </div>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            <Info size={16} style={{ marginTop: '0.15rem' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>GitLab CI Tip</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Ensure your GitLab Runners are configured with the correct executor (e.g. Docker executor) to run containerized stages.
          </p>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. JENKINS DECLARATIVE PIPELINE GENERATOR (Jenkinsfile)
// ----------------------------------------------------
export function JenkinsfileBuilder() {
  const [agentType, setAgentType] = useState<'any' | 'docker' | 'none'>('any');
  const [dockerImage, setDockerImage] = useState('node:20-alpine');
  const [environmentVars, setEnvironmentVars] = useState('APP_ENV = "production"\nPORT = "8080"');
  
  const [runLint, setRunLint] = useState(true);
  const [runTest, setRunTest] = useState(true);
  const [lintCommand, setLintCommand] = useState('npm run lint');
  const [testCommand, setTestCommand] = useState('npm test');
  const [buildCommand, setBuildCommand] = useState('npm run build');

  const [dockerBuild, setDockerBuild] = useState(false);
  const [dockerImageName, setDockerImageName] = useState('my-org/my-app');
  const [dockerCredentialId, setDockerCredentialId] = useState('docker-hub-credentials');

  const [runDeploy, setRunDeploy] = useState(false);
  const [deployCommand, setDeployCommand] = useState('ssh deploy@prod-server "docker service update --image my-app:latest my-service"');

  const [notifyFailure, setNotifyFailure] = useState(true);
  const [notifyChannel, setNotifyChannel] = useState('#devops-alerts');

  const [groovyOutput, setGroovyOutput] = useState('');
  const { copied, copy } = useCopy();

  useEffect(() => {
    let code = `// Jenkins Declarative Pipeline (Jenkinsfile)\n`;
    code += `pipeline {\n`;
    
    // Agent
    if (agentType === 'any') {
      code += `    agent any\n\n`;
    } else if (agentType === 'docker') {
      code += `    agent {\n`;
      code += `        docker {\n`;
      code += `            image '${dockerImage}'\n`;
      code += `            args '-v /var/run/docker.sock:/var/run/docker.sock'\n`;
      code += `        }\n`;
      code += `    }\n\n`;
    } else {
      code += `    agent none\n\n`;
    }

    // Environment
    if (environmentVars.trim()) {
      code += `    environment {\n`;
      environmentVars.split('\n').forEach((line) => {
        if (line.trim()) {
          code += `        ${line.trim()}\n`;
        }
      });
      code += `    }\n\n`;
    }

    // Stages
    code += `    stages {\n`;

    // Build stage
    code += `        stage('Build') {\n`;
    if (agentType === 'none') {
      code += `            agent {\n`;
      code += `                docker {\n`;
      code += `                    image '${dockerImage}'\n`;
      code += `                }\n`;
      code += `            }\n`;
    }
    code += `            steps {\n`;
    code += `                echo 'Building application...'\n`;
    if (dockerImage.startsWith('node')) {
      code += `                sh 'npm ci'\n`;
      code += `                sh '${buildCommand}'\n`;
    } else if (dockerImage.startsWith('python')) {
      code += `                sh 'pip install -r requirements.txt'\n`;
    } else if (dockerImage.startsWith('golang')) {
      code += `                sh 'go build -v -o app'\n`;
    } else {
      code += `                sh 'make build'\n`;
    }
    code += `            }\n`;
    code += `        }\n\n`;

    // Lint stage
    if (runLint) {
      code += `        stage('Lint') {\n`;
      if (agentType === 'none') {
        code += `            agent {\n`;
        code += `                docker {\n`;
        code += `                    image '${dockerImage}'\n`;
        code += `                }\n`;
        code += `            }\n`;
      }
      code += `            steps {\n`;
      code += `                echo 'Running lint analysis...'\n`;
      code += `                sh '${lintCommand}'\n`;
      code += `            }\n`;
      code += `        }\n\n`;
    }

    // Test stage
    if (runTest) {
      code += `        stage('Test') {\n`;
      if (agentType === 'none') {
        code += `            agent {\n`;
        code += `                docker {\n`;
        code += `                    image '${dockerImage}'\n`;
        code += `                }\n`;
        code += `            }\n`;
      }
      code += `            steps {\n`;
      code += `                echo 'Running unit testing...'\n`;
      code += `                sh '${testCommand}'\n`;
      code += `            }\n`;
      code += `        }\n\n`;
    }

    // Docker build/push stage
    if (dockerBuild) {
      code += `        stage('Docker Publish') {\n`;
      code += `            steps {\n`;
      code += `                script {\n`;
      code += `                    docker.withRegistry('', '${dockerCredentialId}') {\n`;
      code += `                        def customImage = docker.build("${dockerImageName}:\${env.BUILD_ID}")\n`;
      code += `                        customImage.push()\n`;
      code += `                        customImage.push('latest')\n`;
      code += `                    }\n`;
      code += `                }\n`;
      code += `            }\n`;
      code += `        }\n\n`;
    }

    // Deploy stage
    if (runDeploy) {
      code += `        stage('Deploy') {\n`;
      code += `            steps {\n`;
      code += `                echo 'Executing deployment scripts...'\n`;
      code += `                sh '${deployCommand}'\n`;
      code += `            }\n`;
      code += `        }\n\n`;
    }

    code += `    }\n\n`; // End stages

    // Post actions
    code += `    post {\n`;
    code += `        always {\n`;
    code += `            cleanWs()\n`;
    code += `        }\n`;
    if (notifyFailure) {
      code += `        failure {\n`;
      code += `            slackSend channel: '${notifyChannel}',\n`;
      code += `                      color: '#F44336',\n`;
      code += `                      message: "FAILED: Job '\${env.JOB_NAME}' (\${env.BUILD_NUMBER}) (\${env.BUILD_URL})"\n`;
      code += `        }\n`;
    }
    code += `    }\n`; // End post

    code += `}\n`; // End pipeline

    setGroovyOutput(code);
  }, [agentType, dockerImage, environmentVars, runLint, runTest, lintCommand, testCommand, buildCommand, dockerBuild, dockerImageName, dockerCredentialId, runDeploy, deployCommand, notifyFailure, notifyChannel]);

  const handleDownload = () => {
    const blob = new Blob([groovyOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Jenkinsfile';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 className="k8s-form-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>Jenkins Pipeline Configuration</h3>
        
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Jenkins Agent Executor</label>
            <select
              className="form-input-text"
              value={agentType}
              onChange={(e) => setAgentType(e.target.value as any)}
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="any">agent any (Any available agent)</option>
              <option value="docker">agent docker (Run stages in container)</option>
              <option value="none">agent none (Specify agent per stage)</option>
            </select>
          </div>

          {agentType === 'docker' && (
            <div className="form-group">
              <label className="form-label">Docker Build Agent Image</label>
              <input type="text" className="form-input-text" value={dockerImage} onChange={(e) => setDockerImage(e.target.value)} />
            </div>
          )}

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Environment Variables (one key=val pair per line)</label>
            <textarea
              className="form-input-textarea"
              value={environmentVars}
              onChange={(e) => setEnvironmentVars(e.target.value)}
              style={{ minHeight: '70px', resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Build Command</label>
            <input type="text" className="form-input-text" value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}></div>

          <div className="form-group">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runLint} onChange={(e) => setRunLint(e.target.checked)} />
              Add Lint stage
            </label>
          </div>

          {runLint && (
            <div className="form-group">
              <label className="form-label">Lint Command</label>
              <input type="text" className="form-input-text" value={lintCommand} onChange={(e) => setLintCommand(e.target.value)} />
            </div>
          )}

          <div className="form-group">
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runTest} onChange={(e) => setRunTest(e.target.checked)} />
              Add Test stage
            </label>
          </div>

          {runTest && (
            <div className="form-group">
              <label className="form-label">Test Command</label>
              <input type="text" className="form-input-text" value={testCommand} onChange={(e) => setTestCommand(e.target.value)} />
            </div>
          )}
        </div>

        <div className="form-group k8s-form-section" style={{ padding: 0, border: 'none', margin: 0 }}>
          <span className="k8s-form-section-title">Docker Build / Publish Stage</span>
        </div>

        <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginTop: '-0.5rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={dockerBuild} onChange={(e) => setDockerBuild(e.target.checked)} />
              Build & Push custom Docker image to registry
            </label>
          </div>

          {dockerBuild && (
            <>
              <div className="form-group">
                <label className="form-label">Registry Image Name</label>
                <input type="text" className="form-input-text" value={dockerImageName} onChange={(e) => setDockerImageName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Docker Credentials ID</label>
                <input type="text" className="form-input-text" value={dockerCredentialId} onChange={(e) => setDockerCredentialId(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="form-group k8s-form-section" style={{ padding: 0, border: 'none', margin: 0 }}>
          <span className="k8s-form-section-title">Deployment & Alerts</span>
        </div>

        <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginTop: '-0.5rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={runDeploy} onChange={(e) => setRunDeploy(e.target.checked)} />
              Add Deploy stage
            </label>
          </div>

          {runDeploy && (
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Deployment script command</label>
              <input type="text" className="form-input-text" value={deployCommand} onChange={(e) => setDeployCommand(e.target.value)} />
            </div>
          )}

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-checkbox-label">
              <input type="checkbox" className="form-checkbox" checked={notifyFailure} onChange={(e) => setNotifyFailure(e.target.checked)} />
              Send Slack notification on pipeline failure
            </label>
          </div>

          {notifyFailure && (
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Slack Notification Channel</label>
              <input type="text" className="form-input-text" value={notifyChannel} onChange={(e) => setNotifyChannel(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Generated Jenkinsfile</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-icon-label" onClick={() => copy(groovyOutput)}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="btn btn-primary btn-icon-label" onClick={handleDownload}>
              <Download size={16} /> Download
            </button>
          </div>
        </div>
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
          {groovyOutput}
        </div>
        
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
            <Info size={16} style={{ marginTop: '0.15rem' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Jenkins Pipeline Tip</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Place the generated <code>Jenkinsfile</code> at the root of your project directory and configure a "Pipeline from SCM" in Jenkins.
          </p>
        </div>
      </div>
    </div>
  );
}
