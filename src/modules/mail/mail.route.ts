import { Router } from "express";
import type { Request, Response } from "express";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import NodeCache from "node-cache";
const mail_host = process.env.MAIL_HOST;
const mail_user = process.env.MAIL_CM_USER;
const mail_pass = process.env.MAIL_CM_PASS;
const mail_port = process.env.MAIL_PORT;

export const mailRouter = Router();
export const otpCache = new NodeCache({ stdTTL: 300 });

const transporter = nodemailer.createTransport({
  host: mail_host,
  port: mail_port,
  auth: {
    user: mail_user,
    pass: mail_pass,
  },
});

export async function generateOTP(): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

export async function storeOTP(userId: string, otp: string): Promise<boolean> {
  const key = String(userId);
  const value = String(otp);
  // node-cache.set returns boolean
  return otpCache.set(key, value);
}

export async function generateUserId(): Promise<string> {
  return uuidv4();
}

export function getStoredOTP(userId: string): string | undefined {
  return otpCache.get<string>(String(userId));
}

// ========= Contact Form Route =========
mailRouter.post("/contact", async (req: Request, res: Response) => {
  const { subject, body, to } = req.body;

  // Build email options
  const mailOptions = {
    from: '"Skyfuel Team" <support@curlmin.com>', // sender address using curlmin for development
    to, // recipient
    subject, // subject line
    html: body, // email content (HTML)
  };

  // Send mail via Nodemailer transporter
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.json({
        success: false,
        msg: `Error occurred: ${error}`,
      });
    }

    return res.json({
      success: true,
      msg: `Email sent successfully: ${info.response}`,
    });
  });
});

mailRouter.post("/sendmail", async (req: Request, res: Response) => {
  const { email, name, page } = req.body as {
    email: string;
    name?: string;
    page?: string;
  };

  // Generate temporary user ID and OTP
  const userId = await generateUserId();
  const otp = await generateOTP();

  // Store OTP in cache (for later verification)
  await storeOTP(userId, otp);

  // ========================= Build mail options =============================================
  //   HTML email template with inline CSS for to show email in the user email account
  // ===========================================================================================
  const mailOptions = {
    from: '"Skyfuel Support" <support@curlmin.com>',
    to: email,
    subject: "Skyfuel Account Verification",
    html: `<head>
        <style>
            /* Reset styles for email clients */
            .ExternalClass { width: 100%; }
            .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
            body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table { border-spacing: 0; }
            table td { border-collapse: collapse; }
            @media screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .mobile-hide { display: none !important; }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f6f6f6;">
        <!-- Main container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto;">
            <tr style="background-color:lightgray;">
                <td style="padding: 20px 0; text-align: center">
                    <h5>Skyfuel</h5>
                </td>
            </tr>
            
            <!-- Email content -->
            <tr>
                <td style="background: #ffffff; padding: 40px 30px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding-bottom: 20px;">
                                <h1 style="margin: 0; font-family: Arial, sans-serif; color: #333333;">Hello, ${name}!</h1>
                            </td>
                        </tr>
                        ${
                          page === "signup"
                            ? `<tr>
                            <td style="padding-bottom: 25px;">
                                <p style="margin: 0; font-family: Arial, sans-serif; color: #666666; line-height: 1.6;">
                                    Thank you for registering with our service. We're excited to have you on board!
                                </p>
                            </td>
                        </tr>`
                            : ""
                        }
                        <tr>
                            <td style="padding-bottom: 25px;">
                                <p style="margin:0; font-family: Arial, sans-serif; color: #666666;">Please find your OTP below</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 30px;">
                                <a href="#" 
                                style="background-color: #007bff; color: #ffffff; padding: 12px 45px; 
                                        text-decoration: none; border-radius: 5px; display: inline-block;
                                        font-family: Arial, sans-serif; font-weight: bold;">
                                    ${otp}
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <p style="margin: 0; font-family: Arial, sans-serif; color: #666666; line-height: 1.6;">
                                    If you have any questions, feel free to <a href="https://skyfuel.in/contactus" style="color: #007bff; text-decoration: none;">contact our support team</a>.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="padding: 30px 20px; text-align: center;">
                    <p style="margin: 0; font-family: Arial, sans-serif; color: #999999; font-size: 12px;">
                        © 2025 skyfuel . All rights reserved.<br>
                        <a href="https://skyfuel.in" style="color: #999999; text-decoration: none;">View Site</a> | 
                        <a href="https://skyfuel.in/privacy-policy" style="color: #999999; text-decoration: none;">Privacy Policy</a> |
                        <a href="https://skyfuel.in/terms" style="color: #999999; text-decoration: none;">Terms of Service</a>
                    </p>
                </td>
            </tr>
        </table>
    </body>`,
  };

  // Send email using nodemailer

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.json({
        success: false,
        msg: `error occurred: ${error}`,
        uid: null,
      });
    }

    // Send OTP id in response for verification purpose
    return res.json({
      success: true,
      msg: `Email sent successfully: ${info.response}`,
      uid: userId,
    });
  });
});

// Verify OTP Route
mailRouter.post("/verifyotp", async (req: Request, res: Response) => {
  const { userId, otp } = req.body as { userId?: string; otp?: string };

  if (!userId || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "userId and otp are required" });
  }

  const storedOtp = getStoredOTP(userId);

  if (!storedOtp) {
    return res
      .status(400)
      .json({ success: false, message: "OTP expired or invalid user ID" });
  }

  if (storedOtp === String(otp)) {
    // Optionally delete the OTP after successful verification:
    otpCache.del(String(userId));
    return res.json({ success: true, message: "OTP verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});
