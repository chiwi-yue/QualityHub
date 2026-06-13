const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'qualityhub-dev-secret';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory stores — reset on restart, intentional for test isolation
const users = new Map();
const tasks = new Map();
let taskIdCounter = 1;

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password)
    return res.status(400).json({ error: 'username and password are required' });
  if (users.has(username))
    return res.status(409).json({ error: 'Username already taken' });
  users.set(username, await bcrypt.hash(password, 10));
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.status(201).json({ token });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  const hash = users.get(username);
  if (!hash || !(await bcrypt.compare(password, hash)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/tasks', auth, (req, res) => {
  const result = [...tasks.values()].filter(t => t.username === req.user.username);
  res.json(result);
});

app.post('/api/tasks', auth, (req, res) => {
  const { title } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const task = { id: taskIdCounter++, title, completed: false, username: req.user.username };
  tasks.set(task.id, task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.get(id);
  if (!task || task.username !== req.user.username)
    return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body, { id, username: task.username });
  res.json(task);
});

app.delete('/api/tasks/:id', auth, (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.get(id);
  if (!task || task.username !== req.user.username)
    return res.status(404).json({ error: 'Task not found' });
  tasks.delete(id);
  res.status(204).send();
});

app.listen(PORT, () => console.log(`task-api listening on http://localhost:${PORT}`));
module.exports = app;
