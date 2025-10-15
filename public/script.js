import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MODEL = "gemini-1.5-flash";
const GOOGLE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

app.post("/api/gemini", async (req, res) => {
  try {
    const resp = await fetch(`${GOOGLE_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (e) {
    res.status(500).json({ error: { message: e.message } });
  }
});

const port = process.env.PORT || 5174;
app.listen(port, () => console.log(`Proxy running on ${port}`));
