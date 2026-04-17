// emailService.js
// Microsoft Graph API via Azure AD — Office 365 / Outlook
// Handles all OTP email sending for the application
//
// Required .env variables:
//   AZURE_TENANT_ID=your-tenant-id
//   AZURE_CLIENT_ID=your-client-id
//   AZURE_CLIENT_SECRET=your-client-secret
//   MAIL_FROM=noreply@texionix.com   ← must be a valid O365 mailbox in your org
//
// Required Azure API Permission (Application):
//   Microsoft Graph → Mail.Send → Admin consent granted ✅

const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require(
  '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
);

// ── Validate required env vars ──
const validateEnv = () => {
  const required = [
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'MAIL_FROM',
  ];
  required.forEach((key) => {
    if (!process.env[key]) throw new Error(`Missing env variable: ${key}`);
  });
};

// ── Build authenticated Graph client ──
const getGraphClient = () => {
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID,
    process.env.AZURE_CLIENT_ID,
    process.env.AZURE_CLIENT_SECRET
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  });

  return Client.initWithMiddleware({ authProvider });
};

// ── Core send function ──
const sendEmail = async ({ to, subject, html }) => {
  validateEnv();

  const client = getGraphClient();

  const message = {
    subject,
    body: {
      contentType: 'HTML',
      content: html,
    },
    toRecipients: [
      {
        emailAddress: { address: to },
      },
    ],
  };

  await client
    .api(`/users/${process.env.MAIL_FROM}/sendMail`)
    .post({ message, saveToSentItems: false });

  console.log(`✅ Email sent via Microsoft Graph to: ${to}`);
};

// ── Shared OTP block HTML ──
const otpBlock = (otp) => `
  <div style="background:#0f1623;border:1px solid #1e2a3a;border-radius:12px;
              padding:28px;text-align:center;margin:0 0 24px;">
    <p style="margin:0 0 8px;color:#64748b;font-size:12px;
              letter-spacing:2px;text-transform:uppercase;">
      Your OTP Code
    </p>
    <div style="font-size:42px;font-weight:800;letter-spacing:10px;
                color:#3b82f6;font-family:'Courier New',monospace;">
      ${otp}
    </div>
  </div>
`;

// ── Shared email wrapper ──
const emailWrapper = (headerLabel, bodyHtml) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#0f1623;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table width="480" cellpadding="0" cellspacing="0"
            style="background:#1a2236;border-radius:16px;overflow:hidden;border:1px solid #1e2a3a;">

            <!-- Header -->
            <tr>
              <td style="background:#A10000;padding:32px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:1px;">
                  TEXIONIX
                </h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                  ${headerLabel}
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 40px;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #1e2a3a;">
                <p style="margin:0;color:#475569;font-size:12px;text-align:center;">
                  © ${new Date().getFullYear()} Texionix · TelexPH · This is an automated message, please do not reply.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

/* ══════════════════════════════════════════════════════════════
   sendPasswordResetOTP
   Used by: passwordResetRoute.js → POST /api/auth/forgot-password
══════════════════════════════════════════════════════════════ */
const sendPasswordResetOTP = async (toEmail, toName, otp) => {
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Hello,</p>
    <h2 style="margin:0 0 16px;color:#e2e8f0;font-size:18px;font-weight:600;">
      Password Reset Request
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      We received a request to reset the password for
      <strong style="color:#94a3b8;">${toName}</strong>'s account.
      Use the OTP code below to proceed. This code expires in
      <strong style="color:#94a3b8;">10 minutes</strong>.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      If you did not request a password reset, please ignore this email.
      Your password will remain unchanged.
    </p>
  `;

  await sendEmail({
    to:      toEmail,
    subject: 'Password Reset OTP — Texionix',
    html:    emailWrapper('Bug Reporting System', body),
  });
};

/* ══════════════════════════════════════════════════════════════
   sendChangePasswordOTP
   Used by: changePasswordRoute.js → Settings > Change Password
══════════════════════════════════════════════════════════════ */
const sendChangePasswordOTP = async (toEmail, toName, otp) => {
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Hello, ${toName}!</p>
    <h2 style="margin:0 0 16px;color:#e2e8f0;font-size:18px;font-weight:600;">
      Change Password Verification
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      You requested to change your account password. Use the OTP code below
      to verify your identity and proceed. This code expires in
      <strong style="color:#94a3b8;">10 minutes</strong>.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      If you did not request this change, please secure your account immediately
      and contact your system administrator.
    </p>
  `;

  await sendEmail({
    to:      toEmail,
    subject: 'Change Password Verification — Texionix',
    html:    emailWrapper('Account Security', body),
  });
};

/* ══════════════════════════════════════════════════════════════
   sendProfileUpdateOTP
   Used by: Settings > Profile Update (name/email changes)
══════════════════════════════════════════════════════════════ */
const sendProfileUpdateOTP = async (toEmail, toName, otp) => {
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Hello, ${toName}!</p>
    <h2 style="margin:0 0 16px;color:#e2e8f0;font-size:18px;font-weight:600;">
      Profile Update Verification
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      You requested to update your profile information. Use the OTP code below
      to verify and save your changes. This code expires in
      <strong style="color:#94a3b8;">10 minutes</strong>.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      If you did not initiate this profile update, please contact your
      system administrator immediately.
    </p>
  `;

  await sendEmail({
    to:      toEmail,
    subject: 'Profile Update Verification — Texionix',
    html:    emailWrapper('Account Settings', body),
  });
};

/* ══════════════════════════════════════════════════════════════
   sendConnectOutlookOTP
   Used by: Settings > Connected Accounts > Connect Outlook
   ✅ Dedicated OTP — separate from profile update OTP to avoid
      wrong email subject/body and double-send bugs.
══════════════════════════════════════════════════════════════ */
const sendConnectOutlookOTP = async (toEmail, toName, otp) => {
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Hello, ${toName}!</p>
    <h2 style="margin:0 0 16px;color:#e2e8f0;font-size:18px;font-weight:600;">
      Connect Outlook Verification
    </h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      You requested to link your Microsoft Outlook account to Texionix.
      Use the OTP code below to verify your identity and proceed.
      This code expires in <strong style="color:#94a3b8;">10 minutes</strong>.
    </p>
    ${otpBlock(otp)}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      If you did not request this, please ignore this email.
      Your account will not be affected.
    </p>
  `;

  await sendEmail({
    to:      toEmail,
    subject: 'Connect Outlook Verification — Texionix',
    html:    emailWrapper('Connected Accounts', body),
  });
};

module.exports = {
  sendPasswordResetOTP,
  sendChangePasswordOTP,
  sendProfileUpdateOTP,
  sendConnectOutlookOTP,
};