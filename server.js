require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);
console.log("FIREBASE_SERVICE_KEY:", process.env.FIREBASE_SERVICE_KEY);
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
        <p>We have received your journal submission. Your Submitted article forwarded to respective journal and they get back to you shortly.</p>
        <p> With Regards</p>
        <p>IJIN Team</p>
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
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>User Email:</strong> ${email}</p>
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

app.post("/contact", async (req, res) => {
  try {
    console.log("Received Contact Form Data:", req.body); 

    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    await db.collection("contact_forms").add({
      name,
      email,
      subject,
      message,
      createdAt: new Date(),
    });

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank You for Contacting Us!",
      html: `<p>Hi ${name}, we have received your message and will get back to you soon.</p>`,
    };

    const ccMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CC_EMAIL,
      subject: `New Contact Form Submission: ${subject}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`,
    };

    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(ccMailOptions);

    res.json({ success: true, message: "Contact form submitted successfully!" });

  } catch (error) {
    console.error("Error handling contact form:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});


app.post("/conferenceemail", async (req, res) => {
  try {
    const {
      title,
      organizer,
      venue,
      date,
      contactPerson,
      email,
      country,
      language,
      description
    } = req.body;

    if (!title || !organizer || !email) {
      return res.status(400).json({ 
        success: false, 
        message: "Required fields are missing." 
      });
    }

    // Save to database if needed (you already have this in your frontend)
    
    // Email to the user who submitted the form
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank You for Your Conference Submission",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">Thank You for Your Conference Submission</h2>
          <p>Dear ${contactPerson},</p>
          <p>We have received your conference/symposium submission for "${title}". Your submission has been forwarded to our IJIN team for review.</p>
          <p>We will get back to you shortly with further information.</p>
          <p>With Regards,</p>
          <p>The IJIN Team</p>
        </div>
      `,
    };

    // Email to the admin/CC with all form details
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CC_EMAIL,
      subject: `New Conference Submission: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333;">New Conference Submission</h2>
          <p>A new conference/symposium submission has been received:</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Conference Title</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Organizer</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${organizer}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Venue</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${venue}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Contact Person</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${contactPerson}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Country</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${country}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Language</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${language}</td>
            </tr>
          </table>
          <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 20px;">
            <strong>Description:</strong>
            <div>${description}</div>
          </div>
        </div>
      `,
    };

    // Send both emails
    await transporter.sendMail(userMailOptions);
    await transporter.sendMail(adminMailOptions);

    // Log the email sent in Firestore for record keeping
    await db.collection("email_logs").add({
      type: "conference_submission",
      userEmail: email,
      adminEmail: process.env.CC_EMAIL,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      success: true
    });

    res.json({ success: true, message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    
    // Log the error
    await db.collection("email_logs").add({
      type: "conference_submission",
      error: error.message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      success: false
    });
    
    res.status(500).json({ success: false, message: "Error sending email." });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
