import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ✅ CORS Fix: allow localhost + Render frontend
app.use(cors({
  origin: [
    "http://localhost:3000", // local frontend
    "https://vt-project-du6f.onrender.com" // deployed frontend
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// 🎧 AssemblyAI Transcription Route
app.post("/transcribe", async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL required" });
    }

    console.log("🎬 Transcribing from AssemblyAI:", videoUrl);
    console.log("🔑 AssemblyAI Key:", process.env.ASSEMBLYAI_API_KEY ? "✅ Loaded" : "❌ Missing");

    // Step 1️⃣ Send video URL to AssemblyAI
    const response = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: videoUrl },
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    const transcriptId = response.data.id;

    // Step 2️⃣ Poll until transcription completes
    let transcript;
    while (true) {
      const pollRes = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
        }
      );
      transcript = pollRes.data;

      if (transcript.status === "completed") break;
      if (transcript.status === "error") throw new Error(transcript.error);

      console.log("⏳ Transcription in progress...");
      await new Promise((r) => setTimeout(r, 5000)); // wait 5 sec
    }

    // Step 3️⃣ Return transcript
    res.json({ text: transcript.text });

  } catch (error) {
    console.error("❌ Transcription Error:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error || "Transcription failed" });
  }
});

// 🌐 Default route (for testing)
app.get("/", (req, res) => {
  res.send("✅ VT-Backend is live and running!");
});

// 🚀 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
