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
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// Define Schema & Model
const issueSchema = new mongoose.Schema({
    email: { type: String, required: true },
    subject: { type: String, required: true },
    issue: { type: String, required: true },
    department: { type: String, required: true },
});

const Issue = mongoose.model("Issue", issueSchema);

// ✅ API: Get Administration Issues
app.get("/admin-issues", (req, res) => {
    try {
        const adminIssues = [
            "Student Involvement in ICC: Students should be elected and involved in decision-making.",
            "Student Voting in Grievance Committee: Student participation should be done via voting.",
            "Departmental Grievance Committees: Not renewed since 2019.",
            "Inactive Clubs/Societies: DSW should assign posts and make details public.",
            "Student Gatherings: Security should allow students to meet freely."
        ];
        res.json(adminIssues);
    } catch (error) {
        console.error("❌ Error fetching admin issues:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ API: Get Infrastructure Issues
app.get("/infra-issues", (req, res) => {
    try {
        const infraIssues = [
            "WiFi and Network Issue: Library needs better WiFi connectivity.",
            "Poor Outdoor Sports Facilities: Need indoor sports like Chess, Carrom, Table Tennis, etc.",
            "Need One Sports Period: Sports should be part of the academic schedule.",
            "WiFi for Large Classes: More than 65 students need a high-speed WiFi limit.",
            "Campus Beautification: Improve the campus environment."
        ];
        res.json(infraIssues);
    } catch (error) {
        console.error("❌ Error fetching infra issues:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ✅ Email Validation Function
const validateEmail = (email) => {
    return typeof email === "string" && email.endsWith("@svsu.ac.in");
};
//API to Generate Application
app.post("/generate-application", async (req, res) => {
    try {
        const { email, issue, department } = req.body;

        if (!email || !issue || !department) {
            return res.status(400).json({ error: "Please provide email, issue, and department." });
        }
        if (!email.endsWith("@svsu.ac.in")) {
            return res.status(400).json({ error: "Invalid email! Use an SVSU email (xyz@svsu.ac.in)" });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            You are an AI assistant. Write a formal application to the ${department} department of 
            Shri Vishwakarma Skill University regarding the following issue:
            
            **Issue:** ${issue}
            
            ### **Response Format:**
            Subject: [Write a clear subject line]
            
            Application:
            
            [Write the full professional application letter. Use a formal tone.]

            Ensure the letter is **well-structured**, **polite**, and **concise**.
        `;

        const result = await model.generateContent({ contents: [{ parts: [{ text: prompt }] }] });

        if (!result || !result.response || !result.response.candidates) {
            return res.status(500).json({ error: "Failed to generate application. Try again." });
        }

        const generatedText = result.response.candidates[0]?.content?.parts?.[0]?.text || "";

        console.log("📜 AI Raw Response:", generatedText);

        // ✅ Normalize AI response (remove extra symbols like **, :, etc.)
        const cleanedText = generatedText.replace(/\*\*/g, "").trim();
        const lines = cleanedText.split("\n").map(line => line.trim());

        // ✅ Extract Subject
        let subject = lines.find(line => line.toLowerCase().startsWith("subject"));
        if (subject) {
            subject = subject.replace(/subject[:\s]*/i, "").trim();
        } else {
            subject = "Application Regarding Issue"; // Fallback if AI response is incorrect
        }

        // ✅ Extract Application Text
        let applicationStartIndex = lines.findIndex(line => line.toLowerCase().includes("application"));
        let application = applicationStartIndex !== -1
            ? lines.slice(applicationStartIndex + 1).join("\n").trim()
            : lines.slice(1).join("\n").trim(); // Fallback

        if (!subject || !application) {
            console.error("❌ AI response format issue. Received:", generatedText);
            return res.status(500).json({ error: "AI response format invalid. Try again later." });
        }

        // ✅ Save to Database
        const newIssue = new Issue({ email, subject, issue, department });
        await newIssue.save();

        res.json({ subject, application });

    } catch (error) {
        console.error("❌ Error generating application:", error);
        res.status(500).json({ error: "Server error while generating application." });
    }
});


// ✅ API: Get Frequent Issues
app.get("/issues", async (req, res) => {
    try {
        const issues = await Issue.find({}, "subject -_id").limit(10).sort({ _id: -1 });
        res.json(issues);
    } catch (error) {
        console.error("❌ Error fetching issues:", error);
        res.status(500).json({ error: "Failed to fetch issues." });
    }
});

// ✅ 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
