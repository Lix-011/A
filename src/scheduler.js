const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const db = require('./database');

// يرجع n عنصر عشوائي من مصفوفة بدون تكرار
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// يوزع مهام اليوم عشوائياً على أشخاص عشوائيين من رتبة الإداريين
// تستدعى فقط لما شخص من رتبة إدارة المهام يستخدم أمر /activatetasks
async function assignDailyTasks(client) {
  const guild = await client.guilds.fetch(config.GUILD_ID);
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

  // نبني قائمة مهام كافية (نكررها لو الأشخاص أكثر من عدد المهام المتوفرة)
  let taskPool = [];
  while (taskPool.length < chosenMembers.length) {
    taskPool = taskPool.concat(pickRandom(config.DAILY_TASKS, config.DAILY_TASKS.length));
  }
  taskPool = taskPool.slice(0, chosenMembers.length);

  const today = new Date().toISOString().slice(0, 10);
  const channel = await client.channels.fetch(config.GENERAL_CHAT_CHANNEL_ID);
  if (!channel) {
    console.log('ما لقيت قناة الشات العام (تأكد من GENERAL_CHAT_CHANNEL_ID في config.js).');
    return null;
  }

  const assignments = [];

  for (let i = 0; i < chosenMembers.length; i++) {
    const member = chosenMembers[i];
    const task = taskPool[i];

    const taskId = db.assignDailyTask(member.id, task.key, task.text, today);

    const embed = new EmbedBuilder()
      .setTitle('📌 مهمة اليوم')
      .setDescription(`${member} مهمتك اليوم:\n\n**${task.text}**`)
      .setColor(0x2f3136)
      .setFooter({ text: `التاريخ: ${today}` })
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
}

module.exports = { assignDailyTasks };
