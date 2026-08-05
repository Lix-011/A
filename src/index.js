const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');

// استخدام مسارات مطلقة لضمان العثور على الملفات
const config = require(path.join(__dirname, 'config.js'));
const db = require(path.join(__dirname, 'database.js'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// تحميل الأوامر من مجلد src/commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const msg = { content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true };
            if (interaction.deferred || interaction.replied) await interaction.editReply(msg);
            else await interaction.reply(msg);
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId.startsWith('task_done_')) {
            const upperManagementRole = config.TASK_MANAGER_ROLE_ID;
            
            if (!interaction.member.roles.cache.has(upperManagementRole)) {
                return interaction.reply({ 
                    content: '❌ هذا الزر مخصص للإدارة العليا فقط.', 
                    ephemeral: true 
                });
            }

            const taskId = interaction.customId.replace('task_done_', '');
            const success = db.completeTask(taskId); 

            if (success) {
                const task = db.getTaskById(taskId);
                const userMention = task ? `<@<LaTex>{task.userId}>` : 'هذا العضو';                  await interaction.reply({                      content: `✅ تم إنجاز مهمة</LaTex>{userMention} بنجاح بواسطة الإدارة العليا.`, 
                    ephemeral: false 
                });
                
                await interaction.message.edit({ components: [] }).catch(() => null);
            } else {
                await interaction.reply({ content: '❌ لم يتم العثور على المهمة.', ephemeral: true });
            }
        }
    }
});

client.once(Events.ClientReady, c => {
    console.log(`✅ البوت شغال الآن باسم ${c.user.tag}`);
});

client.login(config.TOKEN);
