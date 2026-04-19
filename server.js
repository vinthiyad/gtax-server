const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------
// Nodemailer transporter using Gmail
// -----------------------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,       // your gmail address
    pass: process.env.GMAIL_APP_PASS,   // your app password
  },
});

// -----------------------------------------------
// POST /send — receives form data, sends email
// -----------------------------------------------
app.post("/send", async (req, res) => {
  const { name, phone, email, service, message } = req.body;

  if (!name || !phone || !service) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,         // sends to yourself
    replyTo: email || process.env.GMAIL_USER,
    subject: `New Consultation Request — ${service}`,
    html: `
      <h2 style="color:#4a7c59;">New Consultation Request — G-TAX</h2>
      <table style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email || "Not provided"}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Service</td><td style="padding:8px;border:1px solid #ddd;">${service}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Message</td><td style="padding:8px;border:1px solid #ddd;">${message || "None"}</td></tr>
      </table>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// -----------------------------------------------
// Keep-alive: pings itself every 14 minutes
// so Render free tier never sleeps
// -----------------------------------------------
const RENDER_URL = process.env.RENDER_URL; // your Render URL

if (RENDER_URL) {
  setInterval(async () => {
    try {
      await fetch(RENDER_URL + "/ping");
      console.log("Keep-alive ping sent");
    } catch (e) {
      console.error("Keep-alive failed:", e.message);
    }
  }, 14 * 60 * 1000); // every 14 minutes
}

app.get("/ping", (req, res) => res.send("pong"));

// -----------------------------------------------
// Start server
// -----------------------------------------------
const PORT = process.env.PORT || 3000;
app.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: "Test Email from G-TAX Server",
      text: "Server is working correctly!"
    });
    res.send("Email sent successfully!");
  } catch (err) {
    res.send("Email failed: " + err.message);
  }
});
app.listen(PORT, () => console.log(`G-TAX server running on port ${PORT}`));
