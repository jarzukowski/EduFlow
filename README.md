# EduFlow - E-learning Platform

EduFlow is a full-stack e-learning platform built with Vue 3, TypeScript, Node.js, Express, Prisma, and PostgreSQL. It provides a structured learning environment where teachers manage courses and lessons, students track progress and access protected learning materials, and administrators supervise users, messaging, and platform activity.

Polish version: [README-PL.md](./README-PL.md)

![Vue](https://img.shields.io/badge/Vue%203-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-F6D32D?style=for-the-badge&logo=pinia&logoColor=black)
![Vue Router](https://img.shields.io/badge/Vue_Router-4B8BF5?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![REST API](https://img.shields.io/badge/REST_API-0A7EA4?style=for-the-badge&logo=fastapi&logoColor=white)

## Table of Contents

- [Demo](#demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Architecture](#architecture)
- [Security](#security)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

## Demo

- Video demo: `YouTube link coming soon`

## Screenshots

### Home View

Landing dashboard after authentication with quick access to courses, role-specific navigation, and the main platform entry points.

![HOME](docs/images/home.png)

### Courses List

Paginated course catalog with search, allowing authenticated users to browse available courses and move to detailed views.

![COURSES](docs/images/courses.png)

### Teacher Dashboard

Teacher workspace for managing owned courses, lessons, enrollments, lesson ordering, lesson PDFs, and direct communication with students.

![TEACHER](docs/images/teacherdashboard.png)

### Teacher Course Creation

Course creation view for teachers with inputs for title, description, category, and thumbnail, designed to quickly publish a new course draft.

![TEACHER](docs/images/teachercoursecreate.png)

### Student Dashboard

Student workspace showing enrolled courses, lesson progress, completion tracking, and direct access to assigned learning materials.

![STUDENT](docs/images/studentdashboard.png)

### Admin

Administrative panel for supervising users, browsing platform statistics, managing courses, sending notifications, and starting direct conversations with selected users.

![ADMIN](docs/images/admin.png)

![ADMIN](docs/images/adminnotification.png)

### Messages / Notifications

Inbox-style conversations between students and teachers, plus notification dropdowns with unread counters and polling-based updates.

![MESSAGES](docs/images/messages.png)

### Auth (Login / Register)

Authentication flow with sign in, sign up, token refresh handling, and route protection based on the current session and user role.

![AUTH](docs/images/auth.png)

## Features

### Authentication & Session Security

- User registration and login with hashed passwords (`bcryptjs`).
- JWT access tokens with refresh-token based session renewal.
- Refresh token hashing in the database instead of storing plain tokens.
- Refresh token rotation with invalidation of already-used tokens.
- Refresh token reuse detection to prevent session hijacking.
- Session management with session listing, single-session revoke, revoke others, and revoke all.
- Per-device session tracking using a generated `deviceId`.
- Role-based route and API protection for `STUDENT`, `TEACHER`, and `ADMIN`.
- Auth-related rate limiting for login, register, refresh, and logout endpoints.

### Courses & Lessons

- Authenticated course browsing with pagination and search by title or description.
- Course details and lesson listing for authenticated users.
- Teacher/Admin course creation, editing, and deletion with ownership checks.
- Lesson CRUD with strict ownership validation.
- Lesson ordering and automatic reordering after edits or deletions.
- Lessons can include video URLs, duration metadata, rich content, and PDF attachments.
- PDF upload and storage on the backend with server-side file validation.
- Access-controlled PDF streaming so only authorized users can open lesson documents.
- Student enrollments managed by teachers inside their own courses.

### Student Experience

- Student dashboard with enrolled courses only.
- Lesson completion tracking per student.
- Course progress summaries derived from completed lessons.
- Automatic course completion notification after finishing all lessons in a course.
- Direct messaging with the teacher assigned to the course.

### Messaging & Notifications

- Course-based conversations between students and teachers.
- Admin-to-user direct messaging.
- Inbox with unread counters, pagination, and conversation previews.
- Conversation read state tracking.
- Automatic notifications for received messages.
- Notifications for enrollments, removals from courses, and completed courses.
- Frontend polling for inbox and active conversation refresh to improve real-time UX.
- Notification dropdown behavior with unread badges, mark-as-read, and mark-all-read actions.

### Admin Panel

- Platform statistics for total users and total courses.
- User management with pagination, filters, role changes, and forced logout.
- Course overview for administrative supervision.
- Broadcast notifications to all users, by role, or to a specific user.
- Admin messaging to selected recipients.

## Architecture

### Frontend

- Vue 3 with the Composition API.
- TypeScript-first frontend structure.
- Pinia stores for auth, sessions, courses, lessons, notifications, messaging, and dashboards.
- Vue Router with role-aware navigation guards.
- Axios client with credential support and token handling.
- Frontend architecture based on separation of concerns:
  `View -> Store -> Components`
- URL as the source of truth for pagination, search, and navigation state.
- Domain-based frontend structure for `auth`, `public`, `student`, `teacher`, `admin`, `messages`, and `lessons/pdf`.

### Backend

- Node.js + Express REST API.
- Prisma ORM with PostgreSQL.
- Modular backend organized by domain modules:
  `auth`, `courses`, `lessons`, `student`, `teacher`, `messages`, `notifications`, `admin`
- Layered backend architecture:
  `routes -> controllers -> services -> database`
- DTO-based mapping layer separating database models from API responses.
- Shared middleware for authentication, authorization, and error handling.
- Local PDF storage for uploaded lesson files in `backend/uploads/pdf`.
- Centralized error handling with consistent API error responses.

### Key Concepts

- DTO and mapper pattern for shaping API responses.
- Separation of concerns between routing, business logic, validation, and persistence.
- Role-aware data access and ownership checks.
- Cursor-style pagination in messaging and notifications, page/limit pagination in course and admin listings.
- Modular frontend stores mirrored against backend capabilities.

## Security

- `httpOnly` refresh token cookies with credentialed requests.
- Refresh token hashing before persistence.
- Refresh token rotation and rejection of replaced tokens.
- Session revocation, per-user session management, and active session limits.
- Role-based access control in both router guards and backend middleware.
- Input validation across module endpoints.
- Rate limiting for authentication, messages, notifications, student completion, and teacher student-suggestion endpoints.
- Protected PDF access based on enrollment, ownership, or admin privileges.
- CORS configured with explicit frontend origin and credentials support.
- Active session limit per user with automatic revocation of the oldest sessions.

## Tech Stack

### Frontend

- Vue 3
- TypeScript
- Pinia
- Vue Router
- Axios
- Vite

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- Multer

### Other

- JWT
- REST API
- Cookie-based refresh flow

## Getting Started

### Prerequisites

- Node.js `20+`
- npm
- PostgreSQL database

### 1. Clone the repository

```bash
git clone [repository-url]
```
### 2. Backend setup

Create `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/YOUR_DATABASE_NAME"
PORT=3000
FRONTEND_ORIGIN="http://localhost:5173"
NODE_ENV=development
JWT_ACCESS_SECRET="your_strong_access_secret_here"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
AUTH_MAX_ACTIVE_SESSIONS_PER_USER=10
AUTH_SESSION_RETENTION_DAYS=30
```

Install dependencies and prepare the database:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
```

Run the backend development server:

```bash
npm run dev
```

Backend default URL:

```text
http://localhost:3000
```

Health check endpoint:

```text
GET /api/health
```

### 3. Frontend setup

Create `frontend/.env`:

```env
VITE_API_BASE_URL="http://localhost:3000"
```

Install dependencies and run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

### 4. Suggested startup order

1. Start PostgreSQL.
2. Ensure a PostgreSQL role/user exists and matches the credentials used in `DATABASE_URL`.
3. Create the database from `DATABASE_URL` if it does not already exist.
4. Follow the backend and frontend installation steps from the sections above.
5. Open the frontend in the browser and register or log in.
6. New accounts are created with the `STUDENT` role by default. If you want to access the teacher or admin panel, promote the user role manually in the database or through an existing admin account.

## Project Structure

```text
platforma-e-learningowa/
|-- backend/
|   |-- .env
|   |-- .env.example
|   |-- generated/
|   |-- prisma/
|   |   |-- migrations/
|   |   `-- schema.prisma
|   |-- src/
|   |   |-- common/
|   |   |   |-- errors/
|   |   |   |-- files/
|   |   |   `-- http/
|   |   |-- config/
|   |   |-- db/
|   |   |-- middlewares/
|   |   |-- modules/
|   |   |   |-- admin/
|   |   |   |-- auth/
|   |   |   |-- courses/
|   |   |   |-- lessons/
|   |   |   |-- messages/
|   |   |   |-- notifications/
|   |   |   |-- student/
|   |   |   `-- teacher/
|   |   |-- routes/
|   |   |-- types/
|   |   |-- app.ts
|   |   `-- server.ts
|   |-- uploads/
|   |   `-- pdf/
|   |-- package.json
|   |-- prisma.config.ts
|   `-- tsconfig.json
|-- frontend/
|   |-- .env
|   |-- .env.example
|   |-- public/
|   |-- src/
|   |   |-- api/
|   |   |   |-- contracts/
|   |   |   `-- lessons/
|   |   |-- assets/
|   |   |   |-- lottie/
|   |   |   |-- styles/
|   |   |   |-- base.css
|   |   |   |-- main.css
|   |   |   `-- scrollbars.css
|   |   |-- components/
|   |   |   |-- admin/
|   |   |   |-- auth/
|   |   |   |-- common/
|   |   |   |-- courses/
|   |   |   |-- home/
|   |   |   |-- layout/
|   |   |   |-- messages/
|   |   |   |-- navbar/
|   |   |   |-- sessions/
|   |   |   |-- student-dashboard/
|   |   |   `-- teacher/
|   |   |-- router/
|   |   |   `-- guards/
|   |   |-- stores/
|   |   |-- types/
|   |   |-- utils/
|   |   |-- views/
|   |   |   |-- admin/
|   |   |   |-- auth/
|   |   |   |-- lessons/
|   |   |   |-- messages/
|   |   |   |-- public/
|   |   |   |-- student/
|   |   |   `-- teacher/
|   |   |-- App.vue
|   |   `-- main.ts
|   |-- env.d.ts
|   |-- index.html
|   |-- package.json
|   |-- tsconfig.app.json
|   |-- tsconfig.json
|   |-- tsconfig.node.json
|   `-- vite.config.ts
|-- .gitignore
`-- README.md
```

## Notes
- The project already includes the `isActive` field and the auth flow checks it, but the admin panel does not yet provide a full block/unblock user feature.
- Replacing polling in messages and notifications with WebSockets would make updates more real-time.
- The project does not include dedicated automated tests yet. A good next step would be to add unit tests for services, integration tests for API endpoints, and end-to-end tests for the main user flows.
- A dedicated file storage service for lesson PDFs would be a good next step instead of relying only on local server storage.
