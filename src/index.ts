import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db';
import vm from 'vm';

dotenv.config();

const app = express();
const PORT = 4100; // Changed to 4100 to avoid Docker conflicts

app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Code Playground API is running!' });
});

app.get('/api/projects', (req: Request, res: Response) => {
  const projects = db.prepare('SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC').all();
  res.json(projects);
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { name, files_json } = req.body;
  const info = db.prepare('INSERT INTO projects (name, files_json) VALUES (?, ?)').run(name, JSON.stringify(files_json));
  res.status(201).json({ id: info.lastInsertRowid, message: 'Project created' });
});

app.post('/api/execute', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  const logs: string[] = [];
  const customConsole = {
    log: (...args: any[]) => logs.push(args.join(' ')),
    error: (...args: any[]) => logs.push('Error: ' + args.join(' ')),
  };

  const sandbox = { console: customConsole, Math, Date, JSON };

  try {
    const result = vm.runInNewContext(code, sandbox, { timeout: 2000 });
    res.json({ success: true, logs, result: result !== undefined ? String(result) : undefined });
  } catch (error: any) {
    res.json({ success: false, logs, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});