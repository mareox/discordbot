# Self-Hosting Discord Bot Plan (Railway → Homelab)

## Executive Summary

This plan documents how to self-host a Discord bot that was originally designed for Railway deployment. Your setup is **already 90% complete** - the key difference between Railway and self-hosting is understanding the network architecture.

**Current Status**: ✅ Bot running, ✅ Webhook configured, ⚠️ Testing needed

---

## Architecture Comparison

### Railway Architecture (Cloud-Hosted)
```
Discord API ←→ [Railway Container] ←→ [Railway Public URL] ←→ n8n Webhook
                    ↑                        ↑
              Always online           Public HTTPS endpoint
              Auto-scaling            Railway handles TLS
```

### Self-Hosted Architecture (Your Setup)
```
Discord API ←→ [LXC 30068 Container] ←→ [Internal Network] ←→ n8n Webhook
                    ↑                          ↑
              192.168.30.68              https://n8n.mareoxlan.com
              Always online              Cloudflare tunnel provides public URL
```

---

## Key Insight: Why Ports Don't Matter for Discord Bots

`★ Insight ─────────────────────────────────────`
**Discord bots are OUTBOUND-only** - they don't listen on ports!

1. Your bot makes a **WebSocket connection TO Discord** (outbound)
2. Discord pushes messages through that WebSocket (no inbound needed)
3. Your bot POSTs to n8n webhook (outbound)

**No firewall rules or port forwarding needed for the bot itself.**
`─────────────────────────────────────────────────`

---

## What's Already Working

| Component | Status | Details |
|-----------|--------|---------|
| LXC Container | ✅ | 30068 on pve-mini3 (192.168.30.68) |
| Docker Runtime | ✅ | Docker 29.1.5 with Watchtower |
| Discord Bot | ✅ | Logged in as n8n-proxmox-agent#7085 |
| WebSocket to Discord | ✅ | Outbound connection established |
| n8n Workflow | ✅ | "Discord Bot DMR Handler" active |
| Webhook URL | ✅ | https://n8n.mareoxlan.com/webhook/discordbot-dmr |
| DNS A Record | ✅ | discordbot-dmr.mareoxlan.local |
| NetBox IP | ✅ | 192.168.30.68/24 (ID: 59) |

---

## Step 1: Verify Current Functionality (Test Matrix)

### 1.1 Test Discord → Bot Connection
**Already working** - Bot is online as "n8n-proxmox-agent#7085"

```bash
# Verify bot logs show it's connected
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 \
  "pct exec 30068 -- docker logs discordbot-dmr 2>&1 | tail -5"
```
Expected: `✅ Bot is online! Logged in as n8n-proxmox-agent#7085`

### 1.2 Test Bot → n8n Webhook Connectivity
This verifies the bot can reach your n8n webhook:

```bash
# From the container (simulates what the bot does)
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 "pct exec 30068 -- \
  docker exec discordbot-dmr wget -q -O - \
    --header='Content-Type: application/json' \
    --post-data='{\"type\":\"test\",\"userId\":\"test123\",\"message\":\"Connectivity test\"}' \
    https://n8n.mareoxlan.com/webhook/discordbot-dmr"
```

