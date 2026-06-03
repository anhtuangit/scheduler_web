# Schedule 18 - Task Management System

Hệ thống quản lý công việc cá nhân và nhóm với đầy đủ tính năng.

## Công nghệ sử dụng

### Backend
- Node.js + TypeScript + Express
- MongoDB + Mongoose
- OAuth2 Google Sign-In
- JWT (HTTP-only cookies)
- Nodemailer

### Frontend
- React Vite + TypeScript
- Redux Toolkit
- React Router
- Tailwind CSS
- React Toast
- react-beautiful-dnd
- Iconify

## Cài đặt

1. Cài đặt dependencies:
```bash
npm run install:all
```

2. Cấu hình môi trường:
- Tạo file `.env` trong thư mục `backend/` (xem `backend/.env.example`)
- Tạo file `.env` trong thư mục `frontend/` (xem `frontend/.env.example`)

3. Chạy ứng dụng:
```bash
npm run dev
```

Backend chạy tại: http://localhost:5000
Frontend chạy tại: http://localhost:5173

## Cấu trúc dự án

```
Schedule_18/
├── backend/          # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── models/   # MongoDB models
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   └── uploads/      # File uploads
├── frontend/         # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/    # Redux store
│   │   ├── services/
│   │   └── utils/
└── README.md
```

## Tính năng

- ✅ Quản lý công việc cá nhân với timeline
- ✅ Quản lý dự án nhóm với Kanban board
- ✅ OAuth2 Google Sign-In
- ✅ Gắn nhãn, đính kèm file, nhắc nhở email
- ✅ Bình luận, phân quyền thành viên
- ✅ Admin dashboard và quản lý người dùng

