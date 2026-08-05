const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const db = require('./database');

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function assignDailyTasks(guild) {
  try {
    if (!guild) return null;
    await guild.members.fetch();

    const eligibleMembers = guild.members.cache.filter(
      m => !m.user.bot && m.roles.cache.has(config.ADMIN_ROLE_ID)
    );

    if (eligibleMembers.size === 0) return null;

    const channel = await guild.channels.fetch(config.GENERAL_CHAT_CHANNEL_ID).catch(() => null);
    if (!channel) return null;

    const membersArray = [...eligibleMembers.values()];
    let taskPool = [];
    while (taskPool.length < membersArray.length) {
      taskPool = taskPool.concat(pickRandom(config.DAILY_TASKS, config.DAILY_TASKS.length));
    }
    taskPool = taskPool.slice(0, membersArray.length);

    const today = new Date().toISOString().slice(0, 10);
    const assignments = [];

    for (let i = 0; i < membersArray.length; i++) {
      const member = membersArray[i];
      const task = taskPool[i];
      const taskId = db.assignDailyTask(member.id, task.key, task.text, today);

      const embed = new EmbedBuilder()
        .setTitle('📌 مهمة إدارية يومية')
        .setDescription(`<LaTex>{member}، مهمتك اليوم هي:\n\n**</LaTex>{task.text}**`)
        .setColor(0xFFA500)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`task_done_<LaTex>{taskId}`)           .setLabel('تم الإنجاز ✅')           .setStyle(ButtonStyle.Success)       );        const msg = await channel.send({ content: `</LaTex>{member}`, embeds: [embed], components: [row] });
      db.setTaskMessageId(taskId, msg.id);
      assignments.push({ member, task });
    }
    return assignments;
  } catch (error) {
    console.error('🔥 خطأ في التوزيع:', error);
    return null;
  }
}

module.exports = { assignDailyTasks };
