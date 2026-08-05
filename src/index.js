const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config'); // لأنه في نفس المجلد
const db = require('./database'); // تم إصلاح المسار هنا من ./src/database إلى ./database

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// تحميل الأوامر
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
    // التعامل مع الأوامر
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!' });
            } else {
                await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ هذا الأمر!', ephemeral: true });
            }
        }
    }

    // التعامل مع الأزرار (حصرها للإدارة العليا)
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('task_done_')) {
            const upperManagementRole = config.TASK_MANAGER_ROLE_ID;
            
            if (!interaction.member.roles.cache.has(upperManagementRole)) {
                return interaction.reply({ 
                    content: '❌ هذا الزر مخصص للإدارة العليا فقط لتأكيد إنجاز المهام.', 
                    ephemeral: true 
                });
            }

            const taskId = interaction.customId.replace('task_done_', '');
            const success = db.completeTask(taskId); 

            if (success) {
                const today = new Date().toISOString().slice(0, 10);
                const tasks = db.getTasksByDate(today);
                const currentTask = tasks.find(t => t.id == taskId);
                const userMention = currentTask ? `<@<LaTex>{currentTask.userId}>` : 'هذا العضو';                  await interaction.reply({                      content: `✅ تم إنجاز مهمة</LaTex>{userMention} بنجاح بواسطة الإدارة العليا.`, 
                    ephemeral: false 
                });
                
                await interaction.message.edit({ components: [] }).catch(() => null);
            } else {
                await interaction.reply({ content: '❌ لم يتم العثور على بيانات هذه المهمة.', ephemeral: true });
            }
        }
    }
});

client.once(Events.ClientReady, c => {
    console.log(`✅ البوت شغال باسم ${c.user.tag}`);
});

client.login(config.TOKEN);
