const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetstats')
    .setDescription('تصفير إحصائيات إداري معيّن أو كل الإداريين')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName('member').setDescription('اتركه فارغ عشان تصفّر الكل').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('member');

    if (target) {
      db.resetStats(target.id);
      await interaction.reply({ content: `تم تصفير إحصائيات ${target.username}.`, ephemeral: true });
    } else {
      db.resetAll();
      await interaction.reply({ content: 'تم تصفير إحصائيات جميع الإداريين.', ephemeral: true });
    }
  },
};
