import React, { useState, useEffect } from 'react';
import {
  Key,
  RefreshCw,
  Terminal,
  Type,
  Palette,
  Layers,
  Cpu,
  Search,
  Star,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Info,
  Code,
  Grid,
  Play,
  Settings
} from 'lucide-react';

// Import our custom category tools
import { HashGenerator, UuidGenerator, PasswordGenerator } from './components/tools/CryptoTools';
import { Base64Codec, UrlCodec, JsonYamlConverter } from './components/tools/ConverterTools';
import { JwtDecoder, JsonFormatter, RegexTester, CronGenerator } from './components/tools/WebDevTools';
import { DiffChecker, MarkdownPreview, CaseWordCounter } from './components/tools/TextTools';
import { QrGenerator, ColorConverter } from './components/tools/DesignTools';
import { K8sGenerator, K8sEnvConverter, K8sCommandBuilder, K8sResourceConverter, K8sKubeconfigMerger } from './components/tools/K8sTools';
import { PromptBuilder, JsonSchemaGenerator } from './components/tools/AITools';
import { GithubActionsBuilder, ArgoGenerator } from './components/tools/CicdTools';
import { DockerComposeConverter, DockerfileGenerator, CidrCalculator, SplunkQueryGenerator, PrometheusAlertRules } from './components/tools/DevOpsTools';

