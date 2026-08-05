const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config');
const db = require('./database');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.data.name, command);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try { await command.execute(interaction); } catch (e) { console.error(e); }
    }
    if (interaction.isButton() && interaction.customId.startsWith('task_done_')) {
        if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
            return interaction.reply({ content: '❌ للإدارة العليا فقط.', ephemeral: true });
        }
        const taskId = interaction.customId.replace('task_done_', '');
        if (db.completeTask(taskId)) {
            const task = db.getTaskById(taskId);
            await interaction.reply({ content: `✅ تم إنجاز مهمة <@<LaTex>{task.userId}> بنجاح بواسطة الإدارة العليا.` });             await interaction.message.edit({ components: [] }).catch(() => null);         }     } }); client.once(Events.ClientReady, c => console.log(`✅</LaTex>{c.user.tag} شغال!`));
client.login(config.TOKEN);
