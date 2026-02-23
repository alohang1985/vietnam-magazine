const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = 3333;
const ROOT = path.resolve(__dirname);
const DATA_DIR = path.join(ROOT, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(ROOT, 'public')));

// Helpers
function readJson(file, fallback) {
  try { const p = path.join(DATA_DIR, file); if (!fs.existsSync(p)) { fs.writeFileSync(p, JSON.stringify(fallback || {} , null, 2)); }
    const raw = fs.readFileSync(p,'utf8'); return JSON.parse(raw);
  } catch(e){ return fallback || {}; }
}
function writeJson(file, obj){ fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(obj, null, 2)); }

// Tasks
app.get('/api/tasks', (req,res)=>{
  res.json(readJson('tasks.json', []));
});
app.post('/api/tasks', (req,res)=>{
  const tasks = readJson('tasks.json', []);
  tasks.push(req.body);
  writeJson('tasks.json', tasks);
  res.json({ok:true});
});

// Widgets list
app.get('/api/widgets', (req,res)=>{
  const widgetsDir = path.join(ROOT, 'widgets');
  const files = fs.existsSync(widgetsDir) ? fs.readdirSync(widgetsDir) : [];
  res.json({ widgets: files });
});

// Run command (show -> confirm -> execute)
app.post('/api/run/preview', (req,res)=>{
  const { name, cmd } = req.body;
  // return command for confirmation
  res.json({ ok: true, name, cmd });
});

app.post('/api/run/execute', (req,res)=>{
  const { name, cmd } = req.body;
  if (!cmd) return res.status(400).json({ error: 'cmd required' });
  const id = Date.now();
  const outPath = path.join(DATA_DIR, `run-${id}.log`);
  const child = spawn(cmd, { shell: true });
  const stream = fs.createWriteStream(outPath);
  child.stdout.on('data', d=>{ stream.write(d); });
  child.stderr.on('data', d=>{ stream.write(d); });
  child.on('close', code=>{ stream.end(`\nEXIT ${code}`); });
  res.json({ ok:true, id, log: `/data/run-${id}.log` });
});

// Serve log files
app.get('/data/:file', (req,res)=>{
  const f = path.join(DATA_DIR, req.params.file);
  if (!fs.existsSync(f)) return res.status(404).send('not found');
  res.sendFile(f);
});

// Simple todo/memo APIs
app.get('/api/todo', (req,res)=> res.json(readJson('todo.json', [])));
app.post('/api/todo', (req,res)=>{ const todos = readJson('todo.json', []); const item = req.body; item.done = false; item.created_at = new Date().toISOString(); todos.push(item); writeJson('todo.json', todos); res.json({ok:true}); });
app.post('/api/todo/:idx/done', (req,res)=>{ const todos = readJson('todo.json', []); const i = parseInt(req.params.idx); if (todos[i]) todos[i].done = true; writeJson('todo.json', todos); res.json({ok:true}); });
app.delete('/api/todo/:idx', (req,res)=>{ const todos = readJson('todo.json', []); const i = parseInt(req.params.idx); if (!isNaN(i) && todos[i]) { todos.splice(i,1); writeJson('todo.json', todos); return res.json({ok:true}); } res.status(404).json({error:'not found'}); });

// Notes (quick memos)
app.get('/api/notes', (req,res)=> res.json(readJson('notes.json', [])));
app.post('/api/notes', (req,res)=>{ const notes = readJson('notes.json', []); const note = { text: req.body.text || '', created_at: new Date().toISOString() }; notes.unshift(note); writeJson('notes.json', notes); res.json({ok:true}); });
app.delete('/api/notes/:idx', (req,res)=>{ const notes = readJson('notes.json', []); const i = parseInt(req.params.idx); if (!isNaN(i) && notes[i]) { notes.splice(i,1); writeJson('notes.json', notes); return res.json({ok:true}); } res.status(404).json({error:'not found'}); });

// Calendar
app.get('/api/calendar', (req,res)=> res.json(readJson('calendar.json', [])));
app.post('/api/calendar', (req,res)=>{ const cal = readJson('calendar.json', []); const item = { date: req.body.date, text: req.body.text, created_at: new Date().toISOString() }; cal.push(item); writeJson('calendar.json', cal); res.json({ok:true}); });
app.delete('/api/calendar/:idx', (req,res)=>{ const cal = readJson('calendar.json', []); const i = parseInt(req.params.idx); if (!isNaN(i) && cal[i]) { cal.splice(i,1); writeJson('calendar.json', cal); return res.json({ok:true}); } res.status(404).json({error:'not found'}); });

// Config
app.get('/api/config', (req,res)=> res.json(readJson('config.json', { env: {} })));
app.post('/api/config', (req,res)=>{ writeJson('config.json', req.body); res.json({ok:true}); });

app.get('/', (req,res)=> res.sendFile(path.join(ROOT, 'public', 'index.html')));

app.listen(PORT, ()=> console.log(`DK Command Center listening on http://localhost:${PORT}`));