interface ToolItem {
  id: string;
  name: string;
  description: string;
  category: 'crypto' | 'converters' | 'webdev' | 'text' | 'design' | 'k8s' | 'ai' | 'cicd' | 'devops';
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

export default function App() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  // Define tools list
  const tools: ToolItem[] = [
    // CRYPTO
    {
      id: 'hash-generator',
      name: 'Hash Generator',
      description: 'Generate SHA-256, SHA-1, SHA-512, and MD5 cryptographic hashes.',
      category: 'crypto',
      icon: Key,
      component: HashGenerator,
    },
    {
      id: 'uuid-generator',
      name: 'UUID/ULID Generator',
      description: 'Bulk generate cryptographically secure UUID v4 or ULID strings.',
      category: 'crypto',
      icon: Key,
      component: UuidGenerator,
    },
    {
      id: 'password-generator',
      name: 'Password Generator',
      description: 'Generate strong, customizable passwords with a visual strength meter.',
      category: 'crypto',
      icon: Key,
      component: PasswordGenerator,
    },
    // CONVERTERS
    {
      id: 'base64-codec',
      name: 'Base64 Encoder/Decoder',
      description: 'Encode or decode plain text strings into Base64 format.',
      category: 'converters',
      icon: RefreshCw,
      component: Base64Codec,
    },
    {
      id: 'url-codec',
      name: 'URL Encoder/Decoder',
      description: 'Encode or decode query strings and special URI components.',
      category: 'converters',
      icon: RefreshCw,
      component: UrlCodec,
    },
    {
      id: 'json-yaml-converter',
      name: 'JSON <-> YAML Converter',
      description: 'Convert JSON objects to YAML format and vice-versa instantly.',
      category: 'converters',
      icon: RefreshCw,
      component: JsonYamlConverter,
    },
    // WEB DEV
    {
      id: 'jwt-decoder',
      name: 'JWT Decoder',
      description: 'Decode and validate JSON Web Token headers, payloads, and signatures.',
      category: 'webdev',
      icon: Terminal,
      component: JwtDecoder,
    },
    {
      id: 'json-formatter',
      name: 'JSON Formatter & Validator',
      description: 'Validate, minifying, or prettify JSON with customizable indentation.',
      category: 'webdev',
      icon: Terminal,
      component: JsonFormatter,
    },
    {
      id: 'regex-tester',
      name: 'Regex Tester',
      description: 'Test regular expressions in real-time with capture groups and match details.',
      category: 'webdev',
      icon: Terminal,
      component: RegexTester,
    },
    {
      id: 'cron-generator',
      name: 'Crontab Generator',
      description: 'Interactive visual cron scheduler with clear English explanation.',
      category: 'webdev',
      icon: Terminal,
      component: CronGenerator,
    },
    // TEXT
    {
      id: 'diff-checker',
      name: 'Diff Checker',
      description: 'Check side-by-side or line diffs of two text structures.',
      category: 'text',
      icon: Type,
      component: DiffChecker,
    },
    {
      id: 'markdown-preview',
      name: 'Markdown Previewer',
      description: 'Interactive side-by-side markdown editor and live rendering preview.',
      category: 'text',
      icon: Type,
      component: MarkdownPreview,
    },
    {
      id: 'case-counter',
      name: 'Case Converter & Counter',
      description: 'Analyze word count, reading time, and convert casing (camelCase, snake_case).',
      category: 'text',
      icon: Type,
      component: CaseWordCounter,
    },
    // DESIGN
    {
      id: 'qr-generator',
      name: 'QR Code Generator',
      description: 'Create customizable QR codes with custom colors and download them as PNG.',
      category: 'design',
      icon: Palette,
      component: QrGenerator,
    },
    {
      id: 'color-converter',
      name: 'Color Converter & Harmony',
      description: 'Convert HEX, RGB, HSL values and build matching harmonic color palettes.',
      category: 'design',
      icon: Palette,
      component: ColorConverter,
    },
    // KUBERNETES
    {
      id: 'k8s-generator',
      name: 'K8s YAML Builder',
      description: 'Interactive manifest builder for Deployments, Services, RBAC, NetworkPolicies, Ingress, and CronJobs.',
      category: 'k8s',
      icon: Layers,
      component: K8sGenerator,
    },
    {
      id: 'k8s-env-converter',
      name: '.env to ConfigMap/Secret',
      description: 'Convert standard key-value environment variables into K8s ConfigMap and Secret manifests.',
      category: 'k8s',
      icon: Layers,
      component: K8sEnvConverter,
    },
    {
      id: 'kubectl-builder',
      name: 'Kubectl Command Builder',
      description: 'Build diagnostics, resource management, and context switching kubectl commands interactively.',
      category: 'k8s',
      icon: Layers,
      component: K8sCommandBuilder,
    },
    {
      id: 'k8s-resource-converter',
      name: 'K8s Resource Converter',
      description: 'Convert CPU Cores/Millicores and Memory GiB/MiB/Bytes limits and requests.',
      category: 'k8s',
      icon: Layers,
      component: K8sResourceConverter,
    },
    {
      id: 'kubeconfig-merger',
      name: 'Kubeconfig Context Merger',
      description: 'Safely merge multiple kubeconfig cluster context configurations into a single YAML.',
      category: 'k8s',
      icon: Layers,
      component: K8sKubeconfigMerger,
    },
    // AI
    {
      id: 'prompt-builder',
      name: 'AI Prompt Builder',
      description: 'Structured template prompt engineer for system roles, few-shot, and refactoring.',
      category: 'ai',
      icon: Cpu,
      component: PromptBuilder,
    },
    {
      id: 'json-schema-generator',
      name: 'Structured JSON Schema',
      description: 'Configure and output schemas for OpenAI/Gemini structured responses.',
      category: 'ai',
      icon: Cpu,
      component: JsonSchemaGenerator,
    },
    // CI/CD
    {
      id: 'github-actions-builder',
      name: 'GitHub Actions Builder',
      description: 'Build CI/CD workflow pipelines for Node, Go, or Python with Docker build capabilities.',
      category: 'cicd',
      icon: Play,
      component: GithubActionsBuilder,
    },
    {
      id: 'argo-generator',
      name: 'Argo Resource Builder',
      description: 'Generate ArgoCD Applications, ArgoCD Projects, or Argo Workflows YAML configurations.',
      category: 'cicd',
      icon: Play,
      component: ArgoGenerator,
    },
    // DEVOPS & CONTAINERS
    {
      id: 'docker-compose-converter',
      name: 'Docker Run to Compose',
      description: 'Instantly convert docker run commands into clean, multi-service docker-compose.yml files.',
      category: 'devops',
      icon: Settings,
      component: DockerComposeConverter,
    },
    {
      id: 'dockerfile-generator',
      name: 'Dockerfile Generator',
      description: 'Scaffold secure, multi-stage Dockerfiles with best-practices for major language runtimes.',
      category: 'devops',
      icon: Settings,
      component: DockerfileGenerator,
    },
    {
      id: 'cidr-calculator',
      name: 'CIDR Subnet Calculator',
      description: 'Calculate usable IPs, netmasks, wildcards, and broadcast boundaries for any network block.',
      category: 'devops',
      icon: Settings,
      component: CidrCalculator,
    },
    {
      id: 'splunk-generator',
      name: 'Splunk Query Generator',
      description: 'Generate Splunk search processing language (SPL) queries for statistics, transactions, and lookups.',
      category: 'devops',
      icon: Search,
      component: SplunkQueryGenerator,
    },
    {
      id: 'prometheus-alerts',
      name: 'Prometheus Alert Rules',
      description: 'Generate Prometheus CPU, RAM, Disk, and HTTP error alerting rule configurations.',
      category: 'devops',
      icon: Settings,
      component: PrometheusAlertRules,
    },
  ];