**Alternative test from WSL** (if container doesn't have wget/curl):
```bash
curl -X POST https://n8n.mareoxlan.com/webhook/discordbot-dmr \
  -H "Content-Type: application/json" \
  -d '{"type":"test","userId":"test123","message":"Connectivity test"}'
```

Expected response: `{"status":"received","type":"test","userId":"test123"}`

### 1.3 Test End-to-End (Discord DM → n8n)
1. Open Discord
2. Send a DM to your bot (n8n-proxmox-agent#7085)
3. Check bot logs:
   ```bash
   ssh -i ~/.ssh/mareox-auth root@192.168.30.203 \
     "pct exec 30068 -- docker logs discordbot-dmr --since 1m 2>&1"
   ```
4. Check n8n execution history:
   - Go to https://n8n.mareoxlan.com
   - Open "Discord Bot DMR Handler" workflow
   - Check "Executions" tab

---

## Step 2: Network Requirements (Already Met)

### 2.1 Outbound Access (Required) ✅
Your LXC container needs outbound HTTPS access:
- **discord.com** (gateway.discord.gg) - WebSocket connection
- **n8n.mareoxlan.com** - Webhook POST

These work by default on VLAN 30 - no firewall changes needed.

### 2.2 Inbound Access (NOT Required) ✅
Discord bots don't need inbound ports because:
- Discord pushes messages over the existing WebSocket
- The bot initiates all connections

### 2.3 DNS Resolution ✅
Container resolves hostnames via Pi-hole:
```bash
# Verify DNS works
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 \
  "pct exec 30068 -- docker exec discordbot-dmr nslookup n8n.mareoxlan.com"
```

---

## Step 3: If Webhook Test Fails (Troubleshooting)

### 3.1 DNS Resolution Issues
```bash
# Check if container can resolve n8n hostname
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 \
  "pct exec 30068 -- cat /etc/resolv.conf"
```
Should show Pi-hole VIP (192.168.10.110) or mx-fw (192.168.10.1).

### 3.2 TLS Certificate Issues
If using internal n8n URL, might need to trust internal CA:
```bash
# Try internal URL instead
curl -X POST http://192.168.30.62:5678/webhook/discordbot-dmr \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

### 3.3 Firewall Between VLANs
Container is on VLAN 30, n8n is on VLAN 30 - no cross-VLAN issues.

---

## Step 4: Bot Response Capability (Future Enhancement)

**Current limitation**: Your bot forwards messages TO n8n but cannot send responses BACK to Discord users.

### Current Flow
```
User DMs bot → Bot sends to n8n → n8n responds to bot (HTTP) → END
                                   ↓
                            Response is logged but
                            NOT sent back to Discord
```

### Enhanced Flow (Requires Code Change)
```
User DMs bot → Bot sends to n8n → n8n responds → Bot sends reply to user
```

**If you need the bot to reply to users**, the `src/bot.ts` needs modification to:
1. Wait for webhook response
2. Parse response body
3. Send message back via Discord API

This is **NOT REQUIRED** for the current use case (forwarding to n8n for processing).

---

## Step 5: Monitoring & Maintenance

### 5.1 Container Health Check
```bash
# Quick status check
ssh -i ~/.ssh/mareox-auth root@192.168.30.203 \
  "pct exec 30068 -- docker ps -a && docker logs discordbot-dmr --since 5m 2>&1 | tail -10"
```

### 5.2 Add to Uptime Kuma (Optional)
Since the bot doesn't expose ports, monitor container status:
1. Create "Docker Container" monitor for `discordbot-dmr`
2. Or create "Push" monitor and add heartbeat to bot code

### 5.3 Auto-Updates
Watchtower is configured to update the container bi-weekly (already in docker-compose.yml).

---

## Verification Checklist

- [ ] Bot shows "online" status in Discord
- [ ] Bot logs show successful connection
- [ ] DM to bot appears in container logs
- [ ] Webhook POST succeeds (200 response)
- [ ] n8n workflow execution appears in history
- [ ] NetBox IP reservation confirmed
- [ ] DNS record resolves correctly

---

## Differences from Railway Deployment

| Aspect | Railway | Self-Hosted (You) |
|--------|---------|-------------------|
| **Container hosting** | Railway platform | LXC 30068 on Proxmox |
| **Public URL** | Railway provides | Not needed (outbound only) |
| **Environment vars** | Railway dashboard | `.env` file in container |
| **Auto-restarts** | Railway handles | Docker `restart: unless-stopped` |
| **Scaling** | Railway auto-scale | Single container (sufficient) |
| **Monitoring** | Railway metrics | Docker logs + optional Uptime Kuma |
| **Updates** | Railway redeploy | Watchtower auto-updates |
| **Cost** | $5-20/month | Free (existing infrastructure) |

---

## Summary

**Your self-hosted setup is complete.** The key insight is that Discord bots make **outbound** connections only - no port forwarding or public URLs are needed for the bot itself.

The only external-facing component is your n8n webhook, which is already publicly accessible via `https://n8n.mareoxlan.com/webhook/discordbot-dmr` through your existing Cloudflare tunnel.

**Action Items**:
1. Run the test commands in Step 1 to verify end-to-end functionality
2. Send a test DM to your bot
3. Confirm the webhook execution appears in n8n

---

*Created: 2026-01-24*
*Status: Ready for Testing*
