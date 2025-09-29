import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Proxy route for SendGrid
app.post('/send-email', async (req, res) => {
  const { to, from, subject, text } = req.body;

  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject,
          },
        ],
        from: { email: from },
        content: [
          {
            type: 'text/plain',
            value: text,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(response.status).send({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    res.status(error.response?.status || 500).send({
      message: 'Failed to send email',
      error: error.response?.data || error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`SendGrid Proxy server running on http://localhost:${PORT}`);
});