  // Load favorites & theme on mount
  useEffect(() => {
    const savedFavs = localStorage.getItem('df-favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const savedTheme = localStorage.getItem('df-theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Update theme helper
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('df-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    showToast(`Switched to ${nextTheme} mode`);
  };

  // Toggle favorite helper
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter((fav) => fav !== id);
      showToast('Removed from favorites');
    } else {
      updated = [...favorites, id];
      showToast('Added to favorites');
    }
    setFavorites(updated);
    localStorage.setItem('df-favorites', JSON.stringify(updated));
  };

  const showToast = (message: string, error = false) => {
    setToast({ message, error });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter tools
  const filteredTools = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [
    { id: 'crypto', name: 'Crypto & Hashes', icon: Key },
    { id: 'converters', name: 'Converters', icon: RefreshCw },
    { id: 'webdev', name: 'Web & Development', icon: Terminal },
    { id: 'text', name: 'Text Utilities', icon: Type },
    { id: 'design', name: 'Design Tools', icon: Palette },
    { id: 'k8s', name: 'Kubernetes', icon: Layers },
    { id: 'cicd', name: 'CI/CD Pipelines', icon: Play },
    { id: 'devops', name: 'DevOps & Containers', icon: Settings },
    { id: 'ai', name: 'AI Engineering', icon: Cpu },
  ];

  const currentTool = tools.find((t) => t.id === activeToolId);
  const ActiveToolComponent = currentTool ? currentTool.component : null;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setActiveToolId(null)}>
            <Code size={24} style={{ color: 'var(--accent-primary)' }} />
            <span>DevForge</span>
          </div>
          <button className="sidebar-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="sidebar-search-container">
          <div className="sidebar-search-wrapper">
            <Search size={16} className="sidebar-search-icon" />
            <input
              type="text"
              placeholder="Search tools..."
              className="sidebar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-item" style={{ marginBottom: '0.5rem' }} onClick={() => setActiveToolId(null)}>
            <Grid size={18} />
            <span>Dashboard</span>
          </div>

          {favorites.length > 0 && (
            <>
              <div className="nav-section-title">Favorites</div>
              {tools
                .filter((t) => favorites.includes(t.id))
                .map((t) => (
                  <div
                    key={t.id}
                    className={`nav-item ${activeToolId === t.id ? 'active' : ''}`}
                    onClick={() => setActiveToolId(t.id)}
                  >
                    <Star size={16} fill="var(--accent-secondary)" style={{ color: 'var(--accent-secondary)' }} />
                    <span>{t.name}</span>
                  </div>
                ))}
            </>
          )}

          <div className="nav-section-title" style={{ marginTop: '0.5rem' }}>Categories</div>
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const catTools = filteredTools.filter((t) => t.category === cat.id);
            if (catTools.length === 0 && searchQuery) return null;

            return (
              <div key={cat.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="nav-section-title" style={{ padding: '0.25rem 1rem', fontSize: '0.7rem', opacity: 0.75 }}>
                  {cat.name}
                </div>
                {tools
                  .filter((t) => t.category === cat.id)
                  .map((t) => (
                    <div
                      key={t.id}
                      className={`nav-item ${activeToolId === t.id ? 'active' : ''}`}
                      onClick={() => setActiveToolId(t.id)}
                    >
                      <CatIcon size={16} />
                      <span>{t.name}</span>
                    </div>
                  ))}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="app-main">
        {/* TOPBAR */}
        <header className="app-topbar">
          <div className="topbar-title-section">
            <span className="topbar-title">{currentTool ? currentTool.name : 'Developer Tools Dashboard'}</span>
            {currentTool && (
              <span className="topbar-category-tag">
                {currentTool.category === 'webdev' ? 'web dev' : currentTool.category}
              </span>
            )}
          </div>

          <div className="topbar-actions">
            {currentTool && (
              <button
                className={`icon-btn ${favorites.includes(currentTool.id) ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(currentTool.id, e)}
                title="Toggle Favorite"
              >
                <Star size={18} fill={favorites.includes(currentTool.id) ? 'var(--accent-secondary)' : 'none'} />
              </button>
            )}
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="app-workspace">
          {ActiveToolComponent ? (
            <ActiveToolComponent />
          ) : (
            /* DASHBOARD WELCOME */
            <div className="tool-workspace-layout">
              <div
                className="glass-panel"
                style={{
                  padding: '2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, textAlign: 'left' }}>
                  Welcome to{' '}
                  <span
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    DevForge
                  </span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px', lineHeight: 1.6 }}>
                  A premium collection of essential client-side utilities built for developers, including cryptography,
                  data converters, web formats, Kubernetes configuration, and AI engineering prompt builders.
                </p>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Info size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span>All processing happens entirely in your browser. No data ever leaves your machine.</span>
                </div>
              </div>

              {/* FAVORITES GRID */}
              {favorites.length > 0 && (
                <div>
                  <h2 className="dashboard-section-header">
                    <Star size={20} fill="var(--accent-secondary)" style={{ color: 'var(--accent-secondary)' }} />
                    Favorites
                  </h2>
                  <div className="dashboard-grid">
                    {tools
                      .filter((t) => favorites.includes(t.id))
                      .map((t) => {
                        const IconComp = t.icon;
                        return (
                          <div
                            key={t.id}
                            className="glass-panel-interactive tool-card"
                            onClick={() => setActiveToolId(t.id)}
                          >
                            <div className="tool-card-header">
                              <div className="tool-card-icon-wrapper">
                                <IconComp size={22} />
                              </div>
                              <button
                                className="tool-card-fav-btn active"
                                onClick={(e) => toggleFavorite(t.id, e)}
                              >
                                <Star size={16} fill="var(--accent-secondary)" />
                              </button>
                            </div>
                            <h3 className="tool-card-title">{t.name}</h3>
                            <p className="tool-card-desc">{t.description}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* SEARCH FILTER / ALL TOOLS */}
              <div>
                <h2 className="dashboard-section-header">All Utilities</h2>
                <div className="dashboard-grid">
                  {filteredTools.map((t) => {
                    const IconComp = t.icon;
                    const isFav = favorites.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        className="glass-panel-interactive tool-card"
                        onClick={() => setActiveToolId(t.id)}
                      >
                        <div className="tool-card-header">
                          <div className="tool-card-icon-wrapper">
                            <IconComp size={22} />
                          </div>
                          <button
                            className={`tool-card-fav-btn ${isFav ? 'active' : ''}`}
                            onClick={(e) => toggleFavorite(t.id, e)}
                          >
                            <Star size={16} fill={isFav ? 'var(--accent-secondary)' : 'none'} />
                          </button>
                        </div>
                        <h3 className="tool-card-title">{t.name}</h3>
                        <p className="tool-card-desc">{t.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.error ? 'error' : ''}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
