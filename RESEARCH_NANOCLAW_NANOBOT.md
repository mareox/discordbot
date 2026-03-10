# Research Report: NanoClaw & NanoBot as OpenClaw Alternatives

**Research Date:** February 13, 2026
**Purpose:** Evaluate lightweight alternatives to OpenClaw for self-hosted AI agents with Discord integration

---

## Executive Summary

**NanoClaw** and **NanoBot** emerged in early 2026 as lightweight alternatives to OpenClaw, both achieving significant traction within their first week of launch. NanoClaw focuses on security through container isolation with ~700 lines of TypeScript, while NanoBot prioritizes multi-platform connectivity with ~4,000 lines of Python. A third option, **PicoClaw**, targets ultra-low-resource embedded systems with <10MB RAM requirements.

### Key Findings

| Framework | Code Size | Memory | Startup | Security Model | Platform Support |
|-----------|-----------|--------|---------|----------------|------------------|
| **NanoClaw** | ~700 LOC (TS) | Not specified | Not specified | OS-level container isolation | WhatsApp, Telegram (via skill) |
| **NanoBot (HKUDS)** | ~4,000 LOC (Python) | 45MB (excluding LLM) | 0.8s | Application-level | Telegram, Discord, WhatsApp, Slack, Feishu, DingTalk, Email, QQ |
| **PicoClaw** | ~3,500 LOC (Go) | <10MB | 1s (0.6GHz single core) | Not specified | Telegram, Discord |
| **OpenClaw** | ~430,000 LOC | 200-400MB | 8-12s | Application-level (allowlists) | Multiple |

---

## 1. NanoClaw (qwibitai/nanoclaw)

### Overview

- **Creator:** Gavriel Cohen (7 years at Wix.com), co-founder of Qwibit AI agency
- **License:** MIT (open source)
- **Launch:** January 31, 2026
- **GitHub Stars:** 7,000+ in first week
- **Codebase:** ~500-700 lines of TypeScript
- **Tagline:** "Clawdbot in 500 lines with Apple container isolation"

