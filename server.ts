import express, { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './server/api.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust reverse proxies (Hostinger VPS Nginx/LiteSpeed, Cloudflare, Cloud Run)
app.set('trust proxy', 1);

// Optional CORS support when frontend & API sit on separate subdomains/origins
const allowedOrigins = new Set(
  [process.env.APP_URL, ...(process.env.CORS_ORIGINS || '').split(',')]
    .map((v) => v?.trim().replace(/\/$/, ''))
    .filter((v): v is string => Boolean(v && v !== 'MY_APP_URL'))
);

app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, '');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// API routes
app.use('/api', apiRouter);
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Serve static assets in production (index: false so / and SPA routes inject dynamic canonical & OG URLs)
const distPath = path.join(__dirname, 'dist');
const distIndexPath = path.join(distPath, 'index.html');
let cachedIndexHtml: string | null = null;

function resolvePublicOrigin(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && configured !== 'MY_APP_URL') {
    return configured.replace(/\/$/, '');
  }
  const forwardedHost = (req.headers['x-forwarded-host'] as string)?.split(',')[0]?.trim();
  const host = forwardedHost || req.get('host');
  if (!host) return 'http://localhost:3000';
  const forwardedProto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0]?.trim();
  const proto = forwardedProto || req.protocol || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`.replace(/\/$/, '');
}

// Serve /.well-known/assetlinks.json dynamically from env vars if provided (Google Play App Signing SHA-256)
app.get('/.well-known/assetlinks.json', (req, res, next) => {
  const rawFingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawFingerprints.length > 0) {
    const packageName =
      process.env.ANDROID_PACKAGE_NAME?.trim() ||
      process.env.VITE_ANDROID_PACKAGE_NAME?.trim() ||
      'app.purposetalk.twa';

    return res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: rawFingerprints,
        },
      },
    ]);
  }
  return next();
});

// Explicitly expose .well-known for Google Play TWA Digital Asset Links without exposing other dotfiles
app.use('/.well-known', express.static(path.join(distPath, '.well-known')));
app.use(express.static(distPath, { index: false }));

// Fallback to index.html for SPA with dynamic canonical/OpenGraph URL resolution
app.get('*', (req, res) => {
  try {
    if (!cachedIndexHtml) {
      cachedIndexHtml = fs.readFileSync(distIndexPath, 'utf8');
    }
    const appOrigin = resolvePublicOrigin(req);
    const cleanPath = req.path === '/' ? '/' : req.path;
    const canonicalUrl = `${appOrigin}${cleanPath}`;
    const ogImageUrl = `${appOrigin}/og-cover.jpg`;
    const html = cachedIndexHtml
      .replace(/__APP_ORIGIN__/g, appOrigin)
      .replace(/__CANONICAL_URL__/g, canonicalUrl)
      .replace(/__OG_IMAGE_URL__/g, ogImageUrl)
      .replace(/https:\/\/www\.purposetalk\.site\/og-cover\.jpg/g, ogImageUrl)
      .replace(/https:\/\/www\.purposetalk\.site\//g, canonicalUrl)
      .replace(/https:\/\/www\.purposetalk\.site/g, appOrigin);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch {
    res.sendFile(distIndexPath);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Faith & Tech English Mentor server running on port ${PORT}`);
});
