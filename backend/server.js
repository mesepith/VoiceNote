require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const { exec } = require("child_process");

const app = express();
const port = 5019;

// Middleware
app.use(bodyParser.json());

// Multer configuration for file uploads
const upload = multer({ dest: "uploads/" });

// Endpoint to handle audio upload
app.post("/upload", upload.single("audio"), async (req, res) => {
    try {
      const inputPath = req.file.path;
      const outputPath = `${req.file.path}.wav`;
  
      // Convert the audio file to LINEAR16 with 16000 Hz sample rate
      const ffmpegCommand = `ffmpeg -i ${inputPath} -ar 16000 -ac 1 -f wav ${outputPath}`;
      exec(ffmpegCommand, async (error, stdout, stderr) => {
        if (error) {
          console.error("Error during audio conversion:", stderr);
          return res.status(500).json({ error: "Error converting audio file" });
        }
  
        // Read the converted audio file
        const audioFile = fs.readFileSync(outputPath);
        const audioBytes = audioFile.toString("base64");
  
        // Google Speech-to-Text API request payload
        const requestPayload = {
          config: {
            encoding: "LINEAR16",
            sampleRateHertz: 16000,
            languageCode: "en-US",
          },
          audio: {
            content: audioBytes,
          },
        };
  
        // Send the audio to Google Speech-to-Text API
        try {
          const response = await axios.post(
            `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_API_KEY}`,
            requestPayload,
            { headers: { "Content-Type": "application/json" } }
          );
  
          // Extract transcription from the API response
          const transcription = response.data.results
            .map((result) => result.alternatives[0].transcript)
            .join("\n");
          
            console.log('transcription : ', transcription);
  
          // Cleanup temporary files
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
  
          // Respond with transcription
          res.json({ transcription });
        } catch (apiError) {
          console.error("Error during transcription:", apiError.response?.data || apiError.message);
          res.status(500).json({ error: "Error during transcription" });
        }
      });
    } catch (error) {
      console.error("Error processing request::", error);
      res.status(500).json({ error: "Error processing audio file" });
    }
  });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
