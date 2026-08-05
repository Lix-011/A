const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const db = require('./database');

// دالة لاختيار عناصر عشوائية
function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function assignDailyTasks(guild) {
  try {
    console.log(`🔍 بدأت عملية توزيع المهام في سيرفر: ${guild.name}`);

    // 1. جلب الأعضاء (يتطلب تفعيل Server Members Intent)
    await guild.members.fetch().catch(e => console.error("❌ خطأ في جلب الأعضاء:", e));

    // 2. فلترة الإداريين المستحقين للمهام
    const eligible = guild.members.cache.filter(
      m => !m.user.bot && m.roles.cache.has(config.ADMIN_ROLE_ID)
    );

    if (eligible.size === 0) {
      console.error(`❌ لم أجد أي عضو يملك الرتبة: <LaTex>{config.ADMIN_ROLE_ID}`);       return null;     }      // 3. جلب قناة الإرسال     const channel = await guild.channels.fetch(config.GENERAL_CHAT_CHANNEL_ID).catch(() => null);     if (!channel) {       console.error(`❌ لم أجد القناة بالمعرف:</LaTex>{config.GENERAL_CHAT_CHANNEL_ID}`);
      return null;
    }

    // 4. اختيار الأعضاء والمهام
    const count = Math.min(config.DAILY_TASK_PEOPLE_COUNT, eligible.size);
    const chosenMembers = pickRandom([...eligible.values()], count);

    let taskPool = [];
    while (taskPool.length < chosenMembers.length) {
      taskPool = taskPool.concat(pickRandom(config.DAILY_TASKS, config.DAILY_TASKS.length));
    }
    taskPool = taskPool.slice(0, chosenMembers.length);

    const today = new Date().toISOString().slice(0, 10);
    const assignments = [];

    // 5. إنشاء المهام وإرسالها
    for (let i = 0; i < chosenMembers.length; i++) {
      const member = chosenMembers[i];
      const task = taskPool[i];

      // حفظ في قاعدة البيانات
      const taskId = db.assignDailyTask(member.id, task.key, task.text, today);

      const embed = new EmbedBuilder()
        .setTitle('📌 مهمة إدارية جديدة')
        .setDescription(`<LaTex>{member}، مهمتك لهذا اليوم هي:\n\n**</LaTex>{task.text}**`)
        .setColor(0x5865F2)
        .setFooter({ text: `تاريخ اليوم: <LaTex>{today}` })         .setTimestamp();        const row = new ActionRowBuilder().addComponents(         new ButtonBuilder()           .setCustomId(`task_done_</LaTex>{taskId}`)
          .setLabel('تم الإنجاز ✅')
          .setStyle(ButtonStyle.Success)
      );

      const msg = await channel.send({ content: `${member}`, embeds: [embed], components: [row] });
      db.setTaskMessageId(taskId, msg.id);

      assignments.push({ member, task });
    }

    return assignments;
  } catch (error) {
    console.error('🔥 خطأ فادح في نظام الموزع:', error);
    return null;
  }
}

module.exports = { assignDailyTasks };
