import nodemailer from "nodemailer"

// Create transporter
let transporter

// Check if we're in a test environment to use Mailtrap
if (process.env.NODE_ENV === "development" && process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
  // Mailtrap configuration for testing
  transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  })
  console.log("Using Mailtrap for email testing")
} else {
  // Regular email configuration
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
export const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
    return info
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
}

// Verify transporter connection
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify()
    console.log("Email server connection verified")
    return true
  } catch (error) {
    console.error("Email server connection failed:", error)
    return false
  }
}

// Email templates
export const emailTemplates = {
  passwordReset: (resetUrl) => ({
    subject: "Password Reset Request",
    text: `You requested a password reset. Please click the link below to reset your password. This link is valid for 1 hour.

${resetUrl}

If you did not request this password reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0f766e; text-align: center;">Password Reset Request</h2>
        <p>You requested a password reset for your Campus Marketplace account.</p>
        <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666;">If you did not request this password reset, please ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
          <p>Campus Marketplace</p>
        </div>
      </div>
    `,
  }),

  newMessage: (sender, content, loginUrl) => ({
    subject: "New message on Campus Marketplace",
    text: `You have a new message from ${sender} on Campus Marketplace.
    
Message: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"

Login to Campus Marketplace to view and reply to this message: ${loginUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0f766e; text-align: center;">New Message</h2>
        <p>You have a new message from <strong>${sender}</strong> on Campus Marketplace.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-style: italic;">"${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Message</a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
          <p>Campus Marketplace</p>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (name, verifyUrl) => ({
    subject: "Welcome to Campus Marketplace",
    text: `Welcome to Campus Marketplace, ${name}!

Thank you for joining our community. We're excited to have you on board.

To get started, you can:
- Browse products and businesses on your campus
- List your own products or business
- Connect with other students

If you have any questions, feel free to reach out to our support team.

Best regards,
The Campus Marketplace Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0f766e; text-align: center;">Welcome to Campus Marketplace!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for joining our community. We're excited to have you on board.</p>
        <p>To get started, you can:</p>
        <ul>
          <li>Browse products and businesses on your campus</li>
          <li>List your own products or business</li>
          <li>Connect with other students</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Visit Campus Marketplace</a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Campus Marketplace Team</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
          <p>Campus Marketplace</p>
        </div>
      </div>
    `,
  }),
}

