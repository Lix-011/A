const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addevent')
    .setDescription('إضافة فعالية لإداري (يستخدمها المسؤولين فقط)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('member').setDescription('الإداري').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('count').setDescription('عدد الفعاليات المضافة (افتراضي 1)').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('member');
    const count = interaction.options.getInteger('count') ?? 1;

    db.addEvent(target.id, count);

    await interaction.reply({
      content: `تمت إضافة ${count} فعالية لـ ${target.username}.`,
      ephemeral: true,
    });
  },
};
