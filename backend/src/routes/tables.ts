import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, templates } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/templates', (req: AuthRequest, res: Response) => {
  res.json(templates);
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const tables = db.gradeTables.filter(t => t.userId === req.userId);
  res.json(tables);
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const table = db.gradeTables.find(t => t.id === req.params.id && t.userId === req.userId);
  if (!table) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(table);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { name, className, schoolYear, country, headTeacher, templateId } = req.body;
  if (!name || !className) { res.status(400).json({ error: 'Name und Klasse sind erforderlich' }); return; }

  let subjects = req.body.subjects || [];
  let students = req.body.students || [];

  if (templateId) {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      subjects = template.subjects.map(s => ({ ...s, id: uuidv4() }));
      students = template.sampleStudents.map(s => ({
        ...s,
        id: uuidv4(),
        grades: subjects.reduce((acc: Record<string, string | null>, sub: { id: string }) => ({ ...acc, [sub.id]: null }), {}),
      }));
    }
  }

  const table = {
    id: uuidv4(),
    userId: req.userId!,
    name,
    className,
    schoolYear: schoolYear || new Date().getFullYear().toString(),
    country: country || 'AT',
    headTeacher: headTeacher || '',
    subjects,
    students,
    templateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.gradeTables.push(table);
  res.status(201).json(table);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const idx = db.gradeTables.findIndex(t => t.id === req.params.id && t.userId === req.userId);
  if (idx === -1) { res.status(404).json({ error: 'Not found' }); return; }
  db.gradeTables[idx] = { ...db.gradeTables[idx], ...req.body, id: req.params.id, userId: req.userId!, updatedAt: new Date().toISOString() };
  res.json(db.gradeTables[idx]);
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const idx = db.gradeTables.findIndex(t => t.id === req.params.id && t.userId === req.userId);
  if (idx === -1) { res.status(404).json({ error: 'Not found' }); return; }
  db.gradeTables.splice(idx, 1);
  res.json({ success: true });
});

export default router;
