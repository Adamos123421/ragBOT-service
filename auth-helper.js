const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  ' https://deaf-finish-contribution-retrieval.trycloudflare.com/auth/google/callback'
);

// Scopes for Google Drive access
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent to get refresh token
  });
  
  console.log('🔗 Please visit this URL to authorize the application:');
  console.log(authUrl);
  console.log('\n📋 After authorization, you will be redirected to get your refresh token.');
  
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Authorization code not found');
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\n✅ Authentication successful!');
    console.log('\n📝 Add this refresh token to your .env file:');
    console.log('='.repeat(50));
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('='.repeat(50));
    console.log('\n🔐 Keep this token secure and never share it publicly!');
    
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success { color: #10a37f; font-weight: bold; }
            .token {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              font-family: monospace;
              word-break: break-all;
              border: 1px solid #dee2e6;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">✅ Authentication Successful!</h1>
            <p>Your Google Drive access has been configured successfully.</p>
            
            <h3>📝 Add this refresh token to your .env file:</h3>
            <div class="token">GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>Keep this token secure and never share it publicly</li>
                <li>Add it to your .env file</li>
                <li>Restart your application after adding the token</li>
              </ul>
            </div>
            
            <p><strong>Next steps:</strong></p>
            <ol>
              <li>Copy the refresh token above</li>
              <li>Add it to your .env file</li>
              <li>Restart your application</li>
              <li>Start using your RAG bot!</li>
            </ol>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Error getting tokens:', error);
    res.status(500).send('Error getting tokens: ' + error.message);
  }
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>RAG Bot - Google Auth Helper</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .btn {
            background: #10a37f;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
          }
          .btn:hover { background: #0d8a6f; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 RAG Bot - Google Authentication</h1>
          <p>This helper will guide you through setting up Google Drive access for your RAG bot.</p>
          
          <h3>Prerequisites:</h3>
          <ul>
            <li>Google Cloud Platform project with Drive API enabled</li>
            <li>OAuth 2.0 credentials configured</li>
            <li>Environment variables set up in .env file</li>
          </ul>
          
          <h3>What this will do:</h3>
          <ul>
            <li>Redirect you to Google's authorization page</li>
            <li>Request access to your Google Drive files</li>
            <li>Generate a refresh token for the application</li>
            <li>Provide you with the token to add to your .env file</li>
          </ul>
          
          <a href="/auth/google" class="btn">🚀 Start Google Authentication</a>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🔧 Auth helper running on http://localhost:${PORT}`);
  console.log(`📖 Visit http://localhost:${PORT} to start the authentication process`);
});
