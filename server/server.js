const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MAX_BODY_BYTES = parseInt(process.env.MAX_BODY_BYTES || `${1024 * 1024}`, 10);
const API_TOKEN = process.env.API_TOKEN || '';
const REQUIRE_API_AUTH =
  process.env.REQUIRE_API_AUTH === '1' ||
  (process.env.REQUIRE_API_AUTH !== '0' && API_TOKEN.length > 0);

const CONFIG = {
  port: parseInt(process.env.PORT || '8888', 10),
  dataPath: path.resolve(ROOT_DIR, process.env.DATA_DIR || './data'),
  publicPath: path.resolve(ROOT_DIR, process.env.PUBLIC_DIR || './web')
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(CONFIG.dataPath);

function readBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        const err = new Error(`payload too large (>${maxBytes} bytes)`);
        err.code = 'PAYLOAD_TOO_LARGE';
        req.destroy(err);
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getRequestToken(req, urlObj) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  return urlObj.searchParams.get('token') || '';
}

function requireApiAuth(req, res, urlObj) {
  if (!REQUIRE_API_AUTH) return true;
  if (!API_TOKEN) {
    sendJSON(res, 500, { error: 'server misconfigured: API_TOKEN missing' });
    return false;
  }
  const token = getRequestToken(req, urlObj);
  if (token !== API_TOKEN) {
    sendJSON(res, 401, { error: 'unauthorized' });
    return false;
  }
  return true;
}

function resolvePublicFile(publicRoot, requestPath) {
  let decodedPath = requestPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  const normalized = path.posix.normalize(decodedPath);
  const relativePath = normalized.replace(/^\/+/, '');
  const absolutePath = path.resolve(publicRoot, relativePath);
  const allowedPrefix = `${publicRoot}${path.sep}`;
  if (absolutePath !== publicRoot && !absolutePath.startsWith(allowedPrefix)) {
    return null;
  }
  return absolutePath;
}

function readJSONIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date || ''));
}

function sanitizeTimeline(timeline) {
  if (!Array.isArray(timeline)) return [];
  return timeline
    .map((item) => ({
      time: String(item.time || '').trim() || '未标注',
      text: String(item.text || '').trim(),
      tag: item.tag ? String(item.tag).trim() : null,
      supplement: Boolean(item.supplement)
    }))
    .filter(item => item.text.length > 0);
}

function getDiaryPaths(date) {
  const diaryRoot = path.join(CONFIG.dataPath, 'diary');
  ensureDir(diaryRoot);

  const [year, month] = date.split('-');
  const dateDir = path.join(diaryRoot, year, month);
  ensureDir(dateDir);

  const prefix = path.join(dateDir, date);
  return {
    diaryRoot,
    dateDir,
    sourcePath: `${prefix}_source.txt`,
    parsedPath: `${prefix}_parsed.json`,
    timelinePath: `${prefix}_timeline.json`,
    recordPath: `${prefix}_record.json`,
    legacyPath: path.join(diaryRoot, `${date}.json`)
  };
}

function loadRecordByDate(date) {
  const paths = getDiaryPaths(date);
  const record = readJSONIfExists(paths.recordPath);
  if (record) return { record, paths };

  const legacy = readJSONIfExists(paths.legacyPath);
  if (legacy) return { record: legacy, paths };

  return { record: null, paths };
}

function listAllDates() {
  const diaryRoot = path.join(CONFIG.dataPath, 'diary');
  ensureDir(diaryRoot);

  const dates = new Set();

  const rootFiles = fs.readdirSync(diaryRoot, { withFileTypes: true });
  rootFiles.forEach((entry) => {
    if (entry.isFile() && /^\d{4}-\d{2}-\d{2}\.json$/.test(entry.name)) {
      dates.add(entry.name.replace('.json', ''));
    }
  });

  rootFiles.forEach((yearEntry) => {
    if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) return;
    const yearDir = path.join(diaryRoot, yearEntry.name);
    const monthEntries = fs.readdirSync(yearDir, { withFileTypes: true });

    monthEntries.forEach((monthEntry) => {
      if (!monthEntry.isDirectory() || !/^\d{2}$/.test(monthEntry.name)) return;
      const monthDir = path.join(yearDir, monthEntry.name);
      const files = fs.readdirSync(monthDir, { withFileTypes: true });

      files.forEach((fileEntry) => {
        if (!fileEntry.isFile()) return;
        const m = fileEntry.name.match(/^(\d{4}-\d{2}-\d{2})_(?:record|timeline|parsed|source)\.(?:json|txt)$/);
        if (m) dates.add(m[1]);
      });
    });
  });

  return [...dates].sort().reverse();
}

