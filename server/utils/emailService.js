const nodemailer = require("nodemailer");
const logger = require("./logger");

const transporter = nodemailer.createTransport({
  pool: true,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Lokonomy" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return info;
  } catch (err) {
    logger.error({ err, to, subject }, "Email delivery failed");
    throw err;
  }
};

const sendJobAlertEmail = async (to, name, jobs) => {
  const jobsHtml = jobs.map(job => `
    <div style="border: 1px solid #30363d; border-radius: 12px; padding: 16px; margin-bottom: 12px; background: #161b22;">
      <h3 style="margin: 0; color: #a78bfa;">${job.position}</h3>
      <p style="margin: 4px 0; color: #8b949e; font-size: 14px;">${job.location} | ${job.salary}</p>
      <a href="${process.env.APP_URL}/jobs/${job._id}" style="display: inline-block; margin-top: 8px; color: #58a6ff; text-decoration: none; font-size: 13px; font-weight: 600;">View Details &rarr;</a>
    </div>
  `).join("");

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px; background: #0d1117; color: #e6edf3; border-radius: 16px;">
      <h2 style="color: #a78bfa; margin-bottom: 8px;">New Jobs for You</h2>
      <p style="color: #8b949e; margin-bottom: 24px;">Hi ${name}, based on your alerts, here are some new opportunities on Lokonomy:</p>
      ${jobsHtml}
      <p style="color: #8b949e; font-size: 13px; margin-top: 24px;">You can manage your alerts in your Lokonomy profile.</p>
      <p style="color: #484f58; font-size: 12px; margin-top: 24px;">— Team Lokonomy</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Lokonomy: New Jobs Matching Your Alert",
    html
  });
};

module.exports = {
  sendEmail,
  sendJobAlertEmail,
};
