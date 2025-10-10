import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendEmployeeCredentials(
    email: string,
    name: string,
    username: string,
    password: string,
    isSuperAdmin: boolean,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Our Company - Your Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .credentials {
              background-color: white;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border: 1px solid #ddd;
            }
            .credential-item {
              margin: 10px 0;
              padding: 10px;
              background-color: #f5f5f5;
              border-radius: 3px;
            }
            .credential-label {
              font-weight: bold;
              color: #4F46E5;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background-color: #FEF3C7;
              padding: 15px;
              border-left: 4px solid #F59E0B;
              margin: 20px 0;
            }
            .info {
              background-color: #DBEAFE;
              padding: 15px;
              border-left: 4px solid #3B82F6;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Company!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              
              <p>Welcome to our team! Your employee account has been successfully created. Below are your login credentials to access the company system:</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <span class="credential-label">Email:</span> ${email}
                </div>
                <div class="credential-item">
                  <span class="credential-label">Username:</span> ${username}
                </div>
                <div class="credential-item">
                  <span class="credential-label">Temporary Password:</span> ${password}
                </div>
                ${
                  isSuperAdmin
                    ? '<div class="credential-item"><span class="credential-label">Account Type:</span> Super Admin</div>'
                    : ''
                }
              </div>

              ${
                !isSuperAdmin
                  ? `
              <div class="info">
                <strong>ℹ️ Login Process:</strong>
                <p>For security purposes, you will receive a One-Time Password (OTP) via email each time you log in. Please check your email for the OTP after entering your credentials.</p>
              </div>
              `
                  : ''
              }

              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                  <li>Please change your password immediately after your first login</li>
                  <li>Do not share your credentials with anyone</li>
                  <li>Use a strong, unique password</li>
                  ${!isSuperAdmin ? '<li>OTP is valid for 10 minutes only</li>' : ''}
                </ul>
              </div>

              <center>
                <a href="${frontendUrl}/signin" class="button">Login to Your Account</a>
              </center>

              <p>If you have any questions or need assistance, please contact the HR department.</p>

              <p>Best regards,<br>HR Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendOTP(email: string, name: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your Login OTP',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .otp-box {
              background-color: white;
              padding: 30px;
              text-align: center;
              border-radius: 5px;
              margin: 20px 0;
              border: 2px solid #4F46E5;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #4F46E5;
              letter-spacing: 8px;
              margin: 20px 0;
            }
            .warning {
              background-color: #FEF3C7;
              padding: 15px;
              border-left: 4px solid #F59E0B;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Login Verification</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              
              <p>You have requested to log in to your account. Please use the following One-Time Password (OTP) to complete your login:</p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; color: #666; font-size: 14px;">This code will expire in 10 minutes</p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>Never share this OTP with anyone</li>
                  <li>This OTP is valid for 10 minutes only</li>
                  <li>If you didn't request this OTP, please contact support immediately</li>
                </ul>
              </div>

              <p>If you have any questions or concerns, please contact our support team.</p>

              <p>Best regards,<br>Security Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
