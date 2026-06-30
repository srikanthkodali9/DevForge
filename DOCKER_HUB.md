# DevForge - Developer Utilities Suite 🛠️

**DevForge** (`srikanthkodali9/devforge`) is a premium, client-side developer utility web application designed to simplify day-to-day coding, conversion, debugging, and DevOps operations. Inspired by `it-tools`, DevForge runs entirely in the browser (100% stateless) with a high-fidelity glassmorphism dark/light interface, custom favorites tagging, and local search.

*All data processing is performed directly in your browser. No server backend, no data transmission, completely secure.*

---

## 🚀 Key Features

*   **100% Client-Side & Stateless**: No logs, no telemetry, no tracking. Your tokens, keys, and configurations never leave your machine.
*   **Developer-Prioritized Layout**: Core DevOps, CI/CD, Kubernetes, and AI tools are placed at the top of the sidebar.
*   **Vibrant & Modern UI**: Smooth theme transitions, glassmorphic panels, hover glow states, and layout persistence.
*   **Search & Favorites**: Instantly filter tools by keyword or pin your most-used tools to the dashboard.
*   **Ultra-lightweight Image**: The multi-stage Alpine Docker image compiles down to just ~25MB.

---

## ⚡ Quick Start

### 1. Run with Docker CLI
To spin up DevForge on port `8085`:
```bash
docker run -d \
  --name devforge \
  -p 8085:80 \
  --restart unless-stopped \
  srikanthkodali9/devforge:latest
```
Visit `http://localhost:8085` in your browser.

### 2. Run with Docker Compose
Create a `docker-compose.yml` file:
```yaml
version: '3.8'

services:
  devforge:
    image: srikanthkodali9/devforge:latest
    container_name: devforge
    ports:
      - "8085:80"
    restart: unless-stopped
```
Launch the service:
```bash
docker-compose up -d
```

---

## 🛠️ Tool Suite Highlights

*   **🤖 AI Engineering**: LLM structured JSON schema generator, system role prompt template builder, and narrative prompt generator for ComfyUI Nanobanana/Stable Diffusion.
*   **⛵ Kubernetes**: Deployment/Service YAML manifest builder, kubectl command generator, kubeconfig merger, resource unit converter, and `.env` parser.
*   **⚙️ CI/CD Pipelines**: GitHub Actions workflow builder, GitLab CI/CD pipeline generator, Groovy Jenkinsfile pipeline builder, and ArgoCD application/workflows manifest generators.
*   **🐳 DevOps & Containers**: `docker run` to `docker-compose` converter, multi-stage Dockerfile generator, CIDR subnet calculator (with binary tree visualizer), Splunk query generator, and Prometheus alert rules builder.
*   **🔐 Cryptography**: Native Web Crypto Hash generator (SHA-256, SHA-512, SHA-1, MD5 file/text), UUID/ULID bulk generator, strong Password generator, and color-coded JWT decoder.
*   **🔄 Converters & Formatters**: JSON-YAML converter, Base64/URL encoders and decoders, and JSON formatter/validator.
*   **🎨 Design & Text**: Color Picker & Space Palettes ( Never-ending Gradients, triadic, analogous, dusty pastel matching schemes), QR Code generator with PNG downloads, Diff checker (LCS algorithm), and Markdown previewer.

---

## 🔒 Security & Privacy

DevForge operates strictly under client-side execution guidelines. Because there is no backend API, you can safely parse production JWTs, generate cryptographically secure credentials, calculate corporate subnets, and build complex infrastructure manifests with absolute privacy. 
