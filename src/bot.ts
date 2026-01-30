import {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
  Message,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
} from 'discord.js';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// Store pending drafts for button interactions
const pendingDrafts = new Map<
  string,
  {
    draftId: string;
    title: string;
    filePath: string;
    approveUrl: string;
    rejectUrl: string;
    messageId?: string;
  }
>();

// ============================================================================
// Discord Bot Event Handlers
// ============================================================================

client.once(Events.ClientReady, c => {
  console.log(`✅ Bot is online! Logged in as ${c.user.tag}`);
  console.log(`📡 API server running on port ${process.env.API_PORT || 3000}`);
});

// Handle DMs and mentions (existing functionality)
client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;

  if (message.channel.isDMBased()) {
    console.log(`📩 Received DM from ${message.author.tag}: ${message.content}`);

    try {
      const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
      if (N8N_WEBHOOK_URL) {
        const body = {
          type: 'direct_message',
          userId: message.author.id,
          username: message.author.username,
          message: message.content,
        };

        await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      console.log(`✉️ Forwarded DM from ${message.author.tag}`);
    } catch (error) {
      console.error('❌ Error forwarding DM:', error);
    }
  } else if (message.mentions.has(client.user!.id)) {
    console.log(`💬 Mentioned in channel by ${message.author.tag}: ${message.content}`);

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    if (N8N_WEBHOOK_URL) {
      const body = {
        type: 'channel_mention',
        userId: message.author.id,
        username: message.author.username,
        message: message.content,
        channelId: message.channel.id,
      };

      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    console.log(`✉️ Forwarded mention from ${message.author.tag}`);
  }
});

