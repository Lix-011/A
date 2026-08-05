const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { assignDailyTasks } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activatetasks')
    .setDescription('توزيع المهام عشوائياً'),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'داخل السيرفر فقط!', ephemeral: true });

    if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
      return interaction.reply({ content: 'لا تملك صلاحية.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const assignments = await assignDailyTasks(interaction.guild);

    if (!assignments) {
      return interaction.editReply('❌ فشل التوزيع. راجع الـ Logs في Railway.');
    }

    await interaction.editReply(`✅ تم توزيع المهام على ${assignments.length} إداري.`);
  },
};
