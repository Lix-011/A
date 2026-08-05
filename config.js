require('dotenv').config();
module.exports = {
  TOKEN: process.env.TOKEN,
  GUILD_ID: process.env.GUILD_ID,
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID || '1514988741310156881',
  TASK_MANAGER_ROLE_ID: process.env.TASK_MANAGER_ROLE_ID || '1514989211655344251',
  GENERAL_CHAT_CHANNEL_ID: process.env.GENERAL_CHAT_CHANNEL_ID,
  DAILY_TASKS: [
    { key: 'task1', text: 'تفاعل في الشات العام' },
    { key: 'task2', text: 'انشاء تعاون مع سيرفر اخر والالتزام بقوانين التعاون والشروط' },
    { key: 'task3', text: 'الرد على التكتات (Tickets)' },
    { key: 'task4', text: 'إحصائية المشاكل: توثيق مشكلة حدثت في السيرفر من بدايتها وإرسالها للإدارة العليا' },
    { key: 'task5', text: 'تنظيم فعالية في رومات الفويس (ألعاب مثل كود نيمز أو اقتراح فيلم ومشاهدته)' }
  ]
};
