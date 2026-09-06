import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json({limit:"1mb"}));
app.use(express.static("public"));

const API = "https://api.json2video.com/v2";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function j2v(path, options={}) {
  const r = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "x-api-key": process.env.JSON2VIDEO_API_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!r.ok) throw new Error(data?.message || data?.error || `JSON2Video HTTP ${r.status}`);
  return data;
}

function movieFromPrompt(prompt) {
  return {
    resolution: "full-hd",
    quality: "high",
    scenes: [{
      duration: 8,
      elements: [
        {
          type: "html",
          duration: 8,
          html: `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#080b12,#1c2450);font-family:Arial,sans-serif;color:white;text-align:center;padding:80px;box-sizing:border-box"><div><div style="font-size:34px;opacity:.75;margin-bottom:30px">VIDEO GEN</div><div style="font-size:64px;font-weight:700;line-height:1.12">${escapeHtml(prompt)}</div></div></div>`
        },
        {
          type: "voice",
          text: prompt,
          voice: "en-US-EmmaMultilingualNeural",
          model: "azure",
          duration: -1
        }
      ]
    }]
  };
}

function escapeHtml(s) {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

app.post("/api/generate", async (req,res)=>{
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({error:"Enter a video prompt."});
    if (!process.env.JSON2VIDEO_API_KEY || process.env.JSON2VIDEO_API_KEY === "PASTE_YOUR_KEY_HERE") {
      return res.status(500).json({error:"Your JSON2Video API key is not configured in .env."});
    }

    const created = await j2v("/movies", {method:"POST", body:JSON.stringify(movieFromPrompt(prompt))});
    const project = created.project;
    if (!project) return res.status(502).json({error:"JSON2Video did not return a project ID.", details:created});

    for (let i=0; i<120; i++) {
      await sleep(5000);
      const status = await j2v(`/movies?project=${encodeURIComponent(project)}`);
      const movie = status.movie || {};
      if (movie.status === "done") return res.json({project, status:"done", url:movie.url, movie});
      if (["error","timeout"].includes(movie.status)) return res.status(502).json({error:movie.message || `Render ${movie.status}.`, project, movie});
    }
    res.status(504).json({error:"The render is taking longer than this server waits.",project});
  } catch (err) {
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`VideoGen Chat running at http://localhost:${port}`));
