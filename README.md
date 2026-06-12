# DevForge 🛠️

**DevForge** is a premium, client-side suite of developer utilities and tools designed to simplify day-to-day coding, conversion, debugging, and infrastructure operations. Inspired by `it-tools`, DevForge runs entirely in the browser (stateless) with a responsive, glassmorphic dark/light UI, custom favorites management, and local search.

## 🚀 Key Features

*   **100% Client-Side**: No server backend, no data transmission, completely secure and private.
*   **Aesthetic UI**: Smooth vanilla CSS, custom font styling, HSL dark/light modes, collapsible sidebar, and layout persistence.
*   **Search & Favorites**: Instantly filter tools by search keywords or pin your most-used tools to the top dashboard.
*   **Docker Ready**: Minimal, multi-stage production image serving via Nginx Alpine (~25MB).

---

## 🛠️ Tool Suite Overview

### 🔐 Cryptography & Tokens
*   **Hash Generator**: Instant SHA-256, SHA-512, SHA-1, and MD5 file or text hashing.
*   **UUID/ULID Generator**: Bulk ID generator with casing and hyphen modifiers.
*   **Password Generator**: Cryptographically secure generator with configurable character sets.
*   **JWT Decoder**: Color-coded payload/header extraction with token expiry tracking.

### 🔄 Data & Formats
*   **JSON-YAML Converter**: Bi-directional object parser with validation.
*   **Base64 / URL Codecs**: Robust encoders/decoders with UTF-8 character safety.
*   **JSON Formatter & Validator**: Beautify, validate, and minify JSON with dynamic spacing.

### 🐳 DevOps, Containers & Networking
*   **Docker Run to Compose**: Converts verbose docker run command lines into `docker-compose.yml` configurations.
*   **Dockerfile Generator**: Scaffolds production-grade, hardened Dockerfiles for Node, Python, Go, and HTML.
*   **CIDR Subnet Calculator**: Breaks down subnets with an interactive binary heap/tree diagram.
*   **Splunk Query Generator**: Build search, stats, transaction, and regex/eval SPL queries using templated filters.
*   **Prometheus Alerts Rules**: Generator for CPU, memory, disk, and service alerts.

### ⛵ Kubernetes Manifests
*   **K8s Manifest Builder**: Compose Deployments, Services, RBAC, Ingress, CronJobs, and NetworkPolicies.
*   **Kubectl Command Builder**: Compile command strings for logs, port-forwards, rollout actions, and context switches.
*   **Kubeconfig Context Merger**: Merges context mappings, users, and credentials from two configurations safely.
*   **Resource Converter & .env parser**: Maps raw .env variables to configmaps/secrets and converts CPU/RAM units.

### 🧪 Web, Text & Design
*   **Regex Tester**: Highlight matches and extract capture groups live.
*   **Crontab Generator**: Build cron schedules with human-readable explanations.
*   **Diff Checker**: Line-by-line comparison using custom LCS diffing.
*   **QR Code Generator**: Generate custom QR codes with PNG downloads.
*   **Color Palette Generator**: Harmonious palettes (triadic, complementary) and shades.
*   **Markdown Previewer**: Live Markdown viewer.

### 🤖 AI Engineering
*   **AI Prompt Template Builder**: Build structural role-play, chain-of-thought, and refactoring prompts.
*   **JSON Schema Generator**: Design structural output schemas for LLM responses.

---

## 📦 Local Setup & Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Start Dev Server**:
    ```bash
    npm run dev
    ```
3.  **Build Production Build**:
    ```bash
    npm run build
    ```

---

## 🐳 Running with Docker

To run locally or host in a Docker environment:
```bash
# Build the Docker image
docker build -t devforge:latest .

# Run container locally on port 8085
docker run -d -p 8085:80 devforge:latest
```
*Official Docker Hub Registry: [srikanthkodali9/devforge](https://hub.docker.com/r/srikanthkodali9/devforge)*

---

## 🍴 Forking & Customization Guide

If you want to add your own developer tools or customize the theme, follow this guide to fork and update DevForge:

### 1. How to Fork & Clone
1. Click the **Fork** button at the top right of this GitHub repository.
2. Clone your personal fork to your machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/DevForge.git
   cd DevForge
   ```

### 2. How to Add a Custom Tool
DevForge is designed to be highly modular. Adding a new tool takes just two steps:

1. **Create the Tool Component**:
   Write your interactive tool component in the appropriate file inside `src/components/tools/` (or create a new file). For example:
   ```typescript
   export function MyCustomTool() {
     return (
       <div className="tool-workspace-layout">
         <div className="glass-panel tool-controls-panel">
           {/* Inputs & Controls */}
         </div>
         <div className="glass-panel output-panel">
           {/* Outputs */}
         </div>
       </div>
     );
   }
   ```
2. **Register the Tool**:
   In `src/App.tsx`, import your new component and add it to the `tools` array definition:
   ```typescript
   import { MyCustomTool } from './components/tools/MyCustomTools';
   
   // ...
   const tools: ToolItem[] = [
     // ...
     {
       id: 'my-custom-tool',
       name: 'My Custom Tool',
       description: 'Brief description of what my tool does.',
       category: 'devops', // Category options: crypto, converters, webdev, text, design, k8s, ai, cicd, devops
       icon: Settings,      // Lucide icon component
       component: MyCustomTool,
     },
   ];
   ```

### 3. Build & Test
Verify that the project builds cleanly without TypeScript or bundler errors:
```bash
npm run build
```

---

## 🤝 Contributing

Contributions are welcome! If you've built a useful utility tool, please share it:

1. **Fork** the repository.
2. Create your feature branch (`git checkout -b feature/amazing-tool`).
3. Commit your changes (`git commit -m 'feat: add awesome new tool'`).
4. Push to the branch (`git push origin feature/amazing-tool`).
5. Open a **Pull Request** against the `main` branch of this repository.

