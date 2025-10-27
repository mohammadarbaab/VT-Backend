import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pollTranscript = async (transcriptId) => {
  while (true) {
    const res = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
      {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
      }
    );

    const transcript = res.data;

    if (transcript.status === "completed") return transcript;
    if (transcript.status === "error") throw new Error(transcript.error);

    console.log("⏳ Transcription in progress...");
    await new Promise((r) => setTimeout(r, 5000)); // wait 5 sec before next poll
  }
};

app.post("/transcribe", async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ error: "Video URL required" });
    }

    console.log("Transcribing from AssemblyAI:", videoUrl);
    console.log(
      "🔑 AssemblyAI Key:",
      process.env.ASSEMBLYAI_API_KEY ? " Found" : " Missing"
    );

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

    const transcript = await pollTranscript(transcriptId);

    res.json({ text: transcript.text });
  } catch (error) {
    console.error(
      "❌ Transcription Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to the VT-Backend API 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
