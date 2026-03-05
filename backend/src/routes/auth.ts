import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { JWT_SECRET, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, country } = req.body;
  if (!username || !email || !password || !country) {
    res.status(400).json({ error: 'Alle Felder sind erforderlich' });
    return;
  }
  if (db.users.find(u => u.email === email)) {
    res.status(400).json({ error: 'E-Mail bereits registriert' });
    return;
  }
  if (db.users.find(u => u.username === username)) {
    res.status(400).json({ error: 'Benutzername bereits vergeben' });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    username,
    email,
    passwordHash,
    country,
    language: 'de' as const,
    theme: 'light' as const,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username, email, country, language: user.language, theme: user.theme } });
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user) {
    res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'E-Mail oder Passwort falsch' });
    return;
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, country: user.country, language: user.language, theme: user.theme } });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = db.users.find(u => u.id === req.userId);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({ id: user.id, username: user.username, email: user.email, country: user.country, language: user.language, theme: user.theme });
});

router.put('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = db.users.find(u => u.id === req.userId);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const { username, email, password, country, language, theme } = req.body;
  if (username) user.username = username;
  if (email) user.email = email;
  if (password) user.passwordHash = await bcrypt.hash(password, 10);
  if (country) user.country = country;
  if (language) user.language = language;
  if (theme) user.theme = theme;
  res.json({ id: user.id, username: user.username, email: user.email, country: user.country, language: user.language, theme: user.theme });
});

export default router;
