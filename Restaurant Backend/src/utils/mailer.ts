import nodemailer from 'nodemailer';

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ─── Password Generator ───────────────────────────────────────────────────────
// Rule: First 3 chars of name (UPPER) + "@" + First 4 digits of mobile
// Example: name="Raj", mobile="1234567890" → "RAJ@1234"
export const generateOwnerPassword = (name: string, mobile: string): string => {
  const namePart = name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const mobilePart = mobile.replace(/\D/g, '').substring(0, 4);
  return `${namePart}@${mobilePart}`;
};

// ─── Email Template — Owner Credentials ──────────────────────────────────────
const buildCredentialsEmail = (
  ownerName: string,
  hotelName: string,
  email: string,
  password: string,
  loginUrl: string,
  appName: string
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to ${appName}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 36px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 36px 40px; }
    .body h2 { color: #1a1a2e; font-size: 20px; margin: 0 0 10px; }
    .body p { color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 20px; }
    .cred-box { background: #f8f9fb; border: 1px solid #e0e4ef; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eaedf3; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { color: #888; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .cred-value { color: #1a1a2e; font-size: 15px; font-weight: 700; font-family: monospace; }
    .btn-wrap { text-align: center; margin: 28px 0 10px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #ff6b35, #f7931e); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; }
    .warning { background: #fff8e1; border-left: 4px solid #f7931e; border-radius: 4px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #7a5c00; }
    .footer { background: #f4f6f9; text-align: center; padding: 20px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🍽️ ${appName}</h1>
      <p>Platform-Powered Restaurant Management</p>
    </div>
    <div class="body">
      <h2>Welcome, ${ownerName}! 👋</h2>
      <p>
        Your restaurant <strong>${hotelName}</strong> has been successfully onboarded on our platform.
        Below are your login credentials. Please keep them safe.
      </p>

      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">📧 Email</span>
          <span class="cred-value">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">🔑 Password</span>
          <span class="cred-value">${password}</span>
        </div>
      </div>

      <div class="warning">
        ⚠️ <strong>Security Tip:</strong> Please change your password immediately after your first login.
      </div>

      <div class="btn-wrap">
        <a href="${loginUrl}" class="btn">Login to Dashboard →</a>
      </div>

      <p style="font-size:13px; color:#999; text-align:center; margin-top: 16px;">
        If the button doesn't work, copy this link:<br/>
        <a href="${loginUrl}" style="color:#ff6b35;">${loginUrl}</a>
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
      Yeh email automatically bheja gaya hai — please reply mat karein.
    </div>
  </div>
</body>
</html>
`;

// ─── Send Owner Credentials Email ─────────────────────────────────────────────
export const sendOwnerCredentials = async (
  ownerName: string,
  hotelName: string,
  email: string,
  password: string
): Promise<void> => {
  const appName = process.env.APP_NAME || 'Restaurant QR System';
  const loginUrl = `${process.env.APP_URL || 'http://localhost:5173'}/owner/login`;

  const mailOptions = {
    from: `"${appName}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `🎉 Welcome to ${appName} — Your Login Credentials`,
    html: buildCredentialsEmail(ownerName, hotelName, email, password, loginUrl, appName),
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Credentials email sent to: ${email}`);
};
