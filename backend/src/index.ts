import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import tablesRoutes from './routes/tables';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tables', tablesRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 Notenportal Backend läuft auf Port ${PORT}`);
});

export default app;
