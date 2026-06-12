import { useState, useEffect } from 'react';
import { Copy, Check, Download, Layers, Terminal, ArrowRightLeft, Info } from 'lucide-react';
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

// Helper for Base64 encoding (Unicode-safe)
function utf8Btoa(str: string): string {
  try {
    return window.btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return 'Encoding Error';
  }
}

// ----------------------------------------------------
// 1. EXTENDED MANIFEST GENERATOR
// ----------------------------------------------------
export function K8sGenerator() {
  const [activeTab, setActiveTab] = useState<'deployment' | 'service' | 'rbac' | 'netpol' | 'ingress' | 'cronjob'>('deployment');
  const [yamlOutput, setYamlOutput] = useState('');
  const { copied, copy } = useCopy();

  // Deployment States
  const [depName, setDepName] = useState('web-app');
  const [depNamespace, setDepNamespace] = useState('default');
  const [depReplicas, setDepReplicas] = useState(3);
  const [depImage, setDepImage] = useState('nginx:latest');
  const [depPort, setDepPort] = useState(80);
  const [depCpuLimit, setDepCpuLimit] = useState('500m');
  const [depMemLimit, setDepMemLimit] = useState('512Mi');
  const [depCpuReq, setDepCpuReq] = useState('100m');
  const [depMemReq, setDepMemReq] = useState('128Mi');

  // Service States
  const [svcName, setSvcName] = useState('web-service');
  const [svcNamespace, setSvcNamespace] = useState('default');
  const [svcType, setSvcType] = useState('ClusterIP');
  const [svcPort, setSvcPort] = useState(80);
  const [svcTargetPort, setSvcTargetPort] = useState(80);
  const [svcNodePort, setSvcNodePort] = useState(30080);
  const [svcSelector, setSvcSelector] = useState('app: web-app');

  // RBAC States
  const [rbacType, setRbacType] = useState<'Role' | 'ClusterRole'>('Role');
  const [rbacName, setRbacName] = useState('pod-reader');
  const [rbacNamespace, setRbacNamespace] = useState('default');
  const [rbacSubject, setRbacSubject] = useState('read-pods-sa');
  const [rbacSubjectKind, setRbacSubjectKind] = useState('ServiceAccount');
  const [rbacResources, setRbacResources] = useState('pods,pods/log,services');
  const [rbacVerbs, setRbacVerbs] = useState({
    get: true,
    list: true,
    watch: true,
    create: false,
    update: false,
    patch: false,
    delete: false,
  });

  // NetworkPolicy States
  const [netName, setNetName] = useState('allow-db-ingress');
  const [netNamespace, setNetNamespace] = useState('default');
  const [netPodSelector, setNetPodSelector] = useState('role: db');
  const [netType, setNetType] = useState<'Ingress' | 'Egress' | 'Both'>('Ingress');
  const [netIngressSelector, setNetIngressSelector] = useState('app: backend');
  const [netIngressPort, setNetIngressPort] = useState(5432);

  // Ingress States
  const [ingName, setIngName] = useState('web-ingress');
  const [ingNamespace, setIngNamespace] = useState('default');
  const [ingHost, setIngHost] = useState('api.example.com');
  const [ingPath, setIngPath] = useState('/v1');
  const [ingService, setIngService] = useState('web-service');
  const [ingPort, setIngPort] = useState(80);
  const [ingTls, setIngTls] = useState(false);
  const [ingTlsSecret, setIngTlsSecret] = useState('web-tls-secret');
  const [ingCertManager, setIngCertManager] = useState(false);

  // CronJob States
  const [cronName, setCronName] = useState('db-backup');
  const [cronNamespace, setCronNamespace] = useState('default');
  const [cronSchedule, setCronSchedule] = useState('0 2 * * *');
  const [cronRestartPolicy, setCronRestartPolicy] = useState('OnFailure');
  const [cronConcurrency, setCronConcurrency] = useState('Forbid');
  const [cronImage, setCronImage] = useState('postgres:15-alpine');
  const [cronCommand, setCronCommand] = useState('pg_dump -h db-host -U root main_db');

  useEffect(() => {
    let yamlStr = '';
    if (activeTab === 'deployment') {
      yamlStr = `# Kubernetes Deployment manifest for ${depName}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${depName}
  namespace: ${depNamespace}
  labels:
    app: ${depName}
spec:
  replicas: ${depReplicas}
  selector:
    matchLabels:
      app: ${depName}
  template:
    metadata:
      labels:
        app: ${depName}
    spec:
      containers:
      - name: ${depName}-container
        image: ${depImage}
        ports:
        - containerPort: ${depPort}
        resources:
          limits:
            cpu: "${depCpuLimit}"
            memory: "${depMemLimit}"
          requests:
            cpu: "${depCpuReq}"
            memory: "${depMemReq}"
`;
    } else if (activeTab === 'service') {
      const selectors = svcSelector
        .split(',')
        .map((s) => s.split(':'))
        .filter((pair) => pair.length === 2);

      yamlStr = `# Kubernetes Service manifest for ${svcName}
apiVersion: v1
kind: Service
metadata:
  name: ${svcName}
  namespace: ${svcNamespace}
spec:
  type: ${svcType}
  ports:
  - port: ${svcPort}
    targetPort: ${svcTargetPort}
${svcType === 'NodePort' ? `    nodePort: ${svcNodePort}\n` : ''}  selector:
${selectors.map(([k, v]) => `    ${k.trim()}: "${v.trim()}"`).join('\n')}
`;
    } else if (activeTab === 'rbac') {
      const verbsList = Object.entries(rbacVerbs)
        .filter(([_, enabled]) => enabled)
        .map(([v]) => `"${v}"`)
        .join(', ');

      const resourcesList = rbacResources
        .split(',')
        .map((r) => `"${r.trim()}"`)
        .join(', ');

      const isCluster = rbacType === 'ClusterRole';

      yamlStr = `# Kubernetes RBAC Authorization manifest (${rbacType} & Binding)
apiVersion: rbac.authorization.k8s.io/v1
kind: ${rbacType}
metadata:
  name: ${rbacName}
${!isCluster ? `  namespace: ${rbacNamespace}\n` : ''}rules:
- apiGroups: [""]
  resources: [${resourcesList}]
  verbs: [${verbsList}]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ${rbacType === 'Role' ? 'RoleBinding' : 'ClusterRoleBinding'}
metadata:
  name: ${rbacName}-binding
${!isCluster ? `  namespace: ${rbacNamespace}\n` : ''}subjects:
- kind: ${rbacSubjectKind}
  name: ${rbacSubject}
${rbacSubjectKind === 'ServiceAccount' && !isCluster ? `  namespace: ${rbacNamespace}\n` : ''}roleRef:
  kind: ${rbacType}
  name: ${rbacName}
  apiGroup: rbac.authorization.k8s.io
`;
    } else if (activeTab === 'netpol') {
      const podLabels = netPodSelector.split(':');
      const podSelectorKey = podLabels[0]?.trim() || 'app';
      const podSelectorVal = podLabels[1]?.trim() || 'db';

      const ingressLabels = netIngressSelector.split(':');
      const ingSelectorKey = ingressLabels[0]?.trim() || 'app';
      const ingSelectorVal = ingressLabels[1]?.trim() || 'backend';

      yamlStr = `# Kubernetes NetworkPolicy manifest
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${netName}
  namespace: ${netNamespace}
spec:
  podSelector:
    matchLabels:
      ${podSelectorKey}: "${podSelectorVal}"
  policyTypes:
  - ${netType === 'Both' ? 'Ingress\n  - Egress' : netType}
${
  netType !== 'Egress'
    ? `  ingress:
  - from:
    - podSelector:
        matchLabels:
          ${ingSelectorKey}: "${ingSelectorVal}"
    ports:
    - protocol: TCP
      port: ${netIngressPort}
`
    : ''
}
`;
    } else if (activeTab === 'ingress') {
      yamlStr = `# Kubernetes Ingress Routing manifest
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${ingName}
  namespace: ${ingNamespace}
  annotations:
${ingCertManager ? `    kubernetes.io/ingress.class: "nginx"\n    cert-manager.io/cluster-issuer: "letsencrypt-prod"\n` : `    kubernetes.io/ingress.class: "nginx"\n`}spec:
${
  ingTls
    ? `  tls:
  - hosts:
    - "${ingHost}"
    secretName: "${ingTlsSecret}"
`
    : ''
}  rules:
  - host: "${ingHost}"
    http:
      paths:
      - path: ${ingPath}
        pathType: Prefix
        backend:
          service:
            name: ${ingService}
            port:
              number: ${ingPort}
`;
    } else if (activeTab === 'cronjob') {
      yamlStr = `# Kubernetes CronJob manifest
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${cronName}
  namespace: ${cronNamespace}
spec:
  schedule: "${cronSchedule}"
  concurrencyPolicy: ${cronConcurrency}
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ${cronName}-worker
            image: ${cronImage}
            command:
${cronCommand.split(/\s+/).map((word) => `            - "${word}"`).join('\n')}
          restartPolicy: ${cronRestartPolicy}
`;
    }
    setYamlOutput(yamlStr);
  }, [
    activeTab,
    depName,
    depNamespace,
    depReplicas,
    depImage,
    depPort,
    depCpuLimit,
    depMemLimit,
    depCpuReq,
    depMemReq,
    svcName,
    svcNamespace,
    svcType,
    svcPort,
    svcTargetPort,
    svcNodePort,
    svcSelector,
    rbacType,
    rbacName,
    rbacNamespace,
    rbacSubject,
    rbacSubjectKind,
    rbacResources,
    rbacVerbs,
    netName,
    netNamespace,
    netPodSelector,
    netType,
    netIngressSelector,
    netIngressPort,
    ingName,
    ingNamespace,
    ingHost,
    ingPath,
    ingService,
    ingPort,
    ingTls,
    ingTlsSecret,
    ingCertManager,
    cronName,
    cronNamespace,
    cronSchedule,
    cronRestartPolicy,
    cronConcurrency,
    cronImage,
    cronCommand,
  ]);

  const handleDownload = () => {
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-${Date.now()}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVerbToggle = (verb: keyof typeof rbacVerbs) => {
    setRbacVerbs((prev) => ({ ...prev, [verb]: !prev[verb] }));
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          {[
            { id: 'deployment', name: 'Deployment' },
            { id: 'service', name: 'Service' },
            { id: 'rbac', name: 'RBAC' },
            { id: 'netpol', name: 'NetworkPolicy' },
            { id: 'ingress', name: 'Ingress' },
            { id: 'cronjob', name: 'CronJob' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <Layers size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* 1. DEPLOYMENT FORM */}
        {activeTab === 'deployment' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Deployment Name</label>
              <input type="text" className="form-input-text" value={depName} onChange={(e) => setDepName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Namespace</label>
              <input type="text" className="form-input-text" value={depNamespace} onChange={(e) => setDepNamespace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Replicas ({depReplicas})</label>
              <input
                type="range"
                min="1"
                max="20"
                value={depReplicas}
                onChange={(e) => setDepReplicas(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Container Image</label>
              <input type="text" className="form-input-text" value={depImage} onChange={(e) => setDepImage(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Container Port</label>
              <input type="number" className="form-input-text" value={depPort} onChange={(e) => setDepPort(Number(e.target.value))} />
            </div>

            <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2' }}>
              <div className="k8s-form-section-title">Resources limits & requests</div>
              <div className="tool-inputs-grid tool-inputs-grid-2">
                <div className="form-group">
                  <label className="form-label">CPU Request (e.g. 100m)</label>
                  <input type="text" className="form-input-text" value={depCpuReq} onChange={(e) => setDepCpuReq(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CPU Limit (e.g. 500m)</label>
                  <input type="text" className="form-input-text" value={depCpuLimit} onChange={(e) => setDepCpuLimit(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Memory Request (e.g. 128Mi)</label>
                  <input type="text" className="form-input-text" value={depMemReq} onChange={(e) => setDepMemReq(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Memory Limit (e.g. 512Mi)</label>
                  <input type="text" className="form-input-text" value={depMemLimit} onChange={(e) => setDepMemLimit(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SERVICE FORM */}
        {activeTab === 'service' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Service Name</label>
              <input type="text" className="form-input-text" value={svcName} onChange={(e) => setSvcName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Namespace</label>
              <input type="text" className="form-input-text" value={svcNamespace} onChange={(e) => setSvcNamespace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select className="form-input-select" value={svcType} onChange={(e) => setSvcType(e.target.value)}>
                <option value="ClusterIP">ClusterIP (Internal)</option>
                <option value="NodePort">NodePort (Expose on Node Port)</option>
                <option value="LoadBalancer">LoadBalancer (Cloud Provider External)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Service Port</label>
              <input type="number" className="form-input-text" value={svcPort} onChange={(e) => setSvcPort(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Target Port (Pod Port)</label>
              <input type="number" className="form-input-text" value={svcTargetPort} onChange={(e) => setSvcTargetPort(Number(e.target.value))} />
            </div>
            {svcType === 'NodePort' && (
              <div className="form-group">
                <label className="form-label">NodePort (30000-32767)</label>
                <input type="number" className="form-input-text" value={svcNodePort} onChange={(e) => setSvcNodePort(Number(e.target.value))} />
              </div>
            )}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Pod Selector (comma separated key:value)</label>
              <input type="text" className="form-input-text" value={svcSelector} onChange={(e) => setSvcSelector(e.target.value)} />
            </div>
          </div>
        )}

        {/* 3. RBAC FORM */}
        {activeTab === 'rbac' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Role Type</label>
              <select className="form-input-select" value={rbacType} onChange={(e) => setRbacType(e.target.value as any)}>
                <option value="Role">Role (Namespaced)</option>
                <option value="ClusterRole">ClusterRole (Cluster-wide)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Role Name</label>
              <input type="text" className="form-input-text" value={rbacName} onChange={(e) => setRbacName(e.target.value)} />
            </div>
            {rbacType === 'Role' && (
              <div className="form-group">
                <label className="form-label">Namespace</label>
                <input type="text" className="form-input-text" value={rbacNamespace} onChange={(e) => setRbacNamespace(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Subject Name (User/SA)</label>
              <input type="text" className="form-input-text" value={rbacSubject} onChange={(e) => setRbacSubject(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Kind</label>
              <select className="form-input-select" value={rbacSubjectKind} onChange={(e) => setRbacSubjectKind(e.target.value)}>
                <option value="ServiceAccount">ServiceAccount</option>
                <option value="User">User</option>
                <option value="Group">Group</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Resources (comma separated)</label>
              <input type="text" className="form-input-text" value={rbacResources} onChange={(e) => setRbacResources(e.target.value)} />
            </div>
            <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2' }}>
              <div className="k8s-form-section-title">Verbs / Permissions</div>
              <div className="form-row">
                {(['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'] as const).map((verb) => (
                  <label key={verb} className="form-checkbox-label">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={rbacVerbs[verb]}
                      onChange={() => handleVerbToggle(verb)}
                    />
                    {verb}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. NETWORKPOLICY FORM */}
        {activeTab === 'netpol' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Policy Name</label>
              <input type="text" className="form-input-text" value={netName} onChange={(e) => setNetName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Namespace</label>
              <input type="text" className="form-input-text" value={netNamespace} onChange={(e) => setNetNamespace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Apply to pods (key:value)</label>
              <input type="text" className="form-input-text" value={netPodSelector} onChange={(e) => setNetPodSelector(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Policy Direction</label>
              <select className="form-input-select" value={netType} onChange={(e) => setNetType(e.target.value as any)}>
                <option value="Ingress">Ingress (Inbound Only)</option>
                <option value="Egress">Egress (Outbound Only)</option>
                <option value="Both">Both (Ingress & Egress)</option>
              </select>
            </div>
            {netType !== 'Egress' && (
              <>
                <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2' }}>
                  <div className="k8s-form-section-title">Ingress Rules (Allow Traffic From)</div>
                  <div className="tool-inputs-grid tool-inputs-grid-2">
                    <div className="form-group">
                      <label className="form-label">From Pod Label (key:value)</label>
                      <input type="text" className="form-input-text" value={netIngressSelector} onChange={(e) => setNetIngressSelector(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">On Port</label>
                      <input type="number" className="form-input-text" value={netIngressPort} onChange={(e) => setNetIngressPort(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 5. INGRESS FORM */}
        {activeTab === 'ingress' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">Ingress Name</label>
              <input type="text" className="form-input-text" value={ingName} onChange={(e) => setIngName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Namespace</label>
              <input type="text" className="form-input-text" value={ingNamespace} onChange={(e) => setIngNamespace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Hostname Routing</label>
              <input type="text" className="form-input-text" value={ingHost} onChange={(e) => setIngHost(e.target.value)} placeholder="app.domain.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Path Rule</label>
              <input type="text" className="form-input-text" value={ingPath} onChange={(e) => setIngPath(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Backend Service Name</label>
              <input type="text" className="form-input-text" value={ingService} onChange={(e) => setIngService(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Backend Port</label>
              <input type="number" className="form-input-text" value={ingPort} onChange={(e) => setIngPort(Number(e.target.value))} />
            </div>
            <div className="form-group k8s-form-section" style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', flexDirection: 'row' }}>
              <label className="form-checkbox-label">
                <input type="checkbox" className="form-checkbox" checked={ingTls} onChange={(e) => setIngTls(e.target.checked)} />
                Enable TLS Encryption
              </label>
              <label className="form-checkbox-label">
                <input type="checkbox" className="form-checkbox" checked={ingCertManager} onChange={(e) => setIngCertManager(e.target.checked)} />
                Add Cert-Manager Issuer Toggles
              </label>
            </div>
            {ingTls && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">TLS Secret Name</label>
                <input type="text" className="form-input-text" value={ingTlsSecret} onChange={(e) => setIngTlsSecret(e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* 6. CRONJOB FORM */}
        {activeTab === 'cronjob' && (
          <div className="tool-inputs-grid tool-inputs-grid-2">
            <div className="form-group">
              <label className="form-label">CronJob Name</label>
              <input type="text" className="form-input-text" value={cronName} onChange={(e) => setCronName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Namespace</label>
              <input type="text" className="form-input-text" value={cronNamespace} onChange={(e) => setCronNamespace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Cron Schedule (Format: * * * * *)</label>
              <input type="text" className="form-input-text" value={cronSchedule} onChange={(e) => setCronSchedule(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Concurrency Policy</label>
              <select className="form-input-select" value={cronConcurrency} onChange={(e) => setCronConcurrency(e.target.value)}>
                <option value="Forbid">Forbid (do not run concurrently)</option>
                <option value="Allow">Allow (runs concurrently)</option>
                <option value="Replace">Replace (cancels active job)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Container Image</label>
              <input type="text" className="form-input-text" value={cronImage} onChange={(e) => setCronImage(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Restart Policy</label>
              <select className="form-input-select" value={cronRestartPolicy} onChange={(e) => setCronRestartPolicy(e.target.value)}>
                <option value="OnFailure">OnFailure (Only restart on error)</option>
                <option value="Never">Never (Create fresh pods on failure)</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Container Command</label>
              <input type="text" className="form-input-text" value={cronCommand} onChange={(e) => setCronCommand(e.target.value)} placeholder="pg_dump main_db" />
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">YAML Manifest</span>
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
        <div className="output-display" style={{ minHeight: '300px', fontSize: '0.85rem' }}>
          {yamlOutput}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. ENV TO CONFIGMAP / SECRET CONVERTER
// ----------------------------------------------------
export function K8sEnvConverter() {
  const [envInput, setEnvInput] = useState('DATABASE_URL=postgresql://user:pass@host:5432/db\nAPI_KEY=df_secure_token_abc123\nLOG_LEVEL=info');
  const [name, setName] = useState('app-env');
  const [namespace, setNamespace] = useState('default');
  const [configMapYaml, setConfigMapYaml] = useState('');
  const [secretYaml, setSecretYaml] = useState('');
  const { copied: copiedCM, copy: copyCM } = useCopy();
  const { copied: copiedSec, copy: copySec } = useCopy();

  useEffect(() => {
    const lines = envInput.split('\n');
    const properties: Record<string, string> = {};

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) return;

      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      if (key) {
        properties[key] = value;
      }
    });

    // Generate ConfigMap
    const cmObj = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name,
        namespace,
      },
      data: properties,
    };
    setConfigMapYaml(yaml.dump(cmObj, { indent: 2 }));

    // Generate Secret
    const secretData: Record<string, string> = {};
    Object.entries(properties).forEach(([k, v]) => {
      secretData[k] = utf8Btoa(v);
    });

    const secObj = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name,
        namespace,
      },
      type: 'Opaque',
      data: secretData,
    };
    setSecretYaml(yaml.dump(secObj, { indent: 2 }));
  }, [envInput, name, namespace]);

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="tool-inputs-grid tool-inputs-grid-2">
          <div className="form-group">
            <label className="form-label">Resource Name</label>
            <input type="text" className="form-input-text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Namespace</label>
            <input type="text" className="form-input-text" value={namespace} onChange={(e) => setNamespace(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Paste Env File Content</label>
          <textarea
            className="form-input-textarea"
            placeholder="KEY=value&#10;# This is a comment&#10;PORT=8080"
            value={envInput}
            onChange={(e) => setEnvInput(e.target.value)}
            style={{ minHeight: '150px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div className="glass-panel output-panel">
          <div className="output-header">
            <span className="output-title">ConfigMap YAML</span>
            <button className="btn btn-secondary btn-icon-label" onClick={() => copyCM(configMapYaml)}>
              {copiedCM ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <div className="output-display" style={{ minHeight: '150px', fontSize: '0.85rem' }}>
            {configMapYaml}
          </div>
        </div>

        <div className="glass-panel output-panel">
          <div className="output-header">
            <span className="output-title">Secret YAML (Base64 Encoded)</span>
            <button className="btn btn-secondary btn-icon-label" onClick={() => copySec(secretYaml)}>
              {copiedSec ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <div className="output-display" style={{ minHeight: '150px', fontSize: '0.85rem' }}>
            {secretYaml}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 3. INTERACTIVE KUBECTL COMMAND BUILDER
// ----------------------------------------------------
interface K8sCommand {
  id: string;
  name: string;
  category: 'debugging' | 'management' | 'context';
  template: string;
  description: string;
  inputs: {
    key: string;
    label: string;
    type: 'text' | 'select';
    default: string;
    options?: string[];
  }[];
}

export function K8sCommandBuilder() {
  const [activeCategory, setActiveCategory] = useState<'debugging' | 'management' | 'context'>('debugging');
  const [selectedCommandId, setSelectedCommandId] = useState('port-forward');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [builtCommand, setBuiltCommand] = useState('');
  const { copied, copy } = useCopy();

  const commandsList: K8sCommand[] = [
    // DEBUGGING
    {
      id: 'port-forward',
      name: 'Port Forward Pod',
      category: 'debugging',
      template: 'kubectl port-forward pod/{podName} {localPort}:{podPort} -n {namespace}',
      description: 'Forward local port traffic directly to a running pod.',
      inputs: [
        { key: 'podName', label: 'Pod Name', type: 'text', default: 'my-web-pod' },
        { key: 'localPort', label: 'Local Port', type: 'text', default: '8080' },
        { key: 'podPort', label: 'Pod Port', type: 'text', default: '80' },
        { key: 'namespace', label: 'Namespace', type: 'text', default: 'default' },
      ],
    },
    {
      id: 'pod-logs',
      name: 'Tail Container Logs',
      category: 'debugging',
      template: 'kubectl logs {podName} -n {namespace} -f --tail={tailLines}',
      description: 'Follow real-time logs of a running container.',
      inputs: [
        { key: 'podName', label: 'Pod Name', type: 'text', default: 'my-web-pod' },
        { key: 'tailLines', label: 'Tail Lines', type: 'text', default: '100' },
        { key: 'namespace', label: 'Namespace', type: 'text', default: 'default' },
      ],
    },
    {
      id: 'interactive-exec',
      name: 'Exec Interactive Shell',
      category: 'debugging',
      template: 'kubectl exec -it {podName} -n {namespace} -- {shell}',
      description: 'Open a secure bash or sh session directly inside a pod container.',
      inputs: [
        { key: 'podName', label: 'Pod Name', type: 'text', default: 'my-web-pod' },
        { key: 'shell', label: 'Shell Type', type: 'select', default: 'sh', options: ['bash', 'sh'] },
        { key: 'namespace', label: 'Namespace', type: 'text', default: 'default' },
      ],
    },
    {
      id: 'describe-pod',
      name: 'Describe Resource Details',
      category: 'debugging',
      template: 'kubectl describe {resourceType}/{resourceName} -n {namespace}',
      description: 'Retrieve detailed state description and event logs for a resource.',
      inputs: [
        { key: 'resourceType', label: 'Resource Type', type: 'select', default: 'pod', options: ['pod', 'service', 'deployment', 'ingress', 'cronjob'] },
        { key: 'resourceName', label: 'Resource Name', type: 'text', default: 'my-web-pod' },
        { key: 'namespace', label: 'Namespace', type: 'text', default: 'default' },
      ],
    },
    // MANAGEMENT
    {
      id: 'rollout-restart',
      name: 'Restart Deployment',
      category: 'management',
      template: 'kubectl rollout restart deployment/{deploymentName} -n {namespace}',
      description: 'Trigger a rolling restart of all pods managed by a deployment.',
      inputs: [
        { key: 'deploymentName', label: 'Deployment Name', type: 'text', default: 'web-deployment' },
        { key: 'namespace', label: 'Namespace', type: 'text', default: 'default' },
      ],
    },
    {
      id: 'apply-file',
      name: 'Apply YAML Manifest',
      category: 'management',
      template: 'kubectl apply -f {filePath}',
      description: 'Deploy or update K8s resources defined in a local file.',
      inputs: [{ key: 'filePath', label: 'YAML File Path', type: 'text', default: './deployment.yaml' }],
    },
    {
      id: 'delete-resource',
      name: 'Delete Resource Safely',
      category: 'management',
      template: 'kubectl delete {resourceType}/{resourceName} -n {namespace} --grace-period={gracePeriod}',
      description: 'Terminate a running resource with customizable grace parameters.',
      inputs: [
        { key: 'resourceType', label: 'Resource Type', type: 'select', default: 'pod', options: ['pod', 'service', 'deployment', 'ingress'] },
        { key: 'resourceName', label: 'Resource Name', type: 'text', default: 'my-web-pod' },
        { key: 'gracePeriod', label: 'Grace Period (seconds)', type: 'text', default: '30' },
        { key: 'namespace', label: 'Namespace', type: 'text', default: 'default' },
      ],
    },
    // CONTEXT
    {
      id: 'switch-namespace',
      name: 'Switch Context Namespace',
      category: 'context',
      template: 'kubectl config set-context --current --namespace={namespace}',
      description: 'Configure your active kubeconfig context to default to a specific namespace.',
      inputs: [{ key: 'namespace', label: 'Target Namespace', type: 'text', default: 'kube-system' }],
    },
    {
      id: 'switch-context',
      name: 'Switch Active Context',
      category: 'context',
      template: 'kubectl config use-context {contextName}',
      description: 'Change the target cluster context your local shell points to.',
      inputs: [{ key: 'contextName', label: 'Context Name', type: 'text', default: 'docker-desktop' }],
    },
    {
      id: 'list-contexts',
      name: 'List Available Contexts',
      category: 'context',
      template: 'kubectl config get-contexts',
      description: 'Show all clusters and authentication context profiles saved in your configs.',
      inputs: [],
    },
  ];

  const activeCmd = commandsList.find((c) => c.id === selectedCommandId) || commandsList[0];

  // Set default values when selected command shifts
  useEffect(() => {
    const defaults: Record<string, string> = {};
    activeCmd.inputs.forEach((input) => {
      defaults[input.key] = input.default;
    });
    setInputValues(defaults);
  }, [selectedCommandId]);

  // Construct command string
  useEffect(() => {
    let result = activeCmd.template;
    Object.entries(inputValues).forEach(([k, v]) => {
      result = result.replace(`{${k}}`, v || `{${k}}`);
    });
    setBuiltCommand(result);
  }, [inputValues, selectedCommandId]);

  const handleInputChange = (key: string, val: string) => {
    setInputValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="tool-workspace-layout">
      <div className="glass-panel tool-controls-panel">
        <div className="k8s-tabs">
          {[
            { id: 'debugging', name: 'Diagnostics & Exec' },
            { id: 'management', name: 'Resource Management' },
            { id: 'context', name: 'Cluster Contexts' },
          ].map((cat) => (
            <button
              key={cat.id}
              className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => {
                setActiveCategory(cat.id as any);
                // Select first command in that category
                const first = commandsList.find((c) => c.category === cat.id);
                if (first) setSelectedCommandId(first.id);
              }}
            >
              <Terminal size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {cat.name}
            </button>
          ))}
        </div>

        <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginTop: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label">Select Command Target</label>
            <select
              className="form-input-select"
              value={selectedCommandId}
              onChange={(e) => setSelectedCommandId(e.target.value)}
            >
              {commandsList
                .filter((c) => c.category === activeCategory)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group" style={{ justifyContent: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Info size={16} color="var(--accent-primary)" />
              {activeCmd.description}
            </span>
          </div>
        </div>

        {activeCmd.inputs.length > 0 && (
          <div className="k8s-form-section tool-inputs-grid tool-inputs-grid-2">
            {activeCmd.inputs.map((input) => (
              <div key={input.key} className="form-group">
                <label className="form-label">{input.label}</label>
                {input.type === 'select' ? (
                  <select
                    className="form-input-select"
                    value={inputValues[input.key] || ''}
                    onChange={(e) => handleInputChange(input.key, e.target.value)}
                  >
                    {input.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input-text"
                    value={inputValues[input.key] || ''}
                    onChange={(e) => handleInputChange(input.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Built Kubectl Command</span>
          <button className="btn btn-primary btn-icon-label" onClick={() => copy(builtCommand)}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy Command'}
          </button>
        </div>
        <div
          className="output-display"
          style={{
            minHeight: '60px',
            fontSize: '1.25rem',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--accent-success)',
          }}
        >
          {builtCommand}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 4. K8S RESOURCE UNIT CONVERTER
// ----------------------------------------------------
export function K8sResourceConverter() {
  // CPU values
  const [cpuCores, setCpuCores] = useState('0.5');
  const [cpuMillis, setCpuMillis] = useState('500');

  // Memory values
  const [memGiB, setMemGiB] = useState('1');
  const [memMiB, setMemMiB] = useState('1024');
  const [memBytes, setMemBytes] = useState('1073741824');

  const handleCpuCoresChange = (val: string) => {
    setCpuCores(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setCpuMillis(Math.round(parsed * 1000).toString());
    } else {
      setCpuMillis('');
    }
  };

  const handleCpuMillisChange = (val: string) => {
    setCpuMillis(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setCpuCores((parsed / 1000).toString());
    } else {
      setCpuCores('');
    }
  };

  const handleMemGiBChange = (val: string) => {
    setMemGiB(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setMemMiB(Math.round(parsed * 1024).toString());
      setMemBytes(Math.round(parsed * 1024 * 1024 * 1024).toString());
    } else {
      setMemMiB('');
      setMemBytes('');
    }
  };

  const handleMemMiBChange = (val: string) => {
    setMemMiB(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setMemGiB((parsed / 1024).toString());
      setMemBytes(Math.round(parsed * 1024 * 1024).toString());
    } else {
      setMemGiB('');
      setMemBytes('');
    }
  };

  const handleMemBytesChange = (val: string) => {
    setMemBytes(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setMemGiB((parsed / (1024 * 1024 * 1024)).toString());
      setMemMiB((parsed / (1024 * 1024)).toString());
    } else {
      setMemGiB('');
      setMemMiB('');
    }
  };

  return (
    <div className="tool-workspace-layout">
      {/* CPU PANEL */}
      <div className="glass-panel tool-controls-panel">
        <h3 className="k8s-form-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
          CPU Cores &lt;=&gt; Millicores Converter
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Kubernetes CPU requests/limits are expressed in CPU units (e.g. 1 Core) or millicores (e.g. 100m, where 1000m = 1 core).
        </p>

        <div className="tool-inputs-grid tool-inputs-grid-2" style={{ marginTop: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label">CPU Cores (e.g. 1.5)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input-text"
                value={cpuCores}
                onChange={(e) => handleCpuCoresChange(e.target.value)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cores</span>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ArrowRightLeft size={24} color="var(--accent-primary)" style={{ opacity: 0.5 }} />
          </div>

          <div className="form-group">
            <label className="form-label">Millicores (e.g. 500m)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="form-input-text"
                value={cpuMillis}
                onChange={(e) => handleCpuMillisChange(e.target.value)}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>m</span>
            </div>
          </div>
        </div>
      </div>

      {/* MEMORY PANEL */}
      <div className="glass-panel tool-controls-panel">
        <h3 className="k8s-form-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
          RAM Memory Unit Converter
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          K8s RAM sizes can use binary suffixes like Mi (Mebibytes) or Gi (Gibibytes), where 1 Gi = 1024 Mi.
        </p>

        <div className="tool-inputs-grid" style={{ gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label">Gibibytes (Gi)</label>
            <input
              type="text"
              className="form-input-text"
              value={memGiB}
              onChange={(e) => handleMemGiBChange(e.target.value)}
            />
          </div>

          <ArrowRightLeft size={16} color="var(--accent-primary)" style={{ opacity: 0.4, marginTop: '20px' }} />

          <div className="form-group">
            <label className="form-label">Mebibytes (Mi)</label>
            <input
              type="text"
              className="form-input-text"
              value={memMiB}
              onChange={(e) => handleMemMiBChange(e.target.value)}
            />
          </div>

          <ArrowRightLeft size={16} color="var(--accent-primary)" style={{ opacity: 0.4, marginTop: '20px' }} />

          <div className="form-group">
            <label className="form-label">Raw Bytes</label>
            <input
              type="text"
              className="form-input-text"
              value={memBytes}
              onChange={(e) => handleMemBytesChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* BEST PRACTICE ADVICE */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          display: 'flex',
          gap: '1rem',
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid var(--border-color)',
        }}
      >
        <Info size={24} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
          <strong>Kubernetes Resource Best Practices:</strong>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <li>Set <strong>limits</strong> for Memory to prevent containers from exhausting host node memory. Memory limits should usually match requests (1:1 ratio) to guarantee the scheduling quality of service.</li>
            <li>For CPU, set <strong>requests</strong> to specify what the container guarantees to get, but consider keeping CPU limits loose (or omitted) to allow containers to burst when needed without scheduling CPU throttle.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 5. KUBECONFIG CONTEXT MERGER
// ----------------------------------------------------
export function K8sKubeconfigMerger() {
  const [configA, setConfigA] = useState(`# Kubeconfig Cluster A
apiVersion: v1
kind: Config
clusters:
- name: cluster-staging
  cluster:
    server: https://192.168.10.100:6443
users:
- name: staging-admin
  user:
    token: staging-token-abc
contexts:
- name: staging-context
  context:
    cluster: cluster-staging
    user: staging-admin
current-context: staging-context`);

  const [configB, setConfigB] = useState(`# Kubeconfig Cluster B
apiVersion: v1
kind: Config
clusters:
- name: cluster-prod
  cluster:
    server: https://api.prod.mycluster.com:6443
users:
- name: prod-admin
  user:
    token: prod-token-xyz
contexts:
- name: prod-context
  context:
    cluster: cluster-prod
    user: prod-admin
current-context: prod-context`);

  const [mergedOutput, setMergedOutput] = useState('');
  const [error, setError] = useState('');
  const { copied, copy } = useCopy();

  const handleMerge = () => {
    if (!configA.trim() || !configB.trim()) {
      setError('Please provide two valid YAML configs to merge.');
      setMergedOutput('');
      return;
    }

    try {
      const parsedA = yaml.load(configA) as any;
      const parsedB = yaml.load(configB) as any;

      if (!parsedA || !parsedB || typeof parsedA !== 'object' || typeof parsedB !== 'object') {
        throw new Error('YAML document must evaluate to a structured configuration.');
      }

      // Check structures
      const merged = {
        apiVersion: parsedA.apiVersion || parsedB.apiVersion || 'v1',
        kind: 'Config',
        clusters: [...(parsedA.clusters || []), ...(parsedB.clusters || [])],
        users: [...(parsedA.users || []), ...(parsedB.users || [])],
        contexts: [...(parsedA.contexts || []), ...(parsedB.contexts || [])],
        'current-context': parsedB['current-context'] || parsedA['current-context'] || '',
      };

      // De-duplicate clusters by name
      const uniqueClusters = Array.from(new Map(merged.clusters.map((item) => [item.name, item])).values());
      // De-duplicate users by name
      const uniqueUsers = Array.from(new Map(merged.users.map((item) => [item.name, item])).values());
      // De-duplicate contexts by name
      const uniqueContexts = Array.from(new Map(merged.contexts.map((item) => [item.name, item])).values());

      merged.clusters = uniqueClusters;
      merged.users = uniqueUsers;
      merged.contexts = uniqueContexts;

      setMergedOutput(yaml.dump(merged, { indent: 2 }));
      setError('');
    } catch (e: any) {
      setError(e.message || 'Syntax error during YAML parsing');
      setMergedOutput('');
    }
  };

  useEffect(() => {
    handleMerge();
  }, [configA, configB]);

  const handleDownload = () => {
    const blob = new Blob([mergedOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kubeconfig-merged-${Date.now()}.yaml`;
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
            <label className="form-label">Kubeconfig A</label>
            <textarea
              className="form-input-textarea"
              placeholder="Paste first kubeconfig contents here..."
              value={configA}
              onChange={(e) => setConfigA(e.target.value)}
              style={{ minHeight: '180px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kubeconfig B</label>
            <textarea
              className="form-input-textarea"
              placeholder="Paste second kubeconfig contents here..."
              value={configB}
              onChange={(e) => setConfigB(e.target.value)}
              style={{ minHeight: '180px' }}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel output-panel">
        <div className="output-header">
          <span className="output-title">Merged Kubeconfig YAML</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {mergedOutput && (
              <>
                <button className="btn btn-secondary btn-icon-label" onClick={() => copy(mergedOutput)}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button className="btn btn-primary btn-icon-label" onClick={handleDownload}>
                  <Download size={16} /> Download config
                </button>
              </>
            )}
          </div>
        </div>

        {error ? (
          <div
            className="output-display"
            style={{ color: 'var(--accent-danger)', border: '1px solid rgba(239, 68, 68, 0.3)', minHeight: '200px' }}
          >
            {error}
          </div>
        ) : (
          <div className="output-display" style={{ minHeight: '200px', fontSize: '0.85rem' }}>
            {mergedOutput || 'Merged config will appear here...'}
          </div>
        )}
      </div>
    </div>
  );
}
