# CLAUDE.md

This file provides guidance to Claude Code when working with the discordbot-dmr project.

## Project Overview

Discord bot that forwards direct messages and @mentions to an n8n webhook for processing.

**Technology Stack:**
- Node.js 20+
- TypeScript
- discord.js v14
- Docker for deployment

## What It Does

1. Listens for **direct messages** → forwards to n8n webhook with `type: 'direct_message'`
2. Listens for **@mentions** in channels → forwards to n8n webhook with `type: 'channel_mention'`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `DISCORD_BOT_SECRET` | No | Client secret (for OAuth flows if needed) |
| `N8N_WEBHOOK_URL` | No | Webhook URL to forward messages to |
| `JOURNAL_CHANNEL_ID` | No | Channel ID for journal pipeline notifications |
| `API_PORT` | No | Express API port (default: 3000) |

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
npm start

# Build and run in one command
npm run dev
```

## Docker Deployment

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f discordbot-dmr

# Restart
docker compose restart discordbot-dmr
```

## Deployment Target

| Setting | Value |
|---------|-------|
| **Hostname** | discordbot-dmr.mareoxlan.local |
| **IP Address** | 192.168.30.68 |
| **VM ID** | 30068 |
| **Proxmox Node** | pve-mini3 (192.168.30.203) |
| **Type** | LXC Container (Debian 12) |
| **Storage** | zdata (ZFS) |
| **Docker Version** | 29.1.5 |
| **Bot Username** | n8n-proxmox-agent#7085 |

**Application Path:** `/opt/discordbot-dmr/`

**SSH Access:**
```bash
# Via Proxmox exec (most reliable)
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 "pct exec 30068 -- bash"

# Direct SSH (if configured)
ssh -i ~/.ssh/mareox-auth mareox@192.168.30.68
```

**Deployment Pattern:**
```bash
# Create tarball locally
cd /mnt/d/GIT/homelab-infra/discordbot-dmr
tar -cvf /tmp/discordbot-dmr.tar --exclude='.git' --exclude='node_modules' --exclude='dist' .

# Copy to Proxmox host
scp -i ~/.ssh/mareox-auth /tmp/discordbot-dmr.tar root@192.168.30.203:/tmp/

# Push to container and extract
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 "pct push 30068 /tmp/discordbot-dmr.tar /tmp/discordbot-dmr.tar && pct exec 30068 -- bash -c 'cd /opt/discordbot-dmr && tar -xvf /tmp/discordbot-dmr.tar && docker compose up -d --build'"
```

## Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable these **Privileged Gateway Intents**:
   - MESSAGE CONTENT INTENT
3. Bot permissions needed:
   - Send Messages
   - Read Messages/View Channels

## Webhook Payload Format

When a message is received, the bot POSTs to `N8N_WEBHOOK_URL`:

```json
{
  "type": "direct_message",  // or "channel_mention"
  "userId": "123456789",
  "message": "Hello bot!",
  "channelId": "987654321"   // only for channel_mention
}
```

## n8n Webhook Configuration

The bot forwards messages to an n8n webhook. To set up the n8n workflow:

**Import the Workflow:**
1. Go to https://n8n.mareoxlan.com (or n8n.loc.mareoxlan.com)
2. Click **Workflows** → **Import from File**
3. Import `n8n-webhook-workflow.json` from this directory
4. Activate the workflow

**Webhook URL Format:**
```
https://n8n.loc.mareoxlan.com/webhook/discordbot-dmr
```
or (internal):
```
http://192.168.30.62:5678/webhook/discordbot-dmr
```

**Update Container .env:**
```bash
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 \
  "pct exec 30068 -- bash -c \"echo 'N8N_WEBHOOK_URL=https://n8n.loc.mareoxlan.com/webhook/discordbot-dmr' >> /opt/discordbot-dmr/.env && cd /opt/discordbot-dmr && docker compose restart\""
```

## Completed Setup (2026-01-24)

All deployment steps have been completed:

- ✅ **NetBox IP Reservation**: 192.168.30.68/24 reserved (ID: 59)
- ✅ **n8n Workflow**: "Discord Bot DMR Handler" deployed and active
- ✅ **Webhook URL**: `https://n8n.mareoxlan.com/webhook/discordbot-dmr`
- ✅ **DNS Record**: discordbot-dmr.mareoxlan.local → 192.168.30.68
- ✅ **INFRASTRUCTURE.md**: Updated with service entry
- ✅ **LXC Notes**: Added to Proxmox container 30068

## API Endpoints

The bot exposes an Express API for sending messages programmatically.

### Health Check
```bash
curl http://192.168.30.68:3000/health
```

### Send Journal Review Request
```bash
curl -X POST http://192.168.30.68:3000/api/journal-review \
  -H "Content-Type: application/json" \
  -d '{
    "draftId": "draft-123",
    "title": "My Blog Post",
    "postType": "journal",
    "subsystem": "pihole",
    "filePath": "content/journal/2026-01-30-post.md",
    "validation": {"score": 85, "qualityLevel": "good", "wordCount": 500},
    "approveUrl": "https://n8n.loc.mareoxlan.com/webhook/journal-approve?id=draft-123&action=approve",
    "rejectUrl": "https://n8n.loc.mareoxlan.com/webhook/journal-approve?id=draft-123&action=reject"
  }'
```

### Send Simple Notification
```bash
curl -X POST http://192.168.30.68:3000/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "title": "PR Created",
    "description": "Your blog post PR is ready for review",
    "color": 5763719,
    "fields": [{"name": "URL", "value": "https://github.com/..."}]
  }'
```

## Journal Pipeline Integration

This bot is integrated with the homelab-journal content pipeline:

1. n8n workflow generates blog draft
2. n8n calls `/api/journal-review` to send Discord message with buttons
3. User clicks Approve/Reject button in Discord
4. Bot calls back to n8n approval webhook
5. n8n creates GitHub PR (if approved)

**n8n Workflow:** `homelab-journal-content-pipeline-v3.json`

## Related Documentation

- [discord.js Documentation](https://discord.js.org/)
- [Parent CLAUDE.md](../CLAUDE.md) - Repository-wide standards
- [Son-of-Anton](../../n8n-workflows/Son-of-anton/CLAUDE.md) - Related Discord bot workflow
- [Journal Pipeline](../../n8n-workflows/homelab-journal-pipeline/README.md) - Content automation
