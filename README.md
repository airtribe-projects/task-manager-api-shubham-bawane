# Task Manager API

RESTful API for managing tasks using **Node.js** and **Express.js** with **in-memory storage**.

## Overview

- Supports full CRUD operations for tasks.
- Seeds initial tasks from `task.json` and stores changes in memory (not persisted to disk).
- Adds support for:
  - Filtering tasks by completion status: `GET /tasks?completed=true|false`
  - Sorting tasks by creation time: `GET /tasks` (newest `createdAt` first)
  - Task `priority`: `low | medium | high`
  - Retrieving tasks by priority: `GET /tasks/priority/:level`

### Task schema

Each task returned by the API has:

- `id` (number)
- `title` (string, non-empty)
- `description` (string, non-empty)
- `completed` (boolean)
- `priority` (`low | medium | high`)
- `createdAt` (ISO datetime string)

## Setup

1. Ensure you have **Node.js >= 18**.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node app.js
   ```
   The API runs on `http://localhost:3000`.

## Postman

You can import the ready-made collection:

- `Task-Manager-API.postman_collection.json`

After importing, set `baseUrl` to `http://localhost:3000` (already included).

## Run tests

```bash
npm test
```

## API Endpoints

### Get all tasks

- **Method:** `GET`
- **Path:** `/tasks`

Optional query parameter:

- `completed` (`true` or `false`): filter by completion status

Sorting:

- Results are sorted by `createdAt` (newest first).

Test (curl):
```bash
curl http://localhost:3000/tasks
```

Filter example:
```bash
curl "http://localhost:3000/tasks?completed=true"
```

Responses:
- `200` with an array of tasks
- `400` if `completed` filter value is invalid

Error example:
```json
{ "error": "Invalid completed filter" }
```

---

### Get task by id

- **Method:** `GET`
- **Path:** `/tasks/:id`

Test (curl):
```bash
curl http://localhost:3000/tasks/1
```

Responses:
- `200` with a task object
- `404` if the task does not exist

Error example:
```json
{ "error": "Task not found" }
```

---

### Create a task

- **Method:** `POST`
- **Path:** `/tasks`
- **Body (JSON):**
  ```json
  {
    "title": "Example title",
    "description": "Example description",
    "completed": false,
    "priority": "low | medium | high"
  }
  ```

Notes:
- `priority` is optional on create. If omitted, it defaults to `medium`.

Test (curl):
```bash
curl -X POST http://localhost:3000/tasks ^
  -H "Content-Type: application/json" ^
  -d "{ \"title\":\"Learn Express\",\"description\":\"Build a task API\",\"completed\":false,\"priority\":\"high\" }"
```

Responses:
- `201` with the created task
- `400` if the payload is invalid

Error example:
```json
{ "error": "Invalid task payload" }
```

---

### Update a task

- **Method:** `PUT`
- **Path:** `/tasks/:id`
- **Body (JSON):**
  ```json
  {
    "title": "Example title",
    "description": "Example description",
    "completed": true,
    "priority": "low | medium | high"
  }
  ```

Notes:
- `createdAt` is kept stable (does not change on update).
- `priority` may be omitted. If omitted, the task keeps its existing priority.

Test (curl):
```bash
curl -X PUT http://localhost:3000/tasks/1 ^
  -H "Content-Type: application/json" ^
  -d "{ \"title\":\"Updated Task\",\"description\":\"Updated Task Description\",\"completed\":true,\"priority\":\"low\" }"
```

Responses:
- `200` with the updated task
- `400` if the payload is invalid
- `404` if the task does not exist

---

### Delete a task

- **Method:** `DELETE`
- **Path:** `/tasks/:id`

Test (curl):
```bash
curl -X DELETE http://localhost:3000/tasks/1
```

Responses:
- `200` with the deleted task
- `404` if the task does not exist

---

### Get tasks by priority

- **Method:** `GET`
- **Path:** `/tasks/priority/:level`
- **`:level` must be one of:** `low`, `medium`, `high`

Test (curl):
```bash
curl http://localhost:3000/tasks/priority/medium
```

Responses:
- `200` with an array of tasks matching the priority
- `400` if `:level` is invalid

Error example:
```json
{ "error": "Invalid priority level" }
```

