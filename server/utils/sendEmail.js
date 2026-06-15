import nodemailer from 'nodemailer';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `SRM Todo App <${process.env.EMAIL_USER}>`,
      to, subject, html, text,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('❌ Email send error:', err.message);
    throw err;
  }
};

export const sendDueDateReminder = async (user, todo) => {
  const due = new Date(todo.dueDate);
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;padding:24px">
      <div style="background:linear-gradient(135deg,#6c63ff,#ff6584);padding:24px;border-radius:12px;margin-bottom:20px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">⏰ Todo Due Tomorrow!</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0">SRM Todo App Reminder</p>
      </div>
      <div style="background:#1e1e3a;padding:20px;border-radius:12px;border-left:4px solid #6c63ff">
        <h2 style="color:#e2e8f0;margin:0 0 8px">${todo.title}</h2>
        ${todo.description ? `<p style="color:#94a3b8;margin:0 0 12px">${todo.description}</p>` : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="background:#6c63ff33;color:#6c63ff;padding:4px 10px;border-radius:8px;font-size:12px">📁 ${todo.category}</span>
          <span style="background:#f59e0b33;color:#f59e0b;padding:4px 10px;border-radius:8px;font-size:12px">⚡ ${todo.priority}</span>
          <span style="background:#10b98133;color:#10b981;padding:4px 10px;border-radius:8px;font-size:12px">
            📅 Due: ${due.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
          </span>
        </div>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin-top:16px;text-align:center">
        Open <a href="${process.env.CLIENT_URL}/todos" style="color:#6c63ff">SRM Todo App</a> to mark it complete.
      </p>
      <p style="color:#475569;font-size:11px;text-align:center;margin-top:8px">SRM Institute of Science and Technology</p>
    </div>
  `;
  return sendEmail({
    to:      user.email,
    subject: `⏰ Reminder: "${todo.title}" is due tomorrow!`,
    html,
    text:    `Reminder: Your todo "${todo.title}" is due on ${due.toLocaleDateString('en-IN')}.`,
  });
};
