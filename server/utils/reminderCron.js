import cron from 'node-cron';
import Todo from '../models/Todo.js';
import User from '../models/User.js';
import { sendDueDateReminder } from './sendEmail.js';

/**
 * Runs every day at 8:00 AM IST (2:30 AM UTC)
 * Finds todos due TOMORROW and sends email reminders
 */
export const startReminderCron = () => {
  // Run at 08:00 every day (IST = UTC+5:30, so 02:30 UTC)
  cron.schedule('30 2 * * *', async () => {
    console.log('⏰ Running due-date reminder cron...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(tomorrow); start.setHours(0,  0,  0, 0);
      const end   = new Date(tomorrow); end.setHours(23, 59, 59, 999);

      const todos = await Todo.find({
        completed: false,
        dueDate:   { $gte: start, $lte: end },
      }).populate('createdBy', 'name email');

      console.log(`📋 Found ${todos.length} todos due tomorrow`);

      for (const todo of todos) {
        const user = todo.createdBy;
        if (!user?.email) continue;
        try {
          await sendDueDateReminder(user, todo);
        } catch (err) {
          console.error(`❌ Failed to send reminder to ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('❌ Reminder cron error:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log('⏰ Reminder cron scheduled: daily at 8:00 AM IST');
};

/**
 * Manual trigger — send reminders right now (for testing)
 */
export const triggerReminders = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow); start.setHours(0,  0,  0, 0);
  const end   = new Date(tomorrow); end.setHours(23, 59, 59, 999);

  const todos = await Todo.find({
    completed: false,
    dueDate:   { $gte: start, $lte: end },
  }).populate('createdBy', 'name email');

  let sent = 0;
  for (const todo of todos) {
    try { await sendDueDateReminder(todo.createdBy, todo); sent++; }
    catch {}
  }
  return { total: todos.length, sent };
};
