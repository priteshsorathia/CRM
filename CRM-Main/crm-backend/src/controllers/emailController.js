const { sendCredentialsEmail, testEmailConfig } = require('../utils/emailService');

const sendEmail = async (req, res) => {
  try {
    const { email, credentials } = req.body;

    if (!email || !credentials) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and credentials are required' 
      });
    }

    console.log('📧 Sending email via API to:', email);
    console.log('📦 Credentials:', credentials);

    const result = await sendCredentialsEmail(email, credentials);

    if (result.success) {
      console.log('✅ Email sent successfully via API');
      res.json({
        success: true,
        message: 'Email sent successfully',
        data: { 
          messageId: result.messageId,
          previewUrl: result.previewUrl 
        }
      });
    } else {
      console.error('❌ Email sending failed via API:', result.error);
      res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Email controller error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};

// Test email configuration
const testEmail = async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    const testResult = await testEmailConfig();
    
    if (testResult.success) {
      console.log('✅ Email configuration test passed');
      res.json({
        success: true,
        message: 'Email configuration is working correctly',
        data: testResult
      });
    } else {
      console.error('❌ Email configuration test failed:', testResult.error);
      res.status(500).json({
        success: false,
        error: 'Email configuration test failed',
        details: testResult.error
      });
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      success: false,
      error: 'Email test failed',
      details: error.message
    });
  }
};

// Send test email
const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    console.log('🧪 Sending test email to:', email);
    
    const testCredentials = {
      email: email,
      password: 'TestPassword123!',
      shopId: 999,
      shopName: 'Test Shop'
    };

    const result = await sendCredentialsEmail(email, testCredentials);

    if (result.success) {
      console.log('✅ Test email sent successfully');
      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          messageId: result.messageId,
          previewUrl: result.previewUrl
        }
      });
    } else {
      console.error('❌ Test email failed:', result.error);
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      error: 'Test email failed',
      details: error.message
    });
  }
};

module.exports = { 
  sendEmail,
  testEmail,
  sendTestEmail
};