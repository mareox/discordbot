# Discord Bot - Direct Message Router

Forwards Discord direct messages and @mentions to n8n webhooks for automated processing. Includes Express API endpoints for journal review requests and notifications.

## Features

- **Direct Message Forwarding**: Routes incoming DMs to n8n webhooks with message context
- **Channel Mentions**: Captures and forwards @mentions in channels
- **Journal Review Integration**: Express API endpoint for blog post approval workflows
- **Notification API**: Send custom Discord notifications programmatically
- **Type-Safe**: Built with TypeScript and discord.js v14

## Quick Start

### Prerequisites

- Node.js 20+
- Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
- n8n webhook URL (optional)

### Setup

1. Clone and install:
```bash
npm install
```

2. Create `.env` file:
```bash
DISCORD_BOT_TOKEN=your_token_here
N8N_WEBHOOK_URL=https://n8n.loc.mareoxlan.com/webhook/discordbot-dmr
JOURNAL_CHANNEL_ID=your_channel_id
API_PORT=3000
```

3. Build and run:
```bash
npm run dev          # Development mode
npm run build        # TypeScript compilation
npm start            # Production mode
```

## Deployment

### Docker

```bash
docker compose up -d --build
docker compose logs -f discordbot-dmr
```

### Infrastructure

| Property | Value |
|----------|-------|
| Hostname | discordbot-dmr.mareoxlan.local |
| IP | 192.168.30.68 |
| VM ID | 30068 (pve-mini3) |
| Container | Debian 12 LXC on ZFS |
| Path | `/opt/discordbot-dmr/` |

## Webhook Integration

The bot forwards messages to n8n in the following format:

```json
{
  "type": "direct_message",
  "userId": "123456789",
  "message": "Message content",
  "channelId": "987654321"
}
```

See [CLAUDE.md](./CLAUDE.md) for n8n workflow setup instructions.

## API Endpoints

### Health Check
```bash
GET /health
```

### Journal Review Request
```bash
POST /api/journal-review
Content-Type: application/json

{
  "draftId": "draft-123",
  "title": "Blog Post Title",
  "postType": "journal",
  "subsystem": "pihole",
  "filePath": "content/journal/2026-01-30-post.md",
  "validation": {"score": 85, "qualityLevel": "good", "wordCount": 500},
  "approveUrl": "https://n8n.loc.mareoxlan.com/webhook/journal-approve?id=draft-123&action=approve",
  "rejectUrl": "https://n8n.loc.mareoxlan.com/webhook/journal-approve?id=draft-123&action=reject"
}
```

### Send Notification
```bash
POST /api/notify
Content-Type: application/json

{
  "title": "Notification Title",
  "description": "Notification description",
  "color": 5763719,
  "fields": [{"name": "URL", "value": "https://example.com"}]
}
```

## Environment Variables

| Variable | Required | Default |
|----------|----------|---------|
| `DISCORD_BOT_TOKEN` | Yes | - |
| `DISCORD_BOT_SECRET` | No | - |
| `N8N_WEBHOOK_URL` | No | - |
| `JOURNAL_CHANNEL_ID` | No | - |
| `API_PORT` | No | 3000 |

## Discord Bot Configuration

1. Enable **Privileged Gateway Intents**:
   - MESSAGE CONTENT INTENT

2. Bot requires permissions:
   - Send Messages
   - Read Messages/View Channels

## Documentation

For detailed configuration, development, and troubleshooting, see [CLAUDE.md](./CLAUDE.md).

Part of [homelab-infra](https://github.com/mareox/homelab-infra)
