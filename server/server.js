const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  port: 8888,
  dataPath: './data',
  publicPath: './web'
};

// 确保数据目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDir(CONFIG.dataPath);

// ── 通用工具 ─────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
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

// ── 分析逻辑（对应 diary-builder 六类）─────────────────────

const CATEGORIES = [
  { key: 'work',   label: '核心工作', patterns: [/工作/, /开发/, /写代码/, /编程/, /会议/, /开会/, /项目/, /任务/, /debug/, /调试/] },
  { key: 'learn',  label: '个人发展', patterns: [/学习/, /阅读/, /读书/, /练习/, /研究/, /复习/, /课/, /培训/] },
  { key: 'life',   label: '生活管理', patterns: [/吃饭/, /做饭/, /购物/, /家务/, /通勤/, /出行/, /洗澡/, /洗漱/, /午休/, /起床/] },
  { key: 'social', label: '社交娱乐', patterns: [/聊天/, /朋友/, /聚餐/, /娱乐/, /游戏/, /电影/, /逛/] },
  { key: 'rest',   label: '休息',     patterns: [/睡/, /休息/, /冥想/, /午睡/, /小憩/] },
  { key: 'drain',  label: '消耗',     patterns: [/刷手机/, /刷视频/, /发呆/, /摸鱼/, /无聊/] }
];

function classifyText(text) {
  for (const cat of CATEGORIES) {
    if (cat.patterns.some(p => p.test(text))) return cat.key;
  }
  return 'other';
}

function buildReport(data) {
  const timeline = data.timeline || [];
  const totals = {};
  CATEGORIES.forEach(c => { totals[c.key] = 0; });

  for (let i = 0; i < timeline.length; i++) {
    const cur = timeline[i];
    const baseTime = cur.time.split('–')[0];
    const [h1, m1] = baseTime.split(':').map(Number);
    if (isNaN(h1)) continue;

    let durationMin = 0;
    if (cur.time.includes('–')) {
      const end = cur.time.split('–')[1];
      const [h2, m2] = end.split(':').map(Number);
      durationMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    } else if (i < timeline.length - 1) {
      const next = timeline[i + 1];
      const nextBase = next.time.split('–')[0];
      const [h2, m2] = nextBase.split(':').map(Number);
      if (!isNaN(h2)) durationMin = (h2 * 60 + m2) - (h1 * 60 + m1);
    }

    if (durationMin > 0) {
      const key = classifyText(cur.text);
      totals[key] = (totals[key] || 0) + durationMin;
    }
  }

  return { ...data, categoryTotals: totals };
}

// ── HTTP 路由 ─────────────────────────────────────────────────

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.ico':  'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // POST /api/submit — 接收完整日记（含补充）
  if (req.method === 'POST' && req.url === '/api/submit') {
    try {
      const data = await readBody(req);
      if (!data.date) throw new Error('missing date');

      const dir = path.join(CONFIG.dataPath, 'diary');
      ensureDir(dir);
      const filePath = path.join(dir, `${data.date}.json`);

      // 追加写入：若当天已有记录则合并时间线
      let existing = {};
      if (fs.existsSync(filePath)) {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      const merged = { ...existing, ...data };
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));

      console.log(`📝 [${data.date}] 日记已保存 (${(data.timeline || []).length} 条)`);
      sendJSON(res, 200, { success: true });
    } catch (e) {
      console.error('submit error:', e.message);
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // GET /api/report/:date — 返回指定日期的分析数据
  const reportMatch = req.url.match(/^\/api\/report\/(\d{4}-\d{2}-\d{2})$/);
  if (req.method === 'GET' && reportMatch) {
    const date = reportMatch[1];
    const filePath = path.join(CONFIG.dataPath, 'diary', `${date}.json`);
    if (!fs.existsSync(filePath)) {
      sendJSON(res, 404, { error: 'not found' });
      return;
    }
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const report = buildReport(raw);
      sendJSON(res, 200, report);
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // GET /api/dates — 列出所有有记录的日期
  if (req.method === 'GET' && req.url === '/api/dates') {
    try {
      const dir = path.join(CONFIG.dataPath, 'diary');
      ensureDir(dir);
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
        .sort()
        .reverse();
      sendJSON(res, 200, { dates: files });
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // 静态文件
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const fullPath = path.join(CONFIG.publicPath, urlPath);
  const ext = path.extname(fullPath);

  fs.readFile(fullPath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  });
});

server.listen(CONFIG.port, () => {
  console.log(`🚀 Daily System running at http://localhost:${CONFIG.port}`);
  console.log(`📁 Data: ${path.resolve(CONFIG.dataPath)}`);
});

module.exports = { server, CONFIG };
