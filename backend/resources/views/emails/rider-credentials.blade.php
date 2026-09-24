<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Rider Account Credentials</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #1A2233;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #F4F5F7;
        }
        .header {
            background-color: #0B1F3B;
            color: #ffffff;
            padding: 24px 20px;
            text-align: center;
        }
        .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #D6DBE3;
            border-top: none;
        }
        .credentials-box {
            background-color: #ffffff;
            border: 1px solid #0B1F3B;
            border-left: 3px solid #0B1F3B;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin: 12px 0;
            padding: 12px;
            background-color: #FAFBFC;
            border: 1px solid #D6DBE3;
        }
        .credential-item:last-child {
            margin-bottom: 0;
        }
        .label {
            font-weight: bold;
            color: #64748B;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .value {
            font-size: 16px;
            color: #1A2233;
            margin-top: 5px;
        }
        .password-value {
            font-family: monospace;
            font-size: 18px;
            font-weight: bold;
            color: #0B1F3B;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #64748B;
            font-size: 12px;
        }
        .warning {
            background-color: #FFFBEB;
            border: 1px solid #F0D5A0;
            border-left: 3px solid #D97706;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #78350F;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">24 Hour Food</h1>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.75);">Rider Account Credentials</p>
    </div>

    <div class="content">
        <p>Hello {{ $userName }},</p>

        <p>Welcome to <strong>24 Hour Food</strong>! Your rider account has been created by the admin. Below are your login credentials:</p>

        <div class="credentials-box">
            <div class="credential-item">
                <div class="label">Email Address</div>
                <div class="value">{{ $userEmail }}</div>
            </div>

            <div class="credential-item">
                <div class="label">Temporary Password</div>
                <div class="password-value">{{ $temporaryPassword }}</div>
            </div>
        </div>

        <div class="warning">
            <strong>Important:</strong> This is a temporary password. Please change it immediately after your first login for security purposes.
        </div>

        <p><strong>How to login:</strong></p>
        <ol>
            <li>Go to the 24 Hour Food rider app or website</li>
            <li>Enter your email address: <strong>{{ $userEmail }}</strong></li>
            <li>Enter your temporary password</li>
            <li>You will be prompted to create a new password</li>
        </ol>

        <p>If you have any questions or need assistance, please contact the admin.</p>

        <p>Best regards,<br>
        <strong>24 Hour Food Team</strong></p>
    </div>

    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; 2024 24 Hour Food. All rights reserved.</p>
    </div>
</body>
</html>