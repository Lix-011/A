const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { assignDailyTasks } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activatetasks')
    .setDescription('توزيع المهام على الجميع (للإدارة العليا)'),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'سيرفر فقط!', ephemeral: true });

    if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
      return interaction.reply({ content: '❌ للإدارة العليا فقط.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const assignments = await assignDailyTasks(interaction.guild);

    if (!assignments) return interaction.editReply('❌ فشل التوزيع.');
    await interaction.editReply(`✅ تم توزيع ${assignments.length} مهمة.`);
  },
};
