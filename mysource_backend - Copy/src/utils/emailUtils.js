import nodemailer from "nodemailer"

// Create transporter
let transporter

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
    // Verify connection before sending
    await transporter.verify()

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
    return info
  } catch (error) {
    console.error("Error sending email:", error)

    // Try to recreate transporter if there was a connection issue
    if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.log("Attempting to recreate email transporter...")
      try {
        transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number.parseInt(process.env.EMAIL_PORT),
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })

        // Try sending again with new transporter
        const info = await transporter.sendMail(mailOptions)
        console.log("Email sent after transporter recreation:", info.messageId)
        return info
      } catch (retryError) {
        console.error("Failed to send email after transporter recreation:", retryError)
        throw retryError
      }
    }

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

