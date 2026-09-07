const API = "https://api.json2video.com/v2";

function esc(s) {
  return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
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
          html: `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#080b12,#202a63);font-family:Arial,sans-serif;color:white;text-align:center;padding:80px;box-sizing:border-box"><div><div style="font-size:34px;opacity:.7;margin-bottom:30px">VIDEO GEN</div><div style="font-size:64px;font-weight:700;line-height:1.12">${esc(prompt)}</div></div></div>`
        },
        { type: "voice", text: prompt, voice: "en-US-EmmaMultilingualNeural", model: "azure", duration: -1 }
      ]
    }]
  };
}

async function j2v(path, options = {}, env) {
  const r = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "x-api-key": env.JSON2VIDEO_API_KEY,
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

const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>VideoGen Chat</title><style>*{box-sizing:border-box}body{margin:0;background:#0b0d12;color:#f5f7fb;font-family:Arial,sans-serif}.app{max-width:900px;height:100vh;margin:auto;display:flex;flex-direction:column;padding:24px}header{display:flex;gap:14px;align-items:center;border-bottom:1px solid #262a34;padding-bottom:18px}.logo{font-size:35px}h1{margin:0;font-size:24px}header p{margin:4px 0 0;color:#9da5b5}main{flex:1;overflow:auto;padding:25px 4px}.welcome{text-align:center;margin:20vh auto 0;color:#aab2c1}.welcome h2{color:white;font-size:30px}.msg{margin:16px 0;padding:15px 17px;border-radius:16px;max-width:78%;line-height:1.5;white-space:pre-wrap}.user{margin-left:auto;background:#315efb}.bot{background:#181c25}.error{background:#421d24;color:#ffb9c0}.video{width:100%;max-width:700px;border-radius:14px;margin-top:12px;background:#000}a.download{display:inline-block;margin-top:10px;color:#fff;text-decoration:none;background:#315efb;padding:9px 13px;border-radius:9px}form{display:flex;gap:10px;background:#151922;border:1px solid #2a2f3b;padding:10px;border-radius:16px}textarea{flex:1;resize:none;background:transparent;border:0;outline:0;color:white;font-size:16px;padding:10px}button{border:0;border-radius:11px;background:#315efb;color:#fff;font-weight:700;padding:0 18px;cursor:pointer}button:disabled{opacity:.5;cursor:not-allowed}@media(max-width:650px){.app{padding:12px}.msg{max-width:90%}form{flex-direction:column}button{height:46px}}</style></head><body><div class="app"><header><div class="logo">🎬</div><div><h1>VideoGen Chat</h1><p>Describe it. JSON2Video renders it.</p></div></header><main id="chat"><div class="welcome"><h2>What do you want to create?</h2><p>Try: <b>“A cinematic basketball game winner in a packed stadium, with dramatic commentary.”</b></p></div></main><form id="form"><textarea id="prompt" placeholder="Describe your video..." rows="2"></textarea><button id="send" type="submit">Generate 🎬</button></form></div><script>
const form=document.querySelector("#form"),prompt=document.querySelector("#prompt"),chat=document.querySelector("#chat"),send=document.querySelector("#send");
function add(text,cls="bot"){const d=document.createElement("div");d.className=`msg ${cls}`;d.textContent=text;chat.appendChild(d);chat.scrollTop=chat.scrollHeight;return d}
function addResult(data){const box=document.createElement("div");box.className="msg bot";const url=findVideoUrl(data);if(url){box.innerHTML=`Video generated!<video class="video" controls src="${escapeAttr(url)}"></video><br><a class="download" href="${escapeAttr(url)}" download>Download video</a>`}else{box.textContent="The API responded, but no video URL was found."}chat.appendChild(box);chat.scrollTop=chat.scrollHeight}
function findVideoUrl(x){if(!x||typeof x!=="object")return null;for(const k of ["video_url","videoUrl","url","download_url","downloadUrl"])if(typeof x[k]==="string"&&x[k].match(/^https?:/))return x[k];if(x.movie&&typeof x.movie==="object")return findVideoUrl(x.movie);if(x.data&&typeof x.data==="object")return findVideoUrl(x.data);return null}
function escapeAttr(s){return String(s).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
async function poll(project,loading){for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,5000));const r=await fetch(`/api/status?project=${encodeURIComponent(project)}`);const d=await r.json();if(!r.ok)throw new Error(d.error||"Render failed");if(d.status==="done")return d;if(["error","timeout"].includes(d.status))throw new Error(d.error||`Render ${d.status}`);loading.textContent=`🎬 Rendering... ${Math.min(99,Math.round((i+1)/120*100))}%`;}throw new Error("The render is taking longer than expected.")}
form.addEventListener("submit",async e=>{e.preventDefault();const text=prompt.value.trim();if(!text)return;add(text,"user");prompt.value="";send.disabled=true;send.textContent="Generating...";const loading=add("🎬 Starting your video...");try{const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:text})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Something went wrong.");const done=await poll(data.project,loading);loading.remove();addResult(done)}catch(err){loading.className="msg error";loading.textContent=err.message||"Something went wrong."}finally{send.disabled=false;send.textContent="Generate 🎬";prompt.focus()}});
</script></body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/") return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });
      if (request.method === "POST" && url.pathname === "/api/generate") {
        const body = await request.json();
        const prompt = String(body?.prompt || "").trim();
        if (!prompt) return Response.json({ error: "Enter a video prompt." }, { status: 400 });
        if (!env.JSON2VIDEO_API_KEY) return Response.json({ error: "JSON2Video API key is not configured in Cloudflare." }, { status: 500 });
        const created = await j2v("/movies", { method: "POST", body: JSON.stringify(movieFromPrompt(prompt)) }, env);
        if (!created.project) return Response.json({ error: "JSON2Video did not return a project ID.", details: created }, { status: 502 });
        return Response.json({ project: created.project, status: "queued" });
      }
      if (request.method === "GET" && url.pathname === "/api/status") {
        const project = url.searchParams.get("project");
        if (!project) return Response.json({ error: "Missing project." }, { status: 400 });
        const status = await j2v(`/movies?project=${encodeURIComponent(project)}`, {}, env);
        const movie = status.movie || {};
        if (movie.status === "done") return Response.json({ project, status: "done", url: movie.url });
        if (["error", "timeout"].includes(movie.status)) return Response.json({ project, status: movie.status, error: movie.message || `Render ${movie.status}` }, { status: 502 });
        return Response.json({ project, status: movie.status || "processing" });
      }
      return new Response("Not found", { status: 404 });
    } catch (e) {
      return Response.json({ error: e?.message || "Server error" }, { status: 500 });
    }
  }
};
