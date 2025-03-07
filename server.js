require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!GEMINI_API_KEY || !MONGO_URI) {
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
    applicantName: { type: String, required: true },
    email: { type: String, required: true },
    issue: { type: String, required: true },
    department: { type: String, required: true },
    application: { type: String, required: true },
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

// ✅ API: Generate Application
app.post("/generate-application", async (req, res) => {
    try {
        const { applicantName, email, issue, department } = req.body;

        // Validate input
        if (!applicantName || !email || !issue || !department) {
            return res.status(400).json({ error: "Please provide all required fields." });
        }
        if (!email.endsWith("@svsu.ac.in")) {
            return res.status(400).json({ error: "Invalid email! Use an SVSU email (xyz@svsu.ac.in)" });
        }

        // Generate application using Google Generative AI
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are an AI assistant. Write a formal application to the ${department} department of 
            Shri Vishwakarma Skill University,
            Dudhola, Palwal,Haryana- 121102 regarding the following issue:
            
            **Issue:** ${issue}
            
            ### **Response Format:**
            Subject: [Write a clear subject line]
            
            Application:
            
            [Write the full professional application letter. Use a formal tone.]

            Ensure the letter is **well-structured**, **polite**, and **concise**.
        `;

        // Call AI API
        const result = await model.generateContent(prompt);
        let generatedText = result.response.text();

        // Remove unnecessary ** and * symbols
        generatedText = generatedText
    .replace(/\*\*/g, "") // Remove **
    .replace(/\*/g, "•"); // Replace * with • for bullet points

        // Extract subject and application text
        const subject = generatedText.split("\n")[0].replace("Subject:", "").trim();
        const application = generatedText.split("\n").slice(1).join("\n").trim();

        // Return response
        return res.json({
            subject,
            application
        });
    } catch (error) {
        console.error("❌ Error generating application:", error);
        return res.status(500).json({ error: "Server error while generating application." });
    }
});
// ✅ API: Submit Issue
app.post("/submit-issue", async (req, res) => {
    try {
        const { applicantName, email, issue, department, application, subject } = req.body;

        // Validate input
        if (!applicantName || !email || !issue || !department || !application || !subject) {
            return res.status(400).json({ error: "Please provide all required fields." });
        }

        // Define department-based email selection
        const departmentEmails = {
            "Administration": {
                to: ["vc@svsu.ac.in"], // Primary recipient(s)
                cc: ["dean.academics@svsu.ac.in", "registrar@svsu.ac.in", "vcoffice@svsu.ac.in"], // Carbon copy recipients
                bcc: ["vcsvsu.vikskitbharat@svsu.ac.in"] // Blind carbon copy recipients
            },
            "Examination": {
                to: ["exam@svsu.ac.in"],
                cc: ["grievanceexam@svsu.ac.in", "drexam@svsu.ac.in"], // Add CC emails here
                bcc: ["results@svsu.ac.in"] // Add BCC emails here
            },
            "Department of Students Welfare (DSW)": {
                to: ["dsw@svsu.ac.in"],
                cc: ["kulwant.singh@svsu.ac.in"], // Add CC emails here
                bcc: ["mohit.srivastav@svsu.ac.in"] // Add BCC emails here
            },
            "Library": {
                to: ["library@svsu.ac.in"],
                cc: ["jitendradubey@svsu.ac.in"], // Add CC emails here
                bcc: [""] // Add BCC emails here
            }
        };

        // Get recipient email(s) based on selected department
        const recipient = departmentEmails[department] || { to: ["info@svsu.ac.in"] };
        const recipientEmails = recipient.to.join(","); // Join multiple "to" emails with a comma

        // Save the issue to the database
        const newIssue = new Issue({ applicantName, email, issue, department, subject, application });
        await newIssue.save();

        // Construct mailto URL (for mobile)
        let mailtoURL = `mailto:${recipientEmails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(application)}`;

        // Add CC and BCC for the department
        if (recipient.cc && recipient.cc.length > 0) {
            mailtoURL += `&cc=${recipient.cc.join(",")}`;
        }
        if (recipient.bcc && recipient.bcc.length > 0) {
            mailtoURL += `&bcc=${recipient.bcc.join(",")}`;
        }

        // Construct Gmail URL (for desktop)
        let gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmails}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(application)}`;

        // Add CC and BCC for the department
        if (recipient.cc && recipient.cc.length > 0) {
            gmailURL += `&cc=${recipient.cc.join(",")}`;
        }
        if (recipient.bcc && recipient.bcc.length > 0) {
            gmailURL += `&bcc=${recipient.bcc.join(",")}`;
        }

        // Return response with both URLs
        return res.json({
            message: "Issue submitted successfully!",
            mailtoURL,
            gmailURL
        });
    } catch (error) {
        console.error("❌ Error submitting issue:", error);
        return res.status(500).json({ error: "Failed to submit issue. Please try again." });
    }
});
// ✅ API: Get Frequent Issues
app.get("/issues", async (req, res) => {
    try {
        const issues = await Issue.find({}, "applicantName email issue department application -_id").limit(10).sort({ _id: -1 });
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
