<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>Your Verification Code</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
    body, table, td { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #eef1f5; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    a { text-decoration: none; }

    @media only screen and (max-width: 600px) {
        .email-container { width: 100% !important; }
        .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
        .otp-code { font-size: 30px !important; letter-spacing: 6px !important; }
    }
</style>
</head>
<body style="margin:0; padding:0; background-color:#eef1f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f5;">
        <tr>
            <td align="center" style="padding: 32px 16px;">
                <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(15, 23, 42, 0.08);">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#0b2545; padding: 28px 24px;">
                            <span style="font-size:20px; font-weight:700; color:#ffffff; letter-spacing:0.3px;">
                                24Hour Food
                            </span>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td class="email-padding" style="padding: 40px 40px 24px 40px;">
                            <h1 style="margin:0 0 16px 0; font-size:22px; line-height:28px; font-weight:700; color:#0f172a; text-align:center;">
                                Your Verification Code
                            </h1>
                            <p style="margin:0 0 24px 0; font-size:15px; line-height:24px; color:#475569; text-align:center;">
                                We received a request that requires verifying your identity on 24Hour Food.
                                Enter the code below to continue.
                            </p>

                            <!-- OTP Box -->
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px;">
                                            <tr>
                                                <td class="otp-code" style="padding: 18px 36px; font-size:36px; font-weight:700; letter-spacing:10px; color:#0b2545; font-family: 'Courier New', Courier, monospace;">
                                                    {{ $code }}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:24px 0 0 0; font-size:14px; line-height:22px; color:#64748b; text-align:center;">
                                This code will expire in <strong>{{ $ttlMinutes }} minutes</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- Security note -->
                    <tr>
                        <td class="email-padding" style="padding: 0 40px 32px 40px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border-left:3px solid #cbd5e1; border-radius:4px;">
                                <tr>
                                    <td style="padding: 14px 18px; font-size:13px; line-height:20px; color:#64748b;">
                                        If you didn't request this code, you can safely ignore this email. Your account remains secure.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 24px; background-color:#f8fafc; border-top:1px solid #eef1f5;">
                            <p style="margin:0; font-size:12px; line-height:18px; color:#94a3b8;">
                                This is an automated message from 24Hour Food. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
