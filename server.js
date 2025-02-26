require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

app.post("/send-email", async (req, res) => {
  try {
    const { journalName, title, name, email } = req.body;

    if (!journalName || !title || !name || !email) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email, 
      subject: "Thank You for Your Submission",
      html: `
        <h2>Thank You for Your Submission!</h2>
        <p>We have received your journal submission. Our team will review it and get back to you shortly.</p>
      `,
    };

    const ccMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CC_EMAIL,
      subject: "New Journal Submission Received",
      html: `
        <h2>New Journal Submission</h2>
        <p><strong>Journal Name:</strong> ${journalName}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Submitted by:</strong> ${name}</p>
        <p><strong>User Email:</strong> ${email}</p>
        <p>Please review this submission.</p>
      `,
    };

    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(ccMailOptions);

    res.json({ success: true, message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ success: false, message: "Error sending email." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
