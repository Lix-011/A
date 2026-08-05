const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('taskstats')
    .setDescription('عرض إحصائيات مهام اليوم'),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: 'داخل السيرفر فقط!', ephemeral: true });

    const today = new Date().toISOString().slice(0, 10);
    const tasks = db.getTasksByDate(today);

    if (!tasks || tasks.length === 0) {
      return interaction.reply({ content: 'لا توجد مهام موزعة اليوم.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 إحصائيات مهام اليوم (<LaTex>{today})`)       .setColor(0x0099FF);      let taskList = "";     let fieldCount = 1;      tasks.forEach((t) => {       const status = t.completed ? '✅' : '⏳';       const line = `<@</LaTex>{t.userId}> - <LaTex>{status}\n`;              if ((taskList + line).length > 1000) {         embed.addFields({ name: `قائمة المهام (</LaTex>{fieldCount})`, value: taskList });
        taskList = line;
        fieldCount++;
      } else {
        taskList += line;
      }
    });

    if (taskList.length > 0) {
      embed.addFields({ name: fieldCount > 1 ? `قائمة المهام (<LaTex>{fieldCount})` : 'الحالة', value: taskList });     }      const completedCount = tasks.filter(t => t.completed).length;     embed.setDescription(`إجمالي المهام: **</LaTex>{tasks.length}** | المنجزة: **${completedCount}**`);

    await interaction.reply({ embeds: [embed] });
  },
};
