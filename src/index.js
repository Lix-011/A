// ابحث عن حدث interactionCreate وأضف/عدل هذا الجزء
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('task_done_')) {
            // رتبة الإدارة العليا المسموح لها بالضغط
            const upperManagementRole = '1514989211655344251';
            
            if (!interaction.member.roles.cache.has(upperManagementRole)) {
                return interaction.reply({ 
                    content: '❌ هذا الزر مخصص للإدارة العليا فقط لتأكيد الإنجاز.', 
                    ephemeral: true 
                });
            }

            const taskId = interaction.customId.replace('task_done_', '');
            
            // تحديث في قاعدة البيانات
            const success = db.completeTask(taskId); 

            if (success) {
                // محاولة جلب بيانات المهمة لإظهار من هو العضو
                const tasks = db.getTasksByDate(new Date().toISOString().slice(0, 10));
                const currentTask = tasks.find(t => t.id == taskId);
                const userMention = currentTask ? `<@${currentTask.userId}>` : 'هذا العضو';

                await interaction.reply({ 
                    content: `✅ تم إنجاز مهمة ${userMention} بنجاح بواسطة الإدارة العليا.`, 
                    ephemeral: false 
                });
                
                // إزالة الزر من الرسالة
                await interaction.message.edit({ components: [] });
            } else {
                await interaction.reply({ content: '❌ خطأ: لم أجد بيانات هذه المهمة.', ephemeral: true });
            }
        }
    }
    
    // ... باقي كود الأوامر
});
