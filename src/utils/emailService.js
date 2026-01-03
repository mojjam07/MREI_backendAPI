const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send reply email to contact message sender
const sendContactReplyEmail = async (recipientEmail, recipientName, originalMessage, replyText) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"School Management System" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: 'Reply to Your Contact Message',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${recipientName},</h2>

          <p>Thank you for contacting us. We have received your message and would like to provide the following response:</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #666;">Your Original Message:</h3>
            <p style="margin-bottom: 0;">${originalMessage}</p>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="margin-top: 0; color: #2E7D32;">Our Reply:</h3>
            <p style="margin-bottom: 0; white-space: pre-wrap;">${replyText}</p>
          </div>

          <p>If you have any further questions or need additional assistance, please don't hesitate to contact us again.</p>

          <p>Best regards,<br>
          School Management System Team</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated response to your contact form submission.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reply email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending reply email:', error);
    throw new Error('Failed to send reply email');
  }
};

module.exports = {
  sendContactReplyEmail
};
