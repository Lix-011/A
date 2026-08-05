const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config');
const db = require('./src/database'); // تأكد من صحة المسار حسب مجلداتك

// 1. تعريف البوت مع كل الصلاحيات اللازمة
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // ضروري لرؤية الرتب
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// 2. تحميل الأوامر من مجلد commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// 3. التعامل مع التفاعلات (الأوامر والأزرار)
client.on(Events.InteractionCreate, async interaction => {
    // --- أولاً: التعامل مع أوامر السلاش ---
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'حدث خطأ أثناء تنفيذ الأمر!', ephemeral: true });
        }
    }

    // --- ثانياً: التعامل مع أزرار المهام ---
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('task_done_')) {
            // رتبة الإدارة العليا المسموح لها بالضغط (تأكد أنها مطابقة لـ config)
            const upperManagementRole = config.TASK_MANAGER_ROLE_ID || '1514989211655344251';
            
            if (!interaction.member.roles.cache.has(upperManagementRole)) {
                return interaction.reply({ 
                    content: '❌ هذا الزر مخصص للإدارة العليا فقط لتأكيد إنجاز المهام.', 
                    ephemeral: true 
                });
            }

            const taskId = interaction.customId.replace('task_done_', '');
            
            // تحديث حالة المهمة في قاعدة البيانات
            const success = db.completeTask(taskId); 

            if (success) {
                // جلب بيانات المهمة لإظهار اسم العضو المنجز
                const today = new Date().toISOString().slice(0, 10);
                const tasks = db.getTasksByDate(today);
                const currentTask = tasks.find(t => t.id == taskId);
                const userMention = currentTask ? `<@<LaTex>{currentTask.userId}>` : 'هذا العضو';                  await interaction.reply({                      content: `✅ تم إنجاز مهمة</LaTex>{userMention} بنجاح بواسطة الإدارة العليا.`, 
                    ephemeral: false 
                });
                
                // إزالة الأزرار من الرسالة الأصلية بعد التأكيد
                await interaction.message.edit({ components: [] }).catch(() => null);
            } else {
                await interaction.reply({ content: '❌ لم يتم العثور على بيانات هذه المهمة.', ephemeral: true });
            }
        }
    }
});

// 4. تشغيل البوت
client.once(Events.ClientReady, c => {
    console.log(`✅ البوت شغال باسم ${c.user.tag}`);
});

client.login(config.TOKEN);
