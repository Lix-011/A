const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { assignDailyTasks } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder().setName('activatetasks').setDescription('تفعيل المهام للجميع'),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
      return interaction.reply({ content: '❌ للإدارة العليا فقط.', ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    const res = await assignDailyTasks(interaction.guild);
    await interaction.editReply(res ? `✅ تم توزيع المهام على ${res.length} عضو.` : '❌ فشل التوزيع.');
  }
};
