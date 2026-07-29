require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  AuditLogEvent,
} = require('discord.js');

const config = require('../config');
const db = require('./database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.GuildMember],
});

// --- تحميل الأوامر ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

function hasAdminRole(member) {
  return member && member.roles.cache.has(config.ADMIN_ROLE_ID);
}

// --- تتبع الرسائل ---
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;
  const member = message.member;
  if (hasAdminRole(member)) {
    db.addMessage(member.id);
  }
});

// --- تتبع الصوت (الحضور العام + روم الدعم) ---
client.on('voiceStateUpdate', (oldState, newState) => {
  const member = newState.member ?? oldState.member;
  if (!hasAdminRole(member)) return;

  const userId = member.id;

  // خرج من الروم أو تغيّر الروم -> اقفل الجلسة القديمة واحسب المدة
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    const session = db.endVoiceSession(userId);
    if (session) {
      const seconds = Math.floor((Date.now() - session.joinedAt) / 1000);
      if (seconds >= config.MIN_VOICE_SECONDS_COUNTED) {
        db.addVoiceSeconds(userId, seconds, session.isSupportVc === 1);
      }
    }
  }

  // دخل روم جديد -> ابدأ جلسة جديدة
  if (newState.channelId && oldState.channelId !== newState.channelId) {
    const isSupportVc = newState.channelId === config.SUPPORT_VC_CHANNEL_ID;
    db.startVoiceSession(userId, newState.channelId, isSupportVc);
  }
});

// --- تتبع الإجراءات الإدارية (كيك، بان، تايم اوت) عن طريق الـ Audit Log ---
client.on('guildAuditLogEntryCreate', async (entry, guild) => {
  const trackedActions = [
    AuditLogEvent.MemberKick,
    AuditLogEvent.MemberBanAdd,
    AuditLogEvent.MemberUpdate, // يشمل تايم اوت (Timeout) ضمن تحديثات ثانية أيضاً
  ];

  if (!trackedActions.includes(entry.action)) return;
  if (!entry.executorId) return;

  try {
    const executor = await guild.members.fetch(entry.executorId);
    if (hasAdminRole(executor)) {
      db.addModAction(executor.id, 1);
    }
  } catch {
    // العضو مو موجود بالسيرفر أو حصل خطأ بالجلب - نتجاهله
  }
});

// --- تنفيذ أوامر السلاش ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const reply = { content: 'صار خطأ أثناء تنفيذ الأمر.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.once('clientReady', () => {
  console.log(`البوت شغال باسم ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
