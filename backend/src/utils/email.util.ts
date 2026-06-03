import nodemailer from 'nodemailer';

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send email reminder
 */
export const sendEmailReminder = async (
  to: string,
  subject: string,
  taskTitle: string,
  taskDescription: string,
  reminderTime: Date
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Nhắc nhở công việc</h2>
          <p><strong>Tiêu đề:</strong> ${taskTitle}</p>
          <p><strong>Mô tả:</strong> ${taskDescription || 'Không có mô tả'}</p>
          <p><strong>Thời gian nhắc nhở:</strong> ${reminderTime.toLocaleString('vi-VN')}</p>
          <p style="margin-top: 20px; color: #666;">
            Đây là email tự động từ hệ thống Schedule 18.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email reminder sent to ${to}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Send project invitation email
 */
export const sendProjectInvitation = async (
  to: string,
  projectName: string,
  inviterName: string,
  role: 'viewer' | 'editor',
  projectId: string,
  frontendUrl?: string
): Promise<void> => {
  try {
    const transporter = createTransporter();
    const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    const projectUrl = `${baseUrl}/projects/${projectId}`;
    const roleText = role === 'editor' ? 'Biên tập viên' : 'Người xem';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: `Lời mời tham gia dự án: ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3B82F6; margin-bottom: 20px;">Lời mời tham gia dự án</h2>
          <p>Xin chào,</p>
          <p><strong>${inviterName}</strong> đã mời bạn tham gia dự án <strong>${projectName}</strong> với vai trò <strong>${roleText}</strong>.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Dự án:</strong> ${projectName}</p>
            <p style="margin: 5px 0 0 0;"><strong>Vai trò:</strong> ${roleText}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${projectUrl}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Xem dự án
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Nếu bạn chưa có tài khoản, vui lòng đăng ký tại <a href="${baseUrl}/login">${baseUrl}/login</a> trước khi tham gia dự án.
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 10px;">
            Đây là email tự động từ hệ thống Schedule 18.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Project invitation email sent to ${to}`);
  } catch (error) {
    console.error('❌ Error sending project invitation email:', error);
    throw error;
  }
};

