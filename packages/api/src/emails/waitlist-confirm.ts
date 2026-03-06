interface WaitlistConfirmEmailParams {
  confirmUrl: string;
  queuePosition: number;
}

export function buildWaitlistConfirmHtml({
  confirmUrl,
  queuePosition,
}: WaitlistConfirmEmailParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Confirm your TheoTank waitlist spot</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F6F1;font-family:Inter,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F6F1;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#1A1A1A;">TheoTank</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#EFECE4;border-radius:12px;padding:32px;">

              <!-- Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#1B6B6D;border-radius:4px;padding:4px 10px;">
                    <span style="font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;font-weight:600;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.5px;">Waitlist</span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:16px 0 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;line-height:1.3;color:#1A1A1A;">Confirm your spot</h1>

              <!-- Body -->
              <p style="margin:16px 0 0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;line-height:1.6;color:#6B6560;">You're #${queuePosition} on the TheoTank waitlist. Click below to confirm your email and secure your place.</p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background-color:#B8963E;border-radius:8px;">
                    <a href="${confirmUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">Confirm My Email</a>
                  </td>
                </tr>
              </table>

              <!-- Plaintext fallback -->
              <p style="margin:16px 0 0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#6B6560;">Or copy this link: ${confirmUrl}</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-family:Inter,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#6B6560;">You received this email because you signed up for the TheoTank waitlist. If this wasn't you, you can safely ignore this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
