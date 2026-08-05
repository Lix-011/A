const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { assignDailyTasks } = require('../scheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activatetasks')
    .setDescription('تفعيل وتوزيع مهام اليوم عشوائياً على الإداريين'),

  async execute(interaction) {
    // 1. التأكد من أن الأمر داخل سيرفر
    if (!interaction.guild) {
      return interaction.reply({ content: 'هذا الأمر يعمل داخل السيرفرات فقط.', ephemeral: true });
    }

    // 2. التأكد من صلاحية المستخدم (رتبة مدير المهام)
    if (!interaction.member.roles.cache.has(config.TASK_MANAGER_ROLE_ID)) {
      return interaction.reply({ content: 'ليس لديك صلاحية لاستخدام هذا الأمر.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // 3. استدعاء وظيفة التوزيع وتمرير السيرفر لها
    const assignments = await assignDailyTasks(interaction.guild);

    if (!assignments) {
      return interaction.editReply(
        '❌ فشل توزيع المهام. يرجى التأكد من الـ Logs في Railway لمعرفة السبب (رتبة غير موجودة أو قناة غير صحيحة).'
      );
    }

    await interaction.editReply(`✅ تم توزيع المهام بنجاح على ${assignments.length} من الإداريين.`);
  },
};
