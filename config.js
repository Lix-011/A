module.exports = {
  // آيدي رتبة الإداريين اللي بيتم تتبعهم
  ADMIN_ROLE_ID: '1514988741310156881',

  // آيدي روم الدعم الصوتي (Support VC) - عدّله لآيدي الروم عندك
  SUPPORT_VC_CHANNEL_ID: 'PUT_SUPPORT_VC_CHANNEL_ID_HERE',

  // أوزان حساب السكور - عدّلها زي ما يناسبك
  SCORE_WEIGHTS: {
    messagePoint: 0.1,        // نقاط لكل رسالة
    presenceHourPoint: 1.5,   // نقاط لكل ساعة حضور صوتي عام
    supportVcHourPoint: 3,    // نقاط لكل ساعة في روم الدعم الصوتي
    modActionPoint: 5,        // نقاط لكل إجراء إداري (كيك/بان/ميوت/تايم اوت)
    eventPoint: 10,           // نقاط لكل فعالية
  },

  // أقل مدة (بالثواني) في الروم الصوتي عشان تنحسب كحضور فعلي (تفادي الدخول اللحظي)
  MIN_VOICE_SECONDS_COUNTED: 60,
};
