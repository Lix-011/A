const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
  data: new SlashCommandBuilder().setName('taskstats').setDescription('إحصائيات اليوم'),
  async execute(interaction) {
    await interaction.deferReply();
    const tasks = db.getTasksByDate(new Date().toISOString().slice(0, 10));
    if (!tasks.length) return interaction.editReply('لا توجد مهام اليوم.');

    const embed = new EmbedBuilder().setTitle('📊 إحصائيات المهام').setColor(0x0099FF);
    let list = "";
    tasks.forEach(t => {
      const line = `<@<LaTex>{t.userId}> -</LaTex>{t.completed ? '✅' : '⏳'}\n`;
      if ((list + line).length > 1000) {
        embed.addFields({ name: 'القائمة', value: list });
        list = line;
      } else list += line;
    });
    embed.addFields({ name: 'الحالة', value: list });
    await interaction.editReply({ embeds: [embed] });
  }
};
