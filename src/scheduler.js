const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const db = require('./database');

// يرجع n عنصر عشوائي من مصفوفة بدون تكرار
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// تعديل الدالة لتستقبل السيرفر (guild)
async function assignDailyTasks(guild) {
  try {
    if (!guild) return null;

    // جلب قائمة الأعضاء بالكامل من السيرفر (يتطلب تفعيل Intent: GuildMembers)
    await guild.members.fetch();

    const eligible = guild.members.cache.filter(
      m => !m.user.bot && m.roles.cache.has(config.ADMIN_ROLE_ID)
    );

    if (eligible.size === 0) {
      console.log('ما فيه أعضاء يحملون رتبة الإداريين لتوزيع المهام عليهم.');
      return null;
    }

    const peopleCount = Math.min(config.DAILY_TASK_PEOPLE_COUNT, eligible.size);
    const chosenMembers = pickRandom([...eligible.values()], peopleCount);

    let taskPool = [];
    while (taskPool.length < chosenMembers.length) {
      taskPool = taskPool.concat(pickRandom(config.DAILY_TASKS, config.DAILY_TASKS.length));
    }
    taskPool = taskPool.slice(0, chosenMembers.length);

    const today = new Date().toISOString().slice(0, 10);
    
    // جلب القناة من السيرفر نفسه لضمان الوصول إليها
    const channel = await guild.channels.fetch(config.GENERAL_CHAT_CHANNEL_ID).catch(() => null);
    
    if (!channel) {
      console.log('ما لقيت قناة الشات العام. تأكد من GENERAL_CHAT_CHANNEL_ID.');
      return null;
    }

    const assignments = [];

    for (let i = 0; i < chosenMembers.length; i++) {
      const member = chosenMembers[i];
      const task = taskPool[i];

      const taskId = db.assignDailyTask(member.id, task.key, task.text, today);

      const embed = new EmbedBuilder()
        .setTitle('📌 مهمة اليوم')
        .setDescription(`${member} مهمتك اليوم:\n\n**<LaTex>{task.text}**`)         .setColor(0x2f3136)         .setFooter({ text: `التاريخ:</LaTex>{today}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`task_done_${taskId}`)
          .setLabel('تم الإنجاز ✅')
          .setStyle(ButtonStyle.Success)
      );

      const msg = await channel.send({ embeds: [embed], components: [row] });
      db.setTaskMessageId(taskId, msg.id);

      assignments.push({ member, task });
    }

    return assignments;
  } catch (error) {
    console.error('حدث خطأ أثناء توزيع المهام:', error);
    return null;
  }
}

module.exports = { assignDailyTasks };