const CATEGORIES = [
  { key: 'work', label: '核心工作', patterns: [/工作/, /开发/, /写代码/, /编程/, /会议/, /开会/, /项目/, /任务/, /debug/, /调试/i] },
  { key: 'learn', label: '个人发展', patterns: [/学习/, /阅读/, /读书/, /练习/, /研究/, /复习/, /课/, /培训/] },
  { key: 'life', label: '生活管理', patterns: [/吃饭/, /做饭/, /购物/, /家务/, /通勤/, /出行/, /洗澡/, /洗漱/, /午休/, /起床/] },
  { key: 'social', label: '社交娱乐', patterns: [/聊天/, /朋友/, /聚餐/, /娱乐/, /游戏/, /电影/, /逛/] },
  { key: 'rest', label: '休息', patterns: [/睡/, /休息/, /冥想/, /午睡/, /小憩/] },
  { key: 'drain', label: '消耗', patterns: [/刷手机/, /刷视频/, /发呆/, /摸鱼/, /无聊/] }
];

function classifyText(text) {
  const value = String(text || '');
  for (const cat of CATEGORIES) {
    if (cat.patterns.some(p => p.test(value))) return cat.key;
  }
  return 'other';
}

function parseTimeStart(timeLabel) {
  const base = String(timeLabel || '').split('–')[0].split('-')[0].trim();
  const m = base.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function parseTimeEnd(timeLabel) {
  const parts = String(timeLabel || '').split(/[–-]/);
  if (parts.length < 2) {
    const start = parseTimeStart(timeLabel);
    return start;
  }
  const tail = parts[1].trim();
  const m = tail.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return parseTimeStart(timeLabel);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return parseTimeStart(timeLabel);
  return h * 60 + min;
}

function buildReport(data) {
  const timeline = Array.isArray(data.timeline) ? data.timeline : [];
  const totals = {};
  CATEGORIES.forEach(c => { totals[c.key] = 0; });

  const rows = timeline.map((item, idx) => ({
    ...item,
    idx,
    startMin: parseTimeStart(item.time),
    endMin: parseTimeEnd(item.time)
  }));

  rows.forEach((cur, i) => {
    if (cur.startMin === null) return;

    let durationMin = 0;
    if (/[–-]/.test(String(cur.time || '')) && cur.endMin !== null && cur.endMin > cur.startMin) {
      durationMin = cur.endMin - cur.startMin;
    } else if (i < rows.length - 1 && rows[i + 1].startMin !== null) {
      const nextStart = rows[i + 1].startMin;
      if (nextStart > cur.startMin) durationMin = nextStart - cur.startMin;
    }

    if (durationMin > 0) {
      const key = classifyText(cur.text);
      totals[key] = (totals[key] || 0) + durationMin;
    }
  });

  return {
    ...data,
    categoryTotals: totals
  };
}

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain'
};

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/health') {
    sendJSON(res, 200, {
      status: 'ok',
      port: CONFIG.port,
      dataPath: CONFIG.dataPath,
      publicPath: CONFIG.publicPath,
      authRequired: REQUIRE_API_AUTH
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/submit') {
    if (!requireApiAuth(req, res, urlObj)) return;

    try {
      const body = await readBody(req);
      if (!isValidDate(body.date)) throw new Error('invalid date (expected YYYY-MM-DD)');

      const nowISO = new Date().toISOString();
      const paths = getDiaryPaths(body.date);
      const incomingRawText = String(body.raw?.text || '').trim();
      const incomingTimeline = sanitizeTimeline(body.timeline);
      const incomingParsed = body.parsed && typeof body.parsed === 'object' ? body.parsed : null;

      if (!incomingRawText && incomingTimeline.length === 0) {
        throw new Error('empty payload: raw.text and timeline are both empty');
      }

      const existing = readJSONIfExists(paths.recordPath) || readJSONIfExists(paths.legacyPath) || {};

      const record = {
        date: body.date,
        mood: body.mood ?? existing.mood ?? null,
        insight: body.insight ?? existing.insight ?? '',
        tomorrow: body.tomorrow ?? existing.tomorrow ?? '',
        timeline: incomingTimeline.length > 0 ? incomingTimeline : sanitizeTimeline(existing.timeline),
        createdAt: existing.createdAt || nowISO,
        updatedAt: nowISO,
        files: {
          source: paths.sourcePath,
          parsed: paths.parsedPath,
          timeline: paths.timelinePath,
          record: paths.recordPath
        }
      };

      if (incomingRawText) {
        fs.writeFileSync(paths.sourcePath, `${incomingRawText}\n`);
      } else if (!fs.existsSync(paths.sourcePath) && typeof existing.rawText === 'string' && existing.rawText.trim()) {
        fs.writeFileSync(paths.sourcePath, `${existing.rawText.trim()}\n`);
      }

      const parsedPayload = incomingParsed || readJSONIfExists(paths.parsedPath) || {};
      fs.writeFileSync(
        paths.parsedPath,
        JSON.stringify(
          {
            ...parsedPayload,
            date: body.date,
            savedAt: nowISO
          },
          null,
          2
        )
      );

      fs.writeFileSync(paths.timelinePath, JSON.stringify(record.timeline, null, 2));
      fs.writeFileSync(paths.recordPath, JSON.stringify(record, null, 2));

      const legacyRecord = {
        date: record.date,
        timeline: record.timeline,
        mood: record.mood,
        insight: record.insight,
        tomorrow: record.tomorrow,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
      fs.writeFileSync(paths.legacyPath, JSON.stringify(legacyRecord, null, 2));

      console.log(`📝 [${body.date}] saved raw/parsed/timeline (${record.timeline.length} timeline items)`);
      sendJSON(res, 200, {
        success: true,
        date: body.date,
        files: {
          source: paths.sourcePath,
          parsed: paths.parsedPath,
          timeline: paths.timelinePath,
          record: paths.recordPath
        }
      });
    } catch (e) {
      console.error('submit error:', e.message);
      if (e.code === 'PAYLOAD_TOO_LARGE') {
        sendJSON(res, 413, { error: e.message });
        return;
      }
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  const reportMatch = pathname.match(/^\/api\/report\/(\d{4}-\d{2}-\d{2})$/);
  if (req.method === 'GET' && reportMatch) {
    if (!requireApiAuth(req, res, urlObj)) return;

    const date = reportMatch[1];
    const { record, paths } = loadRecordByDate(date);
    if (!record) {
      sendJSON(res, 404, { error: 'not found' });
      return;
    }

    try {
      const report = buildReport({
        date,
        timeline: sanitizeTimeline(record.timeline),
        mood: record.mood ?? null,
        insight: record.insight || '',
        tomorrow: record.tomorrow || ''
      });
      report.storage = {
        recordPath: paths.recordPath,
        timelinePath: paths.timelinePath,
        sourcePath: paths.sourcePath,
        parsedPath: paths.parsedPath
      };
      sendJSON(res, 200, report);
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/dates') {
    if (!requireApiAuth(req, res, urlObj)) return;
    try {
      sendJSON(res, 200, { dates: listAllDates() });
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  let urlPath = pathname;
  if (urlPath === '/') urlPath = '/index.html';
  const fullPath = resolvePublicFile(CONFIG.publicPath, urlPath);
  if (!fullPath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(fullPath);
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  });
});

server.listen(CONFIG.port, '127.0.0.1', () => {
  console.log(`🚀 Daily System running at http://127.0.0.1:${CONFIG.port}`);
  console.log(`📁 Data: ${path.resolve(CONFIG.dataPath)}`);
});

module.exports = { server, CONFIG };
