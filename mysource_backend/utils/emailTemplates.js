exports.passwordReset = (resetUrl) => ({
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
})

exports.newMessage = (sender, content, loginUrl) => ({
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
})

exports.welcomeEmail = (name, verifyUrl) => ({
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
})

exports.emailVerification = (verificationUrl, name) => {
  return {
    subject: "Verify Your Email - Campus Marketplace",
    text: `Hello ${name},

Thank you for registering with Campus Marketplace! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

Best regards,
The Campus Marketplace Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a5568;">Verify Your Email Address</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with Campus Marketplace! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #4299e1;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Best regards,<br>The Campus Marketplace Team</p>
      </div>
    `,
  }
}

// New template for bid acceptance
exports.bidAccepted = (freelancerName, gigTitle, amount, gigUrl) => {
  return {
    subject: "Your Bid Has Been Accepted - Campus Marketplace",
    text: `Hello ${freelancerName},

Congratulations! Your bid for the gig "${gigTitle}" has been accepted.

Bid Amount: $${amount}

You can view the gig details and start working by clicking the link below:
${gigUrl}

Please contact the client through our messaging system to discuss the next steps.

Best regards,
The Campus Marketplace Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0f766e; text-align: center;">Your Bid Has Been Accepted!</h2>
        <p>Hello ${freelancerName},</p>
        <p>Congratulations! Your bid for the gig <strong>"${gigTitle}"</strong> has been accepted.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px;">Bid Amount</p>
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #0f766e;">$${amount}</p>
        </div>
        
        <p>The client has placed the payment in escrow, which will be released to you once the work is completed and approved.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${gigUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Gig Details</a>
        </div>
        
        <p>Please contact the client through our messaging system to discuss the next steps and project requirements.</p>
        
        <p>Best regards,<br>The Campus Marketplace Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
          <p>Campus Marketplace</p>
        </div>
      </div>
    `,
  }
}

// New template for gig completion and payment release
exports.gigCompleted = (freelancerName, gigTitle, amount, gigUrl) => {
  return {
    subject: "Gig Completed and Payment Released - Campus Marketplace",
    text: `Hello ${freelancerName},

Great news! The gig "${gigTitle}" has been marked as completed by the client, and your payment has been released.

Payment Amount: $${amount}

The funds have been added to your wallet. You can withdraw them at any time.

You can view the completed gig details by clicking the link below:
${gigUrl}

Thank you for your work on the Campus Marketplace platform!

Best regards,
The Campus Marketplace Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0f766e; text-align: center;">Gig Completed and Payment Released!</h2>
        <p>Hello ${freelancerName},</p>
        <p>Great news! The gig <strong>"${gigTitle}"</strong> has been marked as completed by the client, and your payment has been released.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px;">Payment Amount</p>
          <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #0f766e;">$${amount}</p>
        </div>
        
        <p>The funds have been added to your wallet. You can withdraw them at any time.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${gigUrl}" style="display: inline-block; background-color: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Completed Gig</a>
        </div>
        
        <p>Thank you for your work on the Campus Marketplace platform!</p>
        
        <p>Best regards,<br>The Campus Marketplace Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #999;">
          <p>Campus Marketplace</p>
        </div>
      </div>
    `,
  }
}
