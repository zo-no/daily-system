const http = require('http');
const fs = require('fs');
const path = require('path');

// 配置 - 用户需要设置这些
const CONFIG = {
  port: 8888,
  dataPath: './data',  // 数据存储路径
  publicPath: './web'  // 网页文件路径
};

// 确保目录存在
if (!fs.existsSync(CONFIG.dataPath)) {
  fs.mkdirSync(CONFIG.dataPath, { recursive: true });
}

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: 接收原始记录
  if (req.method === 'POST' && req.url === '/api/log') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const logDir = path.join(CONFIG.dataPath, 'raw-logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const filePath = path.join(logDir, `${data.date}.txt`);
        fs.writeFileSync(filePath, data.entries);
        console.log('📝 原始记录已保存:', filePath);
        
        // 这里可以触发自动处理
        console.log('🤖 数据已保存，可以触发后续处理...');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: 接收日记
  if (req.method === 'POST' && req.url === '/api/diary') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const diaryDir = path.join(CONFIG.dataPath, 'daily-tracker');
        if (!fs.existsSync(diaryDir)) fs.mkdirSync(diaryDir, { recursive: true });
        const filePath = path.join(diaryDir, `${data.date}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log('📝 日记已保存:', filePath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API: 接收 Zeno 日记
  if (req.method === 'POST' && req.url === '/api/zeno-diary') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const zenoDir = path.join(CONFIG.dataPath, 'zeno-diary');
        if (!fs.existsSync(zenoDir)) fs.mkdirSync(zenoDir, { recursive: true });
        const filePath = path.join(zenoDir, `${data.date}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log('🤖 Zeno 日记已保存:', filePath);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 静态文件服务
  let filePath = req.url;
  if (filePath === '/') filePath = '/log.html';
  
  const fullPath = path.join(CONFIG.publicPath, filePath);
  const ext = path.extname(fullPath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  };
  
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(content);
  });
});

server.listen(CONFIG.port, () => {
  console.log(`🚀 日记系统服务器运行在 http://localhost:${CONFIG.port}`);
  console.log(`📁 数据路径: ${CONFIG.dataPath}`);
  console.log(`🌐 网页路径: ${CONFIG.publicPath}`);
});

module.exports = { server, CONFIG };