// Handle button interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const buttonInteraction = interaction as ButtonInteraction;
  const [action, draftId] = buttonInteraction.customId.split(':');

  console.log(`🔘 Button clicked: ${action} for draft ${draftId}`);

  const draft = pendingDrafts.get(draftId);
  if (!draft) {
    await buttonInteraction.reply({
      content: '❌ Draft not found or already processed.',
      ephemeral: true,
    });
    return;
  }

  // Determine which URL to call
  const callbackUrl = action === 'approve' ? draft.approveUrl : draft.rejectUrl;

  try {
    // Call the n8n webhook
    const response = await fetch(callbackUrl, {
      method: 'GET', // The URLs are GET requests with query params
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update the message to show action taken
    const actionEmoji = action === 'approve' ? '✅' : '❌';
    const actionText = action === 'approve' ? 'Approved' : 'Rejected';

    // Disable buttons after action
    const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('done')
        .setLabel(`${actionText} by ${buttonInteraction.user.username}`)
        .setStyle(action === 'approve' ? ButtonStyle.Success : ButtonStyle.Danger)
        .setDisabled(true)
    );

    await buttonInteraction.update({
      components: [disabledRow],
    });

    // Remove from pending
    pendingDrafts.delete(draftId);

    console.log(`${actionEmoji} Draft ${draftId} ${actionText.toLowerCase()} by ${buttonInteraction.user.tag}`);
  } catch (error) {
    console.error(`❌ Error processing ${action}:`, error);
    await buttonInteraction.reply({
      content: `❌ Error processing ${action}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ephemeral: true,
    });
  }
});

// ============================================================================
// Express API Endpoints
// ============================================================================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    bot: client.isReady() ? 'connected' : 'disconnected',
    pendingDrafts: pendingDrafts.size,
  });
});

// Send journal review request
app.post('/api/journal-review', async (req: Request, res: Response) => {
  try {
    const {
      draftId,
      title,
      postType,
      subsystem,
      filePath,
      validation,
      seo,
      approveUrl,
      rejectUrl,
      imageGenerated,
      imagePath,
      imageSkipped,
    } = req.body;

    if (!draftId || !title || !approveUrl || !rejectUrl) {
      res.status(400).json({ error: 'Missing required fields: draftId, title, approveUrl, rejectUrl' });
      return;
    }

    const channelId = process.env.JOURNAL_CHANNEL_ID;
    if (!channelId) {
      res.status(500).json({ error: 'JOURNAL_CHANNEL_ID not configured' });
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      res.status(500).json({ error: 'Invalid channel or not a text channel' });
      return;
    }

    // Build quality color
    const qualityColors: Record<string, number> = {
      excellent: 0x57f287, // Green
      good: 0xfee75c, // Yellow
      needs_work: 0xed4245, // Red
      poor: 0x5865f2, // Blurple
    };
    const color = qualityColors[validation?.qualityLevel || 'good'] || 0x5865f2;

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle('📝 Blog Draft Ready for Review')
      .setDescription('A new draft has been generated. Review and approve to create PR.')
      .setColor(color)
      .addFields(
        {
          name: 'Quality',
          value: `${validation?.score || 'N/A'}/100 (${validation?.qualityLevel || 'unknown'})`,
          inline: true,
        },
        { name: 'Type', value: postType || 'journal', inline: true },
        { name: 'Subsystem', value: subsystem || 'N/A', inline: true },
        { name: 'Title', value: title, inline: false },
        { name: 'File', value: `\`${filePath}\``, inline: false },
        {
          name: 'Stats',
          value: `${validation?.wordCount || 0} words, ${validation?.codeBlocks || 0} code blocks`,
          inline: false,
        }
      );

    // Add image status
    if (imageGenerated) {
      embed.addFields({ name: 'Image', value: `✅ ${imagePath}`, inline: false });
    } else if (imageSkipped) {
      embed.addFields({ name: 'Image', value: `⏭️ ${imageSkipped}`, inline: false });
    }

    // Add SEO suggestions if available
    if (seo?.suggestedLinks?.length > 0) {
      const linkTitles = seo.suggestedLinks.map((l: { title: string }) => l.title).join(', ');
      embed.addFields({ name: '🔗 Related Content', value: linkTitles, inline: false });
    }

    // Add issues/checks
    if (validation?.issues?.length > 0) {
      embed.addFields({ name: '❌ Issues', value: validation.issues.join(', '), inline: false });
    } else {
      embed.addFields({ name: '✅ Checks', value: 'All passed', inline: false });
    }

    embed.setFooter({ text: `Draft ID: ${draftId}` });
    embed.setTimestamp();

    // Build buttons
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve:${draftId}`)
        .setLabel('Approve & Create PR')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`reject:${draftId}`)
        .setLabel('Reject')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    // Send message
    const message = await channel.send({
      embeds: [embed],
      components: [row],
    });

    // Store draft info for button handler
    pendingDrafts.set(draftId, {
      draftId,
      title,
      filePath,
      approveUrl,
      rejectUrl,
      messageId: message.id,
    });

    console.log(`📤 Sent review request for draft ${draftId} to channel ${channelId}`);

    res.json({
      success: true,
      messageId: message.id,
      channelId,
      draftId,
    });
  } catch (error) {
    console.error('❌ Error sending review request:', error);
    res.status(500).json({
      error: 'Failed to send review request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Send simple notification (for PR results, etc.)
app.post('/api/notify', async (req: Request, res: Response) => {
  try {
    const { title, description, color, fields, channelId: targetChannelId } = req.body;

    const channelId = targetChannelId || process.env.JOURNAL_CHANNEL_ID;
    if (!channelId) {
      res.status(500).json({ error: 'Channel ID not provided or configured' });
      return;
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      res.status(500).json({ error: 'Invalid channel or not a text channel' });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(title || 'Notification')
      .setDescription(description || '')
      .setColor(color || 0x5865f2)
      .setTimestamp();

    if (fields && Array.isArray(fields)) {
      embed.addFields(fields);
    }

    const message = await channel.send({ embeds: [embed] });

    res.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// Startup
// ============================================================================

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('❌ Error: DISCORD_BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

// Start Express server
const apiPort = parseInt(process.env.API_PORT || '3000', 10);
app.listen(apiPort, '0.0.0.0', () => {
  console.log(`🚀 API server starting on port ${apiPort}...`);
});

// Start Discord bot
client.login(token);
