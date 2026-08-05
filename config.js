require('dotenv').config();

module.exports = {
  TOKEN: process.env.TOKEN,
  GUILD_ID: process.env.GUILD_ID,
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
  TASK_MANAGER_ROLE_ID: process.env.TASK_MANAGER_ROLE_ID,
  GENERAL_CHAT_CHANNEL_ID: process.env.GENERAL_CHAT_CHANNEL_ID,
  DAILY_TASK_PEOPLE_COUNT: parseInt(process.env.DAILY_TASK_PEOPLE_COUNT) || 3,
  DAILY_TASKS: [
    { key: 'task1', text: 'تفاعل مع 5 منشورات في السيرفر' },
    { key: 'task2', text: 'رحب بـ 3 أعضاء جدد' },
    { key: 'task3', text: 'تأكد من تطبيق القوانين في الشات العام' }
    // أضف مهامك هنا بنفس الصيغة
  ]
};
