const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('taskstats')
    .setDescription('عرض مين أنجز مهمة اليوم ومين ما أنجزها')
    .addStringOption(opt =>
      opt.setName('date')
        .setDescription('التاريخ بصيغة YYYY-MM-DD - اتركه فارغ عشان يطلع لك تاريخ اليوم')
        .setRequired(false)
    ),

  async execute(interaction) {
    // مقصور على رتبة إدارة المهام فقط
    if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
      await interaction.reply({ content: 'ما عندك صلاحية تستخدم هذا الأمر.', ephemeral: true });
      return;
    }

    const date = interaction.options.getString('date') ?? new Date().toISOString().slice(0, 10);
    const tasks = db.getTasksByDate(date);

    if (tasks.length === 0) {
      await interaction.reply({ content: `ما فيه مهام مسجلة بتاريخ ${date}.`, ephemeral: true });
      return;
    }

    const done = tasks.filter(t => t.completed);
    const notDone = tasks.filter(t => !t.completed);

    const embed = new EmbedBuilder()
      .setTitle(`📊 إحصائية المهام اليومية - ${date}`)
      .addFields(
        {
          name: `✅ أنجزوا المهمة (${done.length})`,
          value: done.length
            ? done.map(t => `<@${t.userId}> - ${t.taskText}`).join('\n')
            : 'لا أحد',
        },
        {
          name: `❌ لم ينجزوا المهمة (${notDone.length})`,
          value: notDone.length
            ? notDone.map(t => `<@${t.userId}> - ${t.taskText}`).join('\n')
            : 'لا أحد',
        }
      )
      .setColor(0x2f3136)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
