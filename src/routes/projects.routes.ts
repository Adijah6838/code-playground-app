import { Router, Request, Response } from 'express';
import db from '../db';
import { executeCode } from '../executor';

const router = Router();

// Execute code securely (Moved to top)
router.post('/execute', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No code provided' });
  
  const result = executeCode(code);
  res.json(result);
});

// Get all projects
router.get('/', (req: Request, res: Response) => {
  const projects = db.prepare('SELECT id, name, updated_at FROM projects ORDER BY updated_at DESC').all();
  res.json(projects);
});

// Create a new project
router.post('/', (req: Request, res: Response) => {
  const { name, files_json } = req.body;
  const info = db.prepare('INSERT INTO projects (name, files_json) VALUES (?, ?)').run(name, JSON.stringify(files_json));
  res.status(201).json({ id: info.lastInsertRowid, message: 'Project created' });
});

// Get a single project
router.get('/:id', (req: Request, res: Response) => {
  const project: any = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  project.files_json = JSON.parse(project.files_json);
  res.json(project);
});

// Update a project
router.put('/:id', (req: Request, res: Response) => {
  const { name, files_json } = req.body;
  db.prepare('UPDATE projects SET name = ?, files_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, JSON.stringify(files_json), req.params.id);
  res.json({ message: 'Project saved' });
});

export default router;