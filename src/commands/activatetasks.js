const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { assignDailyTasks } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activatetasks')
    .setDescription('تفعيل وتوزيع مهام اليوم عشوائياً على الإداريين'),

  async execute(interaction) {
    // مقصور على رتبة إدارة المهام فقط
    if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
      await interaction.reply({ content: 'ما عندك صلاحية تستخدم هذا الأمر.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const assignments = await assignDailyTasks(interaction.client);

    if (!assignments) {
      await interaction.editReply(
        'ما قدرت أوزع المهام. تأكد إن GENERAL_CHAT_CHANNEL_ID مضبوط صح وفيه أعضاء يحملون رتبة الإداريين.'
      );
      return;
    }

    await interaction.editReply(`تم تفعيل وتوزيع المهام على ${assignments.length} إداري بنجاح.`);
  },
};
