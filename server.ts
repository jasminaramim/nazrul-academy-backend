import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import routes from './routes/index';
import { connectDB } from './config/dbConfig';

// Load env - works both locally and on Vercel (via Vercel env vars)
dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

const app = express();

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // allow all for now, tighten later
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API Routes
app.use('/api', routes);

// Root - Beautiful API landing page
app.get('/', (_req, res) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  res.send(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nazrul Academy API</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #e2e8f0;
    }
    .container { max-width: 700px; width: 100%; text-align: center; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #4ade80;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2rem;
      letter-spacing: 0.05em;
    }
    .dot {
      width: 8px; height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .logo { font-size: 3.5rem; margin-bottom: 0.5rem; }
    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(90deg, #818cf8, #c084fc, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    .subtitle { color: #94a3b8; font-size: 1rem; margin-bottom: 3rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 1.5rem 1rem;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover { transform: translateY(-3px); border-color: rgba(129,140,248,0.4); }
    .card-icon { font-size: 1.8rem; margin-bottom: 0.5rem; }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; }
    .card-value { font-size: 1.1rem; font-weight: 700; color: #e2e8f0; }
    .endpoints {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: left;
      margin-bottom: 2rem;
    }
    .endpoints h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 1rem; }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 14px;
    }
    .endpoint:last-child { border-bottom: none; }
    .method {
      background: rgba(129, 140, 248, 0.2);
      color: #818cf8;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      min-width: 48px;
      text-align: center;
    }
    .method.post { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .path { color: #cbd5e1; font-family: monospace; }
    .desc { color: #64748b; margin-left: auto; font-size: 12px; }
    .footer { color: #475569; font-size: 13px; }
    .footer span { color: #818cf8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge"><div class="dot"></div>API ONLINE</div>
    <div class="logo">🏫</div>
    <h1>Nazrul Academy API</h1>
    <p class="subtitle">ত্রিশাল সরকারি নজরুল একাডেমি — Backend REST API Server</p>
    <div class="grid">
      <div class="card">
        <div class="card-icon">⚡</div>
        <div class="card-label">Status</div>
        <div class="card-value" style="color:#4ade80">Running</div>
      </div>
      <div class="card">
        <div class="card-icon">🕐</div>
        <div class="card-label">Uptime</div>
        <div class="card-value">${hours}h ${minutes}m ${seconds}s</div>
      </div>
      <div class="card">
        <div class="card-icon">🔄</div>
        <div class="card-label">Version</div>
        <div class="card-value">v1.0.0</div>
      </div>
      <div class="card">
        <div class="card-icon">📡</div>
        <div class="card-label">Base URL</div>
        <div class="card-value" style="font-size:0.85rem">/api</div>
      </div>
    </div>
    <div class="endpoints">
      <h3>📋 Available Endpoints</h3>
      <div class="endpoint"><span class="method">GET</span><span class="path">/api/hero</span><span class="desc">Hero Slides</span></div>
      <div class="endpoint"><span class="method">GET</span><span class="path">/api/teachers</span><span class="desc">Teachers</span></div>
      <div class="endpoint"><span class="method">GET</span><span class="path">/api/students</span><span class="desc">Students</span></div>
      <div class="endpoint"><span class="method">GET</span><span class="path">/api/notices</span><span class="desc">Notices</span></div>
      <div class="endpoint"><span class="method">GET</span><span class="path">/api/gallery</span><span class="desc">Gallery</span></div>
      <div class="endpoint"><span class="method">GET</span><span class="path">/api/schedule</span><span class="desc">Schedule</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/api/auth/login</span><span class="desc">Admin Login</span></div>
      <div class="endpoint"><span class="method">GET</span><span class="path">/health</span><span class="desc">Health JSON</span></div>
    </div>
    <p class="footer">Built with ❤️ for <span>Trishal Nazrul Academy</span> • ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`);
});

// Health check (JSON)
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Backend is running!', timestamp: new Date().toISOString() });
});

// DB connection cache for Vercel serverless warm invocations
let isDbConnected = false;

// Vercel Serverless handler - this is what Vercel calls
export default async function handler(req: any, res: any) {
  if (!isDbConnected) {
    const result = await connectDB();
    if (result.success) isDbConnected = true;
  }
  return app(req, res);
}

// Local development only
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Backend server running: http://localhost:${PORT}`);
      console.log(`✅ API available at: http://localhost:${PORT}/api`);
    });
  }).catch(console.error);
}
