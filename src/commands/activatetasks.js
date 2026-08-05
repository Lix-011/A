const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { assignDailyTasks } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activatetasks')
    .setDescription('توزيع المهام على جميع الإداريين (للإدارة العليا فقط)'),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'داخل السيرفر فقط!', ephemeral: true });

    // التحقق من رتبة الإدارة العليا
    if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
      return interaction.reply({ 
        content: '❌ هذا الأمر مخصص للإدارة العليا فقط.', 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const assignments = await assignDailyTasks(interaction.guild);

    if (!assignments) {
      return interaction.editReply('❌ فشل توزيع المهام. تأكد من الإعدادات وصلاحيات البوت.');
    }

    await interaction.editReply(`✅ تم توزيع المهام بنجاح على جميع الإداريين (العدد: ${assignments.length}).`);
  },
};
