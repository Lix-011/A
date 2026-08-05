const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config');
const db = require('./database');

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function assignDailyTasks(guild) {
  try {
    if (!guild) return null;

    await guild.members.fetch().catch(() => null);

    // البحث عن الأعضاء الحاملين للرتبة المطلوبة
    const eligible = guild.members.cache.filter(
      m => !m.user.bot && m.roles.cache.has(config.ADMIN_ROLE_ID)
    );

    if (eligible.size === 0) {
      console.error(`❌ لم أجد أعضاء برتبة: ${config.ADMIN_ROLE_ID}`);
      return null;
    }

    const channel = await guild.channels.fetch(config.GENERAL_CHAT_CHANNEL_ID).catch(() => null);
    if (!channel) {
      console.error("❌ لم أجد قناة الإرسال.");
      return null;
    }

    const count = Math.min(config.DAILY_TASK_PEOPLE_COUNT, eligible.size);
    const chosenMembers = pickRandom([...eligible.values()], count);

    let taskPool = [];
    while (taskPool.length < chosenMembers.length) {
      taskPool = taskPool.concat(pickRandom(config.DAILY_TASKS, config.DAILY_TASKS.length));
    }
    taskPool = taskPool.slice(0, chosenMembers.length);

    const today = new Date().toISOString().slice(0, 10);
    const assignments = [];

    for (let i = 0; i < chosenMembers.length; i++) {
      const member = chosenMembers[i];
      const task = taskPool[i];
      const taskId = db.assignDailyTask(member.id, task.key, task.text, today);

      const embed = new EmbedBuilder()
        .setTitle('📌 مهمة إدارية يومية')
        .setDescription(`${member}، مهمتك اليوم هي:\n\n**<LaTex>{task.text}**`)         .setColor(0xFFA500) // لون برتقالي         .setFooter({ text: `التاريخ:</LaTex>{today}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`task_done_<LaTex>{taskId}`)           .setLabel('تم الإنجاز ✅')           .setStyle(ButtonStyle.Success)       );        await channel.send({ content: `</LaTex>{member}`, embeds: [embed], components: [row] });
      db.setTaskMessageId(taskId, msg.id);
      assignments.push({ member, task });
    }
    return assignments;
  } catch (error) {
    console.error('🔥 خطأ:', error);
    return null;
  }
}

module.exports = { assignDailyTasks };
