const express = require('express');
const taskData = require('./task.json');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const TASK_PRIORITIES = ['low', 'medium', 'high'];

function normalizePriority(priority) {
  if (priority === undefined) return undefined;
  if (typeof priority !== 'string') return null;
  const normalized = priority.trim().toLowerCase();
  return TASK_PRIORITIES.includes(normalized) ? normalized : null;
}

function parseBooleanQuery(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return null;
}

const now = Date.now();
const tasks = taskData.tasks.map((task, index) => {
  // Initialize missing fields from seed data.
  const createdAt =
    typeof task.createdAt === 'string' && task.createdAt.trim().length > 0
      ? task.createdAt
      : new Date(now - (taskData.tasks.length - index) * 1000).toISOString();

  const priority = normalizePriority(task.priority) ?? 'medium';

  return { ...task, createdAt, priority };
});
let nextId =
  tasks.length > 0
    ? Math.max(...tasks.map((task) => task.id)) + 1
    : 1;

function parseTaskId(idParam) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isValidTaskPayload(payload) {
  const normalizedPriority = normalizePriority(payload.priority);
  if (payload.priority !== undefined && normalizedPriority === null) return false;

  return (
    payload &&
    typeof payload.title === 'string' &&
    payload.title.trim().length > 0 &&
    typeof payload.description === 'string' &&
    payload.description.trim().length > 0 &&
    typeof payload.completed === 'boolean'
  );
}

app.post('/tasks', (req, res) => {
  if (!isValidTaskPayload(req.body)) {
    return res.status(400).json({ error: 'Invalid task payload' });
  }

  const task = {
    id: nextId,
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    completed: req.body.completed,
    priority: normalizePriority(req.body.priority) ?? 'medium',
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  nextId += 1;

  return res.status(201).json(task);
});

app.get('/tasks', (req, res) => {
  let result = [...tasks];

  // Optional filtering by completion status.
  const completedFilter = parseBooleanQuery(req.query.completed);
  if (req.query.completed !== undefined && completedFilter === null) {
    return res.status(400).json({ error: 'Invalid completed filter' });
  }
  if (completedFilter !== undefined) {
    result = result.filter((task) => task.completed === completedFilter);
  }

  // Sort by creation date (newest first).
  result.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return res.status(200).json(result);
});

app.get('/tasks/priority/:level', (req, res) => {
  const normalizedLevel = normalizePriority(req.params.level);
  if (normalizedLevel === null || normalizedLevel === undefined) {
    return res.status(400).json({ error: 'Invalid priority level' });
  }

  const result = [...tasks]
    .filter((task) => task.priority === normalizedLevel)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

  return res.status(200).json(result);
});

app.get('/tasks/:id', (req, res) => {
  const id = parseTaskId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  const task = tasks.find((item) => item.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.status(200).json(task);
});

app.put('/tasks/:id', (req, res) => {
  const id = parseTaskId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  if (!isValidTaskPayload(req.body)) {
    return res.status(400).json({ error: 'Invalid task payload' });
  }

  const taskIndex = tasks.findIndex((item) => item.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const existingTask = tasks[taskIndex];
  const normalizedPriority = normalizePriority(req.body.priority);

  const updatedTask = {
    id,
    title: req.body.title.trim(),
    description: req.body.description.trim(),
    completed: req.body.completed,
    // Keep createdAt stable (priority can change).
    createdAt: existingTask.createdAt,
    priority: normalizedPriority ?? existingTask.priority ?? 'medium',
  };

  tasks[taskIndex] = updatedTask;

  return res.status(200).json(updatedTask);
});

app.delete('/tasks/:id', (req, res) => {
  const id = parseTaskId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid task id' });
  }

  const taskIndex = tasks.findIndex((item) => item.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const [deletedTask] = tasks.splice(taskIndex, 1);
  return res.status(200).json(deletedTask);
});

if (require.main === module) {
  app.listen(port, (err) => {
    if (err) {
      return console.error('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
  });
}

module.exports = app;