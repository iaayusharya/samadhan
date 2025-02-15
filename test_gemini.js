require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyBFoF_yzIXpwOKiFGshoBuw29_cuzru7qU");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ ERROR: Missing Gemini API Key in .env file");
    process.exit(1);
}

async function testGemini() {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // ✅ Corrected request structure
        const result = await model.generateContent({
            contents: [{ parts: [{ text: "Say Hello" }] }]
        });

        console.log("✅ Gemini API Response:", result.response.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("❌ Error testing Gemini API:", error);
    }
}

testGemini();
