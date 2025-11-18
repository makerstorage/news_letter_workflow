#!/usr/bin/env node

/**
 * Newsletter Email Sender
 *
 * Sends the AI news digest newsletter via Gmail SMTP
 * Converts markdown to styled HTML for better presentation
 *
 * Usage: node scripts/send-newsletter.js <newsletter-file-path>
 * Example: node scripts/send-newsletter.js pw-out/ai-news-digest-2025-11-17.md
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { marked } = require('marked');
require('dotenv').config();

// Validate command line arguments
if (process.argv.length < 3) {
  console.error('Error: Newsletter file path required');
  console.error('Usage: node scripts/send-newsletter.js <newsletter-file-path>');
  process.exit(1);
}

const newsletterFilePath = process.argv[2];

// Check if file exists
if (!fs.existsSync(newsletterFilePath)) {
  console.error(`Error: Newsletter file not found: ${newsletterFilePath}`);
  process.exit(1);
}

// Validate environment variables
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_APP_PASSWORD', 'EMAIL_TO'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease create a .env file with these variables.');
  console.error('See .env.example for template.');
  process.exit(1);
}

// Configure email transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Read newsletter content
console.log(`Reading newsletter from: ${newsletterFilePath}`);
const markdownContent = fs.readFileSync(newsletterFilePath, 'utf8');

// Extract date from filename (e.g., ai-news-digest-2025-11-17.md)
const filename = path.basename(newsletterFilePath);
const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
const dateStr = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

// Convert markdown to HTML with custom styling
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI News Digest - ${dateStr}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #4a90e2;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #2c3e50;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h3 {
      color: #34495e;
      margin-top: 20px;
    }
    a {
      color: #4a90e2;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #e0e0e0;
      margin: 30px 0;
    }
    p {
      margin-bottom: 15px;
    }
    ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    strong {
      color: #2c3e50;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 0.9em;
      color: #666;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    ${marked(markdownContent)}
  </div>
</body>
</html>
`;

// Parse recipients (comma-separated)
const recipients = process.env.EMAIL_TO.split(',').map(email => email.trim());

// Prepare email options
const mailOptions = {
  from: process.env.EMAIL_FROM || `"AI News Digest" <${process.env.EMAIL_USER}>`,
  to: recipients,
  subject: process.env.EMAIL_SUBJECT || `AI News Digest - ${dateStr}`,
  html: htmlContent,
  text: markdownContent, // Fallback plain text version
};

// Send email
console.log(`Sending newsletter to: ${recipients.join(', ')}`);
console.log(`Subject: ${mailOptions.subject}`);

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Failed to send email:');
    console.error(error.message);
    process.exit(1);
  } else {
    console.log('Newsletter sent successfully!');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Recipients: ${recipients.length}`);
  }
});