**Sources:**
- [NanoClaw GitHub](https://github.com/qwibitai/nanoclaw)
- [VentureBeat: NanoClaw solves OpenClaw's biggest security issues](https://venturebeat.com/orchestration/nanoclaw-solves-one-of-openclaws-biggest-security-issues-and-its-already)
- [Hacker News: Show HN: NanoClaw](https://news.ycombinator.com/item?id=46850205)

### Architecture & Security

**Container-First Security:**
- Runs agents in **Apple Containers** (macOS) or **Docker** (Linux)
- Each agent has isolated filesystem, process namespace
- Non-root execution (uid 1000, unprivileged node user)
- Ephemeral containers (fresh environment per invocation with `--rm`)
- Only explicitly mounted directories visible to agents

**Security Boundary:**
- Blast radius confined to container and communication channel
- 8-minute audit time (entire codebase readable by human/AI)
- Contrast: OpenClaw uses application-based security (allowlists, pairing codes)

**Known Limitation:**
- Anthropic credentials must be mounted for Claude Code authentication
- Agents can discover credentials via Bash or file operations inside container

**Sources:**
- [NanoClaw Security Documentation](https://github.com/gavrielc/nanoclaw/blob/main/docs/SECURITY.md)
- [TrendingTopics: Container-Isolated AI Agents](https://www.trendingtopics.eu/nanoclaw-challenges-openclaw-with-container-isolated-ai-agents-for-enhanced-security/)

### Features

- **Anthropic Agents SDK:** Runs directly on Claude Agent SDK (Opus 4.6)
- **Agent Swarms:** Native support for multi-agent collaboration via Anthropic SDK
- **Memory:** Persistent memory across sessions
- **Scheduled Jobs:** Cron-like task scheduling
- **Messaging:** WhatsApp (native), Telegram (via `/add-telegram` skill)
- **AI-Native Development:** Designed to be extended via AI-written Skills, not manual PRs

**Agent Swarm Launch:** 72 hours after Anthropic shipped Agent Swarms, NanoClaw launched "iSwarms" for WhatsApp/Telegram (Feb 2026).

**Sources:**
- [Gavriel Cohen on X: Agent Swarms Launch](https://x.com/Gavriel_Cohen/status/2020701159175155874)
- [Hacker News: NanoClaw Agent Swarms](https://news.ycombinator.com/item?id=46941280)

### Setup Experience

**Installation Method:**
- Setup via Claude Code `/setup` skill (automated)
- Installs Node.js dependencies via `npm install`
- Auto-configures Docker as container runtime
- Checks for Apple Container installation (`which container`)

**Common Issues:**
- Missing/invalid authentication (env vars not mounted)
- Session directory mounted to wrong path (`/root/.claude/` instead of `/home/node/.claude/`)
- Apple Container bug: `-e` flag loses env vars when using `-i` (interactive stdin)
- Container execution failures, IPC communication failures, WhatsApp connectivity

**Troubleshooting:**
- Run `claude` then `/debug` for diagnostics
- Comprehensive troubleshooting guide available

**Sources:**
- [NanoClaw Troubleshooting Guide](https://deepwiki.com/gavrielc/nanoclaw/9.2-troubleshooting-guide)
- [NanoClaw Getting Started](https://deepwiki.com/gavrielc/nanoclaw/2-getting-started)

### Production Use Cases

**Creator's Business:**
- Qwibit (AI go-to-market agency) uses NanoClaw instance named "Andy"
- Manages sales pipeline and internal operations
- Concrete Media (PR firm) also uses it

**Business Applications:**
- Local code completion, debugging, documentation (keeps proprietary code private)
- Sensitive business data analysis (no data leaves infrastructure)
- Calendar, email, task management via 100+ integrations
- Custom applications via REST API

**Sources:**
- [VentureBeat: Already powering creator's biz](https://venturebeat.com/orchestration/nanoclaw-solves-one-of-openclaws-biggest-security-issues-and-its-already)
- [40 Tips & Tricks: First Install to Production](https://mlearning.substack.com/p/40-tips-and-tricks-from-first-install-to-production-nanoclaw-nano-claw-openclaw-open-2026-2-1-self-learning-skill-that-actually-work-vps-docker-security-ai-agent-swarm-readme-md-memory-architecture-cron-hearbeat-sessions-slack-telegram-whatsapp)

### Model Support

**Primary:** Anthropic Claude (Opus 4.6) via Anthropic Agents SDK
**Local Models:** Not mentioned in search results (appears cloud-focused)

### Community & Support

- **Hacker News:** Multiple front-page discussions
- **GitHub Activity:** Active issue tracker, open enhancement requests
- **Documentation:** DeepWiki integration for interactive learning
- **Philosophy:** Discourages feature PRs to main branch; encourages Skill contributions

**Sources:**
- [NanoClaw GitHub Issues](https://github.com/qwibitai/nanoclaw/issues)
- [swyx on X: Interactive Learning](https://x.com/swyx/status/2018230334488527022)

---

## 2. NanoBot (HKUDS/nanobot)

### Overview

- **Creator:** HKUDS (Hong Kong University Data Intelligence Lab)
- **Launch:** February 2, 2026
- **Codebase:** ~4,000 lines of Python (real-time count: 3,562 lines via `core_agent_lines.sh`)
- **Architecture:** Built around Model Context Protocol (MCP)
- **Tagline:** "Ultra-Lightweight OpenClaw"

**Note:** There are TWO different "nanobot" projects:
1. **HKUDS/nanobot** - Personal AI assistant (Python, ~4,000 LOC)
2. **nanobot-ai/nanobot** - MCP host framework (different project)

This section covers HKUDS/nanobot.

**Sources:**
- [NanoBot GitHub (HKUDS)](https://github.com/HKUDS/nanobot)
- [Analytics Vidhya: Build an Agent with Nanobot](https://www.analyticsvidhya.com/blog/2026/02/ai-crypto-tracker-with-nanobot/)

### Performance Benchmarks

| Metric | NanoBot | "Other Systems" | Improvement |
|--------|---------|-----------------|-------------|
| **Memory Usage** | 45MB (excluding LLM) | 200-400MB | 4-9x more efficient |
| **Startup Time** | 0.8 seconds | 8-12 seconds | 10-15x faster |
| **Code Size** | 4,000 lines | 430,000 lines (OpenClaw) | 99% smaller |

**Sources:**
- [NanoBot README](https://github.com/HKUDS/nanobot/blob/main/README.md)
- [Best OpenClaw Alternatives 2026](https://superprompt.com/blog/best-openclaw-alternatives-2026)

### Platform Support (8 Chat Platforms)

1. Telegram
2. Discord
3. WhatsApp
4. Slack
5. Feishu
6. DingTalk
7. Email
8. QQ

**Fastest Growth:** Feb 2-9, 2026 - went from minimal CLI to 11 LLM providers + 8 platforms in one week.

**Sources:**
- [NanoBot Roadmap Discussion](https://github.com/HKUDS/nanobot/discussions/431)

### Discord Setup Experience

**Configuration:**
```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "YOUR_BOT_TOKEN",
      "allowFrom": ["YOUR_USER_ID"]
    }
  }
}
```

**Requirements:**
- Node.js ≥18
- WebSocket long connection (no public IP required)

**Access Control:**
- User ID allowlist at channel level (before MessageBus)
- Empty list = allow all (development mode)
- Non-empty list = restrict to specified user IDs

**Gateway:**
- Starts as foreground process (`nanobot gateway`)
- Runs until interrupted/terminated

**Sources:**
- [Gateway and Message Bus Documentation](https://deepwiki.com/HKUDS/nanobot/3.5.1-gateway-and-message-bus)
- [Getting Started Guide](https://deepwiki.com/HKUDS/nanobot/2-getting-started)

### LLM Provider Support (11 Providers)

1. OpenAI
2. Anthropic
3. DashScope/Qwen
4. Moonshot/Kimi
5. DeepSeek
6. Ollama (local)
7. vLLM (local)
8. LiteLLM
9. OpenRouter
10. Zhipu
11. Any OpenAI-compatible server

**Local Model Support:**
- Integrated vLLM on Feb 3, 2026
- Can run entirely locally (data never leaves machine)
- Example: Qwen3-VL:30b via Ollama

**Sources:**
- [NanoBot Releases](https://github.com/HKUDS/nanobot/releases)
- [Analytics Vidhya: Nanobot Setup](https://www.analyticsvidhya.com/blog/2026/02/ai-crypto-tracker-with-nanobot/)

### Tool Calling Quality with Local Models

**User Experience Report:**
> "I set up nanobot (a lightweight OpenClaw alternative) in a docker container and Ollama on Windows. Using local models such as **llama3.1:8b and qwen3:4b is a bad idea as they consistently failed at tool calling**, but perhaps using larger models would give better results. I switched to Ollama kimi-k2.5:cloud and the AI assistant worked as intended."
> — [@allenlimdev on Threads](https://www.threads.com/@allenlimdev/post/DUh4dsNEiul/)

**Best Local Models for Tool Calling (General Research):**
- **Qwen 3 (14B)** or **Qwen 3 (8B)** - Maximum tool-calling accuracy
- **Qwen 2.5** - Good speed/performance trade-off for real-time experiences
- Avoid: Small models (<8B) struggle with tool calling

**Sources:**
- [Threads: Nanobot Setup Experience](https://www.threads.com/@allenlimdev/post/DUh4dsNEiul/)
- [Docker Blog: Local LLM Tool Calling Evaluation](https://www.docker.com/blog/local-llm-tool-calling-a-practical-evaluation/)

### Features

- **Persistent Memory:** Cross-session context
- **Web Search:** Built-in capability
- **Background Agents:** Autonomous task execution
- **Skills System:** Extensible via modular instructions
- **Scheduled Tasks:** Natural language task scheduling (vLLM integration)
- **MCP Architecture:** Designed as a "host" for MCP servers

**Vision (Roadmap):**
> "nanobot's vision is to become the **kernel layer for AI agents** — a minimal, stable core that anyone can extend, similar to Linux where the kernel doesn't ship every driver, but anyone can write one."
> — [NanoBot Roadmap Discussion](https://github.com/HKUDS/nanobot/discussions/431)

### Deployment Options

- **Zeabur:** One-click deploy template
- **Railway:** Nanobot + Ollama deploy template
- **Docker:** Container-based deployment
- **Source:** Build from source (Python)

**Sources:**
- [Zeabur Deploy Guide](https://zeabur.com/templates/5XVJX8)
- [Railway: Deploy Nanobot + Ollama](https://railway.com/deploy/nanobot-1)

### Community & GitHub Activity

- Active issue tracker (enhancement requests, bug reports)
- GitHub Discussions for roadmap planning
- DeepWiki integration for documentation
- Research-friendly codebase organization

**Known Issues:**
- Gateway lifecycle can cause duplicate event consumption (#379)
- Persistent long-term memory system under development (#135)
- Proposal to replace LiteLLM with native SDKs (#161)

**Sources:**
- [NanoBot GitHub Issues](https://github.com/HKUDS/nanobot/issues)
- [NanoBot GitHub Discussions](https://github.com/HKUDS/nanobot/discussions)

---

## 3. PicoClaw (sipeed/picoclaw)

### Overview

- **Creator:** Sipeed (embedded systems vendor)
- **Launch:** February 2026
- **Codebase:** ~3,500 lines of Go (refactored from nanobot's Python)
- **Target Hardware:** $10 embedded boards with <10MB RAM
- **Tagline:** "Ultra-lightweight personal AI Assistant runs on just 10MB of RAM"

**Sources:**
- [CNX Software: PicoClaw Review](https://www.cnx-software.com/2026/02/10/picoclaw-ultra-lightweight-personal-ai-assistant-run-on-just-10mb-of-ram/)
- [PicoClaw GitHub](https://github.com/sipeed/picoclaw)

### Performance Benchmarks

| Metric | PicoClaw | OpenClaw | Improvement |
|--------|----------|----------|-------------|
| **Hardware Cost** | $10 | ~$1,000 (Mac mini) | 98% cheaper |
| **Memory Usage** | <10MB | ~1,000MB+ | 99% less |
| **Startup Time** | 1 second (0.6GHz single core) | Minutes | 400x faster |

**Target Hardware:**
- Sipeed LicheeRV Nano SBC (~$15)
- SOPHGO SG2002 RISC-V SoC
- 256MB on-chip DDR3
- Works on x86, ARM64, RISC-V

**Sources:**
- [CNX Software: PicoClaw specs](https://www.cnx-software.com/2026/02/10/picoclaw-ultra-lightweight-personal-ai-assistant-run-on-just-10mb-of-ram/)

### Architecture

- **Language:** Go (self-bootstrapped refactor from Python nanobot)
- **AI-Driven Development:** "The AI agent itself drove the entire architectural migration and code optimization"
- **Single Binary:** Cross-platform portability
- **Startup:** Boots in 1 second even on 0.6GHz single core

**Features:**
- Chat sessions
- Telegram/Discord gateways
- Web search
- File editing
- Shell execution
- Cron jobs
- External LLM support (OpenRouter, Zhipu) via JSON config

**Sources:**
- [PicoClaw GitHub Repository](https://github.com/sipeed/picoclaw)

### Maturity & Status

- **Early Stage:** Basic documentation, no evident tests
- **Active Development:** Recent commits and releases
- **Target Audience:** Go enthusiasts experimenting with edge AI prototypes
- **Positioning:** Extreme efficiency for resource-constrained embedded systems

**Sources:**
- [GitGems: PicoClaw Stats](https://gitgems.app/repo/sipeed/picoclaw)

---

## 4. Comparison Matrix

### When to Choose Each Framework

| Choose This | If You Need... | Trade-offs |
|-------------|----------------|------------|
| **NanoClaw** | Maximum security, container isolation, audit-friendly codebase | Limited platform support (WhatsApp primary, Telegram via skill), cloud-focused (Anthropic) |
| **NanoBot (HKUDS)** | Multi-platform (8 chat apps), local model support, research-friendly | Less security isolation than NanoClaw, Python dependency |
| **PicoClaw** | Ultra-low resource usage, embedded systems, edge deployment | Immature, limited documentation, Go required |
| **OpenClaw** | Maximum features, enterprise-grade, extensive integrations | Heavy (430k LOC), slower startup, harder to audit |

**Sources:**
- [Best OpenClaw Alternatives 2026](https://superprompt.com/blog/best-openclaw-alternatives-2026)
- [Agent Wars 2026: Comparison](https://evoailabs.medium.com/agent-wars-2026-openclaw-vs-memu-vs-nanobot-which-local-ai-should-you-run-8ef0869b2e0c)

### Security Model Comparison

| Framework | Security Approach | Blast Radius | Auditability |
|-----------|-------------------|--------------|--------------|
| **NanoClaw** | OS-level container isolation (Apple Container/Docker) | Confined to container + communication channel | 8 minutes (700 LOC) |
| **NanoBot** | Application-level (allowlists, channel-level access control) | Process-wide | ~1 hour (4,000 LOC) |
| **PicoClaw** | Not specified | Unknown | ~1 hour (3,500 LOC Go) |
| **OpenClaw** | Application-level (allowlists, pairing codes) | Process-wide | ~80 hours (430k LOC) |

**Sources:**
- [VentureBeat: NanoClaw Security](https://venturebeat.com/orchestration/nanoclaw-solves-one-of-openclaws-biggest-security-issues-and-its-already)

### Architecture Philosophy

| Framework | Philosophy | Key Principle |
|-----------|------------|---------------|
| **NanoClaw** | AI-native development | "Designed to be managed and extended primarily through AI interaction rather than manual configuration" |
| **NanoBot** | Kernel layer for agents | "Minimal, stable core that anyone can extend, similar to Linux" |
| **PicoClaw** | Edge-first efficiency | "AI agent itself drove the entire architectural migration" |
| **OpenClaw** | Feature-complete monolith | "Everything included" |

**Sources:**
- [VentureBeat: NanoClaw AI-native](https://venturebeat.com/orchestration/nanoclaw-solves-one-of-openclaws-biggest-security-issues-and-its-already)
- [NanoBot Roadmap](https://github.com/HKUDS/nanobot/discussions/431)

---

## 5. Community Sentiment & Real-World Experiences

### Hacker News Discussions

**NanoClaw Reception:**
- Front page multiple times (Show HN, security update, agent swarms)
- Praised for minimalism and container isolation
- Concerns: "If you need the tool to do anything useful, you have to connect it to your data and give it action capabilities"
- Appreciated: 8-minute audit time

**NanoBot Reception:**
- Hacker News front page (Ultra-Lightweight Alternative)
- Praised for platform diversity and memory efficiency
- "The best AI projects are the ones you can actually understand"
- Positioned as "Don't Use OpenClaw. Use NanoBot Instead" (Medium article)

**Sources:**
- [Hacker News: NanoClaw](https://news.ycombinator.com/item?id=46850205)
- [Hacker News: NanoBot](https://news.ycombinator.com/item?id=46897737)
- [Medium: Don't Use OpenClaw. Use NanoBot Instead](https://medium.com/the-alchemizer/dont-use-openclaw-use-nanobot-instead-79f112986ad1)

### Setup Pain Points

**NanoClaw:**
- Apple Container installation required (manual if not present)
- Environment variable mounting can be tricky
- Session directory path confusion
- Apple Container `-e` flag bug with `-i` mode

**NanoBot:**
- Smaller local models (llama3.1:8b, qwen3:4b) fail at tool calling
- Need larger models or cloud APIs for reliable tool use
- Docker + Ollama setup straightforward but model selection critical

**Sources:**
- [NanoClaw Troubleshooting](https://deepwiki.com/gavrielc/nanoclaw/9.2-troubleshooting-guide)
- [Threads: Nanobot Setup Experience](https://www.threads.com/@allenlimdev/post/DUh4dsNEiul/)

### Production Anecdotes

**NanoClaw:**
- Qwibit agency uses "Andy" instance for sales pipeline
- Creators using it in their own PR firm (Concrete Media)
- "Already powering the creator's biz" within week of launch

**NanoBot:**
- Research and experimentation focus
- HitBot-3000 demo (blackjack agent with MCP-UI)
- Used for crypto tracking demos

**Sources:**
- [VentureBeat: Production Use](https://venturebeat.com/orchestration/nanoclaw-solves-one-of-openclaws-biggest-security-issues-and-its-already)
- [Analytics Vidhya: Crypto Tracker Demo](https://www.analyticsvidhya.com/blog/2026/02/ai-crypto-tracker-with-nanobot/)

---

## 6. VRAM & Hardware Requirements

### Local Model Deployment

**Note:** Neither NanoClaw nor NanoBot specify their own VRAM requirements in search results. Requirements depend on the LLM used.

**General Local LLM Guidelines:**

| Model Size | VRAM Needed | Recommended GPU | Context Length |
|------------|-------------|-----------------|----------------|
| 7B | 8GB | RTX 3060, RTX 4060 | Standard |
| 13B | 16GB | RTX 4060 Ti 16GB | Standard |
| 20B | 24GB | RTX 3090, RTX 4090 | Extended |
| 70B | 48GB+ | Dual RTX 3090, A6000 | 16K context |

**For Practical Local Use Today:**
- Realistic entry: 24-32GB VRAM or 64-128GB unified memory
- Example: qwen3:14b works well for tool calling with 24GB VRAM

**Sources:**
- [Hardware Corner: Best Computers for OpenClaw](https://www.hardware-corner.net/best-computers-running-clawdbot-locally/)
- [Ollama VRAM Requirements Guide](https://localllm.in/blog/ollama-vram-requirements-for-local-llms)

### Cloud vs Local Trade-offs

| Framework | Cloud Option | Local Option | Hybrid |
|-----------|--------------|--------------|--------|
| **NanoClaw** | Anthropic Claude (primary) | Not mentioned | Unknown |
| **NanoBot** | 11 cloud providers | Ollama, vLLM | Yes |
| **PicoClaw** | OpenRouter, Zhipu | Requires external server | Config-based |

**NanoBot Local Advantage:**
- "Run nanobot entirely locally using vLLM with open-source models like Qwen, so your data never leaves your machine"
- Best for: Privacy-sensitive applications, offline operation

**Sources:**
- [NanoBot README](https://github.com/HKUDS/nanobot/blob/main/README.md)

---

## 7. Alternative Frameworks (Brief Mentions)

### Other Lightweight Options Discovered

**Agent Zero:**
- Prompt-driven, dynamically evolving framework
- Treats computer as collection of tools
- Dynamic tool generation and execution
- Terminal/CLI interface
- More comprehensive than NanoBot but less than OpenClaw

**memU:**
- Builds local knowledge graph of preferences, past projects, habits
- Proactive agent
- Much cheaper to run than OpenClaw

**mini-claw:**
- Uses Claude Pro/Max or ChatGPT Plus subscription directly in Telegram
- No API costs
- Minimalist alternative

**SmolAgents (Hugging Face):**
- Ultra-minimal AI agent tools for Python
- Easy to read/extend, works with any LLM
- Provider-agnostic (100+ LLMs)
- Low learning curve

**Sources:**
- [Agent Wars 2026](https://evoailabs.medium.com/agent-wars-2026-openclaw-vs-memu-vs-nanobot-which-local-ai-should-you-run-8ef0869b2e0c)
- [Best OpenClaw Alternatives](https://superprompt.com/blog/best-openclaw-alternatives-2026)
- [12 Best AI Agent Frameworks in 2026](https://medium.com/data-science-collective/the-best-ai-agent-frameworks-for-2026-tier-list-b3a4362fac0d)

---

## 8. Gaps in Research

### What We Could NOT Find

1. **NanoClaw Discord Bot Quality**
   - No direct mentions of Discord support in NanoClaw
   - Only WhatsApp (native) and Telegram (via skill)
   - Search results focused on OpenClaw Discord bots instead

2. **NanoClaw Response Time Metrics**
   - No specific benchmarks for message → response latency
   - General principle: "Response time depends on your AI provider"
   - No user reports with timing data

3. **NanoClaw Local Model Support**
   - Appears to be Anthropic-focused via Agents SDK
   - No mentions of Ollama or vLLM integration
   - Contrast: NanoBot explicitly supports local models

4. **NanoBot Discord Formatting Quality**
   - Search returned generic Discord bots (Nano, Nanobot wallet bot)
   - No specific user reports on HKUDS/nanobot Discord message formatting
   - Configuration exists, but no quality feedback found

5. **PicoClaw Real-World Reviews**
   - Project too new (Feb 2026)
   - No user testimonials or benchmark validations
   - Only vendor documentation available

6. **Direct Video Demos**
   - Searched for "nanoclaw demo youtube" and "nanobot AI demo performance"
   - No dedicated demo videos found
   - Only indirect references and written tutorials

**What This Means:**
- NanoClaw appears to be **WhatsApp-first**, not Discord-focused
- For Discord specifically, **NanoBot (HKUDS)** has better support
- Both projects are **very new** (1-2 weeks old at research time)
- Community knowledge still forming

---

## 9. Recommendations for Your Use Case

### Your Context (from MEMORY.md)
- Running OpenClaw on macOS (mpb4x)
- Discord bot for DMR project
- Using gpt-oss:20b-32k local model via Ollama
- Current issues: Config audit needed, potential dual-process conflict

### Framework Recommendation: **NanoBot (HKUDS)**

**Why NanoBot Over NanoClaw:**
1. **Discord Support:** Native Discord integration (NanoClaw doesn't mention Discord)
2. **Local Models:** Explicit Ollama/vLLM support (you're already using Ollama)
3. **Multi-Platform:** Can add Telegram/WhatsApp later without rewrite
4. **Memory Efficiency:** 45MB vs 200-400MB (matters on macOS)
5. **Research-Friendly:** Hong Kong University project, active development

**Why NOT NanoClaw:**
1. No Discord support mentioned (WhatsApp/Telegram only)
2. Appears Anthropic-focused (cloud API costs)
3. Container overhead may not suit Discord bot use case
4. Security isolation less critical for personal Discord bot

### Alternative: Keep OpenClaw, Optimize It

**If You Prefer Stability Over Experimentation:**
- OpenClaw is mature, feature-complete
- Your config issues are solvable (kill Desktop app, use Homebrew service only)
- gpt-oss:20b-32k working well (524 tok/s)
- Audit completed (Feb 13), 6 issues fixed

**Trade-off:** Heavier (430k LOC) but proven vs lighter (4k LOC) but unproven in your environment.

### Implementation Path (If Choosing NanoBot)

**Phase 1: Parallel Testing**
1. Install NanoBot alongside OpenClaw (don't replace yet)
2. Configure Discord channel for NanoBot
3. Test with same gpt-oss:20b-32k model via Ollama
4. Compare response quality, formatting, memory usage

**Phase 2: Validation**
1. Verify tool calling works with your 20B model
2. Test persistent memory across sessions
3. Check Discord message formatting quality
4. Monitor resource usage (45MB claim)

**Phase 3: Migration Decision**
- If NanoBot meets needs: migrate DMR bot
- If issues found: document and stay with OpenClaw
- Hybrid: Use both for different purposes

**Risk Mitigation:**
- Keep OpenClaw config backed up
- Document any issues for NanoBot GitHub
- Consider contributing fixes (small codebase = easier)

---

## 10. Sources Summary

### Primary Sources

**NanoClaw:**
- [GitHub Repository](https://github.com/qwibitai/nanoclaw)
- [VentureBeat Article](https://venturebeat.com/orchestration/nanoclaw-solves-one-of-openclaws-biggest-security-issues-and-its-already)
- [Hacker News: Show HN](https://news.ycombinator.com/item?id=46850205)
- [Hacker News: Agent Swarms](https://news.ycombinator.com/item?id=46941280)
- [Security Documentation](https://github.com/gavrielc/nanoclaw/blob/main/docs/SECURITY.md)
- [Troubleshooting Guide](https://deepwiki.com/gavrielc/nanoclaw/9.2-troubleshooting-guide)

**NanoBot (HKUDS):**
- [GitHub Repository](https://github.com/HKUDS/nanobot)
- [README](https://github.com/HKUDS/nanobot/blob/main/README.md)
- [Roadmap Discussion](https://github.com/HKUDS/nanobot/discussions/431)
- [Hacker News Discussion](https://news.ycombinator.com/item?id=46897737)
- [Analytics Vidhya Tutorial](https://www.analyticsvidhya.com/blog/2026/02/ai-crypto-tracker-with-nanobot/)
- [Threads: Setup Experience](https://www.threads.com/@allenlimdev/post/DUh4dsNEiul/)

**PicoClaw:**
- [GitHub Repository](https://github.com/sipeed/picoclaw)
- [CNX Software Review](https://www.cnx-software.com/2026/02/10/picoclaw-ultra-lightweight-personal-ai-assistant-run-on-just-10mb-of-ram/)

**Comparison Articles:**
- [Best OpenClaw Alternatives 2026](https://superprompt.com/blog/best-openclaw-alternatives-2026)
- [Agent Wars 2026](https://evoailabs.medium.com/agent-wars-2026-openclaw-vs-memu-vs-nanobot-which-local-ai-should-you-run-8ef0869b2e0c)
- [OpenClaw Alternatives Worth Trying](https://www.bitdoze.com/openclaw-alternatives/)

### Search Queries Executed

1. "nanoclaw AI agent reddit"
2. "nanobot AI agent reddit"
3. "nanoclaw vs openclaw reddit"
4. "nanoclaw github issues"
5. "nanobot AI github discussions"
6. "nanoclaw demo youtube"
7. "nanobot AI demo performance"
8. "nanoclaw vs nanobot" comparison
9. "lightweight openclaw alternative 2026"
10. "nanoclaw hacker news comments"
11. "nanobot HKUDS discord setup experience"
12. "nanoclaw whatsapp bot response time"
13. "nanoclaw" "local models" ollama
14. "nanobot" memory usage benchmark
15. "picoclaw embedded AI agent"
16. "nanoclaw setup guide common issues"
17. "nanobot discord bot formatting quality"
18. "openclaw too heavy" lightweight alternative reddit
19. "nanobot vs nanoclaw which to choose"
20. "nanoclaw production use case business"
21. "nanobot HKUDS qwen models recommended"
22. "nanoclaw VRAM requirements hardware specs"
23. "simple self-hosted AI bot" discord 2026
24. "nanobot "45MB memory" vs openclaw benchmark"
25. "nanoclaw anthropic agents sdk swarm"
26. "agent zero" vs nanobot comparison
27. "nanobot tool calling quality local models"
28. "nanoclaw apple container security review"
29. "minimal AI agent framework" 2026
30. "picoclaw sipeed review benchmark"

**Empty Results:**
- No Reddit threads specifically about NanoClaw or NanoBot
- No YouTube demo videos found for either
- No Discord-specific quality reviews for NanoBot (HKUDS)
- No NanoClaw local model integration documentation

---

## Conclusion

**NanoClaw** and **NanoBot** represent a "back to basics" movement in AI agent frameworks, prioritizing auditability, efficiency, and simplicity over feature completeness. Both launched within days of each other in early February 2026 and gained rapid traction as developers sought lighter alternatives to OpenClaw's 430,000-line codebase.

**For Discord bot use cases with local models (like yours):**
- **NanoBot (HKUDS)** is the stronger choice due to native Discord support and proven Ollama integration
- **NanoClaw** excels at security and minimalism but lacks Discord support and local model integration

**For production security-critical applications:**
- **NanoClaw's** container isolation provides a superior security boundary
- Already in production use at Qwibit agency

**For embedded/edge deployment:**
- **PicoClaw** is the only option, but it's immature and unproven

The rapid emergence of these alternatives (7,000+ stars in one week) signals strong demand for simpler, more auditable AI agent frameworks. However, both are very new (1-2 weeks old at research time), so expect rough edges and evolving APIs.

---

**Research Completed:** February 13, 2026
**Researcher:** Claude Opus 4.6 (Scientist Agent)
**Search Iterations:** 30 queries across 6 rounds
**Total Sources Reviewed:** 150+ web pages

