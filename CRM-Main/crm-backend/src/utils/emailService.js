const nodemailer = require('nodemailer');

// Create transporter for custom SMTP
const createTransporter = () => {
  try {
    console.log('🔧 Creating SMTP transporter...');
    console.log('📧 SMTP config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      secure: process.env.EMAIL_SECURE === 'true'
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('✅ SMTP Transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Error creating SMTP transporter:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    console.log('🧪 Testing SMTP configuration...');

    const transporter = createTransporter();

    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP server is ready to take our messages');

    return {
      success: true,
      message: 'SMTP configuration is correct',
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        secure: process.env.EMAIL_SECURE
      }
    };
  } catch (error) {
    console.error('❌ SMTP configuration error:', error);
    return {
      success: false,
      error: error.message,
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        secure: process.env.EMAIL_SECURE
      }
    };
  }
};

// Send credentials email
const sendCredentialsEmail = async (email, credentials) => {
  try {
    console.log('📧 Attempting to send email to:', email);

    const transporter = createTransporter();

    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'CRM Shop Management',
        address: process.env.EMAIL_FROM
      },
      to: email,
      subject: 'Your Shop Dashboard Credentials - CRM',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .credential-item { margin: 10px 0; padding: 10px; background: #f8fafc; border-radius: 5px; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to CRM!</h1>
                <p>Your Shop Management Dashboard</p>
            </div>
            
            <div class="content">
                <h2>Your Shop Has Been Created Successfully! 🎉</h2>
                <p>Dear Shop Owner,</p>
                
                <p>Your shop <strong>${credentials.shopName}</strong> has been successfully registered with CRM. Here are your login credentials:</p>
                
                <div class="credentials">
                    <h3>🔐 Login Credentials</h3>
                    <div class="credential-item">
                        <strong>Email:</strong> ${credentials.email}
                    </div>
                    <div class="credential-item">
                        <strong>Password:</strong> ${credentials.password}
                    </div>
                    <div class="credential-item">
                        <strong>Shop ID:</strong> ${credentials.shopId}
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong><br>
                    Please change your password immediately after first login for security reasons.
                </div>
                
                <p>
                    <a href="${process.env.CLIENT_URL}/auth/login" class="button">Login to Your Dashboard</a>
                </p>

                <p><strong>Login URL:</strong> ${process.env.CLIENT_URL}/auth/login</p>

                <p>If you have any questions, please contact our <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/support" style="color: #667eea; text-decoration: underline;">support team</a>.</p>
                
                <p>Best regards,<br>CRM Team</p>
            </div>
            
            <div class="footer">
                <p>© ${new Date().getFullYear()} CRM Private Limited. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </body>
        </html>
      `,
      text: `
        Welcome to CRM!
        
        Your shop "${credentials.shopName}" has been successfully registered.
        
        LOGIN CREDENTIALS:
        Email: ${credentials.email}
        Password: ${credentials.password}
        Shop ID: ${credentials.shopId}
        
        IMPORTANT: Please change your password after first login.
        
        Login URL: ${process.env.CLIENT_URL}/auth/login
        
        Best regards,
        CRM Team
      `
    };

    console.log('📨 Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully! Message ID:', result.messageId);

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send password reset email - Clean version
const sendPasswordResetEmail = async (email, data) => {
  try {
    console.log('📧 Sending password reset email to:', email);
    console.log('📧 Reset URL:', data.resetUrl);

    const transporter = createTransporter();
    
    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError) {
      console.error('❌ SMTP verification failed:', verifyError);
      throw new Error('Email service configuration error. Please contact support.');
    }

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'CRM Shop Management',
        address: process.env.EMAIL_FROM
      },
      to: email,
      subject: 'Reset Your CRM Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #f8fafc; }
                .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; padding: 14px 35px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; margin: 25px 0; font-size: 16px; font-weight: 600; transition: all 0.3s ease; }
                .button:hover { background: #5a6fd8; transform: translateY(-2px); box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3); }
                .security-note { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 16px; margin: 25px 0; border-radius: 4px; }
                .footer { background: #f8fafc; padding: 25px 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
                .center { text-align: center; }
                .greeting { font-size: 18px; color: #1e293b; margin-bottom: 20px; }
                .instruction { color: #475569; margin-bottom: 25px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
                    <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">CRM Account Security</p>
                </div>
                
                <div class="content">
                    <div class="greeting">Hello <strong>${data.name}</strong>,</div>
                    
                    <p class="instruction">You requested to reset your CRM account password. Click the button below to create a new secure password.</p>
                    
                    <div class="center">
                        <a href="${data.resetUrl}" class="button">Reset Password Now</a>
                    </div>
                    
                    <div class="security-note">
                        <strong>🔒 Security Notice:</strong><br>
                        • This link expires in <strong>${data.expiryTime}</strong><br>
                        • For your security, please do not share this email<br>
                        • If you didn't request this, your account is safe
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
                        Need help? Contact our <a href="${data.resetUrl.split('/auth/reset-password')[0]}/auth/support" style="color: #667eea; text-decoration: underline;">support team</a>.
                    </p>
                </div>
                
                <div class="footer">
                    <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} CRM Private Limited. All rights reserved.</p>
                    <p style="margin: 0; font-size: 11px; opacity: 0.8;">This is an automated security message.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `
        Reset Your CRM Password
        
        Hello ${data.name},
        
        You requested to reset your CRM account password.
        
        Reset your password here: ${data.resetUrl}
        
        SECURITY NOTICE:
        - This link expires in ${data.expiryTime}
        - For your security, please do not share this email
        - If you didn't request this, your account is safe
        
        Need help? Contact our support team.
        
        © ${new Date().getFullYear()} CRM Private Limited.
        This is an automated security message.
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully!');

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Password reset email failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send Client Profile Email with Attachment
const sendClientProfileEmail = async (email, clientData, pdfBuffer) => {
  try {
    console.log('📧 Sending client profile email to:', email);

    const transporter = createTransporter();
    
    await transporter.verify();

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'CRM Shop Management',
        address: process.env.EMAIL_FROM
      },
      to: email,
      subject: `Client Profile: ${clientData.company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Client Profile Details</h2>
          <p>Hello,</p>
          <p>Please find the profile details for <strong>${clientData.company}</strong> attached as a PDF.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Client ID:</strong> ${clientData.clientId}</p>
            <p style="margin: 5px 0;"><strong>Company:</strong> ${clientData.company}</p>
            <p style="margin: 5px 0;"><strong>Contact:</strong> ${clientData.contact}</p>
          </div>
          <p>Best regards,<br>CRM Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `${clientData.company}_Profile.pdf`,
          content: pdfBuffer
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Client profile email sent successfully!');

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Client profile email failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send shop status update email
const sendShopStatusNotificationEmail = async (email, data) => {
  try {
    console.log('📧 Sending shop status email to:', email);
    const transporter = createTransporter();
    await transporter.verify();

    const subject = data.isBlocked 
      ? `Important Security Notice: Shop Blocked - CRM` 
      : `Shop Activated Successfully - CRM`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background: #f8fafc; }
              .container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin: 20px; }
              .header { background: ${data.isBlocked ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #10b981 0%, #047857 100%)'}; padding: 40px 30px; text-align: center; color: white; }
              .content { padding: 40px 30px; }
              .status-box { background: ${data.isBlocked ? '#fee2e2' : '#d1fae5'}; border-left: 4px solid ${data.isBlocked ? '#ef4444' : '#10b981'}; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .footer { background: #f8fafc; padding: 25px 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${data.isBlocked ? 'Shop Suspended' : 'Shop Activated'}</h1>
                  <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">CRM Account Notification</p>
              </div>
              
              <div class="content">
                  <p>Hello <strong>${data.name}</strong>,</p>
                  
                  <p>There has been a status change for your shop <strong>${data.shopName}</strong> on the CRM platform.</p>
                  
                  <div class="status-box">
                      <strong>Current Status:</strong> ${data.isBlocked ? '🚨 BLOCKED / SUSPENDED' : '✅ ACTIVE / RUNNING'}<br><br>
                      ${data.isBlocked 
                        ? 'Your shop access has been suspended by the CRM Administrator. You and your staff will not be able to log in or access your dashboard. If you believe this is a mistake or need clarification, please reach out to the support team immediately.'
                        : 'Your shop has been activated/unlocked by the CRM Administrator. You and your staff can now successfully log in and resume using all dashboard features.'}
                  </div>
                  
                  ${!data.isBlocked ? `
                  <p style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Login to Your Dashboard</a>
                  </p>
                  ` : ''}
                  
                  <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
                      Need help? Contact our <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/support" style="color: #667eea; text-decoration: underline;">support team</a>.
                  </p>
              </div>
              
              <div class="footer">
                  <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} CRM Private Limited. All rights reserved.</p>
                  <p style="margin: 0; font-size: 11px; opacity: 0.8;">This is an automated system notification.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'CRM Shop Management',
        address: process.env.EMAIL_FROM
      },
      to: email,
      subject: subject,
      html: htmlContent,
      text: `
        Shop Status Notification:
        
        Hello ${data.name},
        
        Your shop "${data.shopName}" status has been changed to: ${data.isBlocked ? 'Blocked' : 'Active'}.
        
        ${data.isBlocked 
          ? 'Your shop access has been suspended by the CRM Administrator. You and your staff will not be able to log in or access your dashboard.'
          : 'Your shop has been activated/unlocked by the CRM Administrator. You and your staff can now successfully log in and resume using all dashboard features.'}
        
        Best regards,
        CRM Team
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Shop status notification email sent successfully!');
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Shop status notification email failed:', error);
    return { success: false, error: error.message };
  }
};

// FIX: Add sendPasswordResetEmail to exports
module.exports = {
  sendCredentialsEmail,
  testEmailConfig,
  sendPasswordResetEmail,
  sendClientProfileEmail,
  sendShopStatusNotificationEmail,
  createTransporter
};