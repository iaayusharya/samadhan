require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!GEMINI_API_KEY || !MONGO_URI || !EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ ERROR: Missing environment variables. Check your .env file.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define Schema & Model
const issueSchema = new mongoose.Schema({
    email: { type: String, required: true },
    subject: { type: String, required: true }, // Store only Subject
    issue: { type: String, required: true },
    department: { type: String, required: true },
});

const Issue = mongoose.model("Issue", issueSchema);

// ✅ API to submit an issue
app.post("/submit-issue", async (req, res) => {
    try {
        const { email, issue, department } = req.body;

        // Validate Email
        if (!email.endsWith("@svsu.ac.in")) {
            return res.status(400).json({ error: "Invalid email! Use an SVSU email (xyz@svsu.ac.in)" });
        }

        // Generate Subject & Application using Gemini
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Write a formal application to the ${department} department regarding the following issue:
        
        Issue: ${issue}

        Format it professionally with an appropriate subject line. Return the subject and application separately.`;

        const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] });

        if (!result.response || !result.response.candidates) {
            return res.status(500).json({ error: "Failed to generate application. Try again." });
        }

        const generatedText = result.response.candidates[0].content.parts[0].text;

        // Extract Subject and Application Body
        const subjectMatch = generatedText.match(/Subject:\s*(.+)/i);
        const applicationMatch = generatedText.match(/Dear.+/s);

        if (!subjectMatch || !applicationMatch) {
            return res.status(500).json({ error: "Failed to generate structured application." });
        }

        const subject = subjectMatch[1].trim();
        let application = applicationMatch[0].trim();

        // Ensure "Shri Vishwakarma Skill University" is included
        if (!application.includes("Shri Vishwakarma Skill University")) {
            application = application.replace(/Dear .+\n/, `Dear [Recipient's Name],\n\nI am writing to the ${department} department of Shri Vishwakarma Skill University regarding the following issue:\n\n${issue}\n\nThank you for your attention to this matter.\n\nSincerely,\n[Your Name]`);
        }

        // Save only Subject & Issue in DB
        const newIssue = new Issue({ email, subject, issue, department });
        await newIssue.save();

        res.json({ message: "Issue submitted successfully!", subject, application });
    } catch (error) {
        console.error("❌ Error submitting issue:", error);
        res.status(500).json({ error: "Server error while submitting the issue." });
    }
});

// ✅ API to get frequent issues (only Subject)
app.get("/issues", async (req, res) => {
    try {
        const issues = await Issue.find({}, "subject").limit(10).sort({ _id: -1 });
        res.json(issues);
    } catch (error) {
        console.error("❌ Error fetching issues:", error);
        res.status(500).json({ error: "Failed to fetch issues." });
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
