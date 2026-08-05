const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('./config'); // ملف في نفس المجلد
const db = require('./database'); // ملف في نفس المجلد

function pickRandom(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

async function assignDailyTasks(guild) {
  try {
    await guild.members.fetch();
    const members = guild.members.cache.filter(m => !m.user.bot && m.roles.cache.has(config.ADMIN_ROLE_ID));
    if (members.size === 0) return null;
    const channel = await guild.channels.fetch(config.GENERAL_CHAT_CHANNEL_ID).catch(() => null);
    if (!channel) return null;
    const membersArray = [...members.values()];
    const today = new Date().toISOString().slice(0, 10);
    const assignments = [];
    for (let i = 0; i < membersArray.length; i++) {
      const member = membersArray[i];
      const task = config.DAILY_TASKS[i % config.DAILY_TASKS.length];
      const taskId = db.assignDailyTask(member.id, task.key, task.text, today);
      const embed = new EmbedBuilder().setTitle('📌 مهمة يومية').setDescription(`<LaTex>{member}، مهمتك:\n**</LaTex>{task.text}**`).setColor(0xFFA500);
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`task_done_<LaTex>{taskId}`).setLabel('تم الإنجاز ✅').setStyle(ButtonStyle.Success));       const msg = await channel.send({ content: `</LaTex>{member}`, embeds: [embed], components: [row] });
      db.setTaskMessageId(taskId, msg.id);
      assignments.push({ member, task });
    }
    return assignments;
  } catch (e) { console.error(e); return null; }
}
module.exports = { assignDailyTasks };
