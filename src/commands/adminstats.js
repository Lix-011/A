const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const db = require('../database');
const { calculateScore, formatHours } = require('../scoring');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adminstats')
    .setDescription('عرض إحصائيات وسكور الإداريين')
    .addUserOption(opt =>
      opt.setName('member')
        .setDescription('إداري معيّن (لو ما اخترته بيطلع ليدربورد الكل)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch();

    const adminMembers = guild.members.cache.filter(m => m.roles.cache.has(config.ADMIN_ROLE_ID));
    const targetUser = interaction.options.getUser('member');

    // بناء قائمة مرتبة لكل الإداريين حسب السكور (لأجل الرانك)
    const ranked = adminMembers
      .map(member => {
        const stats = db.getStats(member.id);
        return { member, stats, score: calculateScore(stats) };
      })
      .sort((a, b) => b.score - a.score);

    if (targetUser) {
      const entry = ranked.find(r => r.member.id === targetUser.id);

      if (!entry) {
        await interaction.reply({ content: 'هذا الشخص ما عنده رتبة الإداريين المحددة.', ephemeral: true });
        return;
      }

      const rank = ranked.findIndex(r => r.member.id === targetUser.id) + 1;
      const embed = buildIndividualEmbed(entry, rank);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (ranked.length === 0) {
      await interaction.reply({ content: 'ما فيه أعضاء يحملون رتبة الإداريين حالياً.', ephemeral: true });
      return;
    }

    const embed = buildLeaderboardEmbed(ranked);
    await interaction.reply({ embeds: [embed] });
  },
};

function buildIndividualEmbed(entry, rank) {
  const { member, stats, score } = entry;
  return new EmbedBuilder()
    .setTitle('Admin Stats')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Name', value: member.displayName, inline: true },
      { name: 'Score', value: `${score}`, inline: true },
      { name: 'Rank', value: `#${rank}`, inline: true },
      { name: 'Presence', value: formatHours(stats.presenceSeconds), inline: true },
      { name: 'Messages', value: `${stats.messages}`, inline: true },
      { name: 'Support VC', value: formatHours(stats.supportVcSeconds), inline: true },
      { name: 'Mod Actions', value: `${stats.modActions}`, inline: true },
      { name: 'Events', value: `${stats.events}`, inline: true },
    )
    .setColor(0x2f3136)
    .setTimestamp();
}

function buildLeaderboardEmbed(ranked) {
  const lines = ranked.map((entry, i) => {
    const { member, stats, score } = entry;
    return (
      `#${i + 1} - ${member.displayName}\n` +
      `Score: ${score} | Presence: ${formatHours(stats.presenceSeconds)} | Messages: ${stats.messages} | ` +
      `Support VC: ${formatHours(stats.supportVcSeconds)} | Mod Actions: ${stats.modActions} | Events: ${stats.events}`
    );
  });

  return new EmbedBuilder()
    .setTitle('Admin Stats Leaderboard')
    .setDescription(lines.join('\n\n'))
    .setColor(0x2f3136)
    .setTimestamp();
}
