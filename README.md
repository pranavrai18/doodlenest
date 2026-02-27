# CollabBoard — Real-Time Collaborative Whiteboard

A full-stack MERN application enabling real-time collaborative whiteboard drawing, chat, screen sharing, and file sharing — inspired by Zoom + Miro.

![MERN](https://img.shields.io/badge/Stack-MERN-green) ![Socket.io](https://img.shields.io/badge/WebSocket-Socket.io-blue) ![WebRTC](https://img.shields.io/badge/Screen_Share-WebRTC-red) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### Core
- 🔐 **JWT Authentication** — Register / Login / Logout
- 🏠 **Room Management** — Create & join rooms via unique Room ID
- 🎨 **Real-time Drawing** — Synchronized canvas using Socket.io
- ✏️ **Canvas Tools** — Pencil, Eraser, Clear Board
- 🎨 **Color Picker** — Preset palette + custom color
- 📏 **Brush Size** — Adjustable stroke thickness
- 👥 **Multi-user Collaboration** — Room-based real-time sessions
- 💬 **In-room Chat** — Real-time messaging inside whiteboard
- 💾 **Persistent Storage** — Sessions & users saved in MongoDB

### Intermediate
- ↩️ **Undo / Redo** — Full history stack with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- 📸 **Save Snapshot** — Export whiteboard as PNG image
- 🟢 **User Presence** — See who's online with role badges (Host/Participant)
- 🛡️ **Protected Routes** — Frontend route guards
- 👑 **Role-based Permissions** — Host vs Participant access control
- ⚠️ **Error Handling** — Validation on both client and server

### Advanced
- 🖥️ **Screen Sharing** — WebRTC `getDisplayMedia` with socket signaling
- 📁 **File Sharing** — Upload & download files inside rooms
- ⏺ **Session Recording** — Record drawing events with timestamps
- 🌙 **Dark / Light Mode** — Toggle with localStorage persistence
- 🚀 **Production Ready** — Serves React build from Express in production

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, Vite, React Router v7     |
| Backend     | Node.js, Express.js                 |
| Database    | MongoDB, Mongoose                   |
| Real-time   | Socket.io                           |
| Screen Share| WebRTC                              |
| Auth        | JWT, bcryptjs                       |
| File Upload | Multer                              |
| Dev Tools   | Concurrently, Nodemon               |

---

## 📁 Project Structure

```
Whiteboard/
├── package.json               # Root — runs client + server concurrently
├── server/
│   ├── config/db.js           # MongoDB connection
│   ├── controllers/           # Auth, Room, File controllers
│   ├── middleware/             # JWT auth, role-based access
│   ├── models/                # User, Room, Message, WhiteboardSession
│   ├── routes/                # RESTful API routes
│   ├── socket/                # Socket.io event handlers
│   ├── uploads/               # Uploaded files
│   ├── server.js              # Entry point
│   └── .env                   # Environment variables
├── client/
│   ├── src/
│   │   ├── api/               # Axios instance
│   │   ├── components/        # React components
│   │   ├── context/           # Auth & Theme providers
│   │   ├── hooks/             # Custom hooks
│   │   ├── styles/            # CSS design system
│   │   ├── App.jsx            # Router & layout
│   │   └── main.jsx           # Entry point
│   └── vite.config.js
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally or a cloud URI (e.g., MongoDB Atlas)
- **npm** v9+

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/collaborative-whiteboard.git
cd collaborative-whiteboard
```

### 2. Install Dependencies

```bash
# Install root dependencies (concurrently)
npm install

# Install server and client dependencies
npm run install-all
```

### 3. Configure Environment

Edit `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/whiteboard
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### 4. Run Development Server

```bash
npm run dev
```

This starts **both** the backend (port 5000) and frontend (port 5173) concurrently.

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build

```bash
npm run build        # Builds the React frontend
cd server
npm start            # Serves frontend + backend from port 5000
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint            | Description        |
|--------|--------------------|--------------------|
| POST   | `/api/auth/register` | Register new user  |
| POST   | `/api/auth/login`    | Login              |
| POST   | `/api/auth/logout`   | Logout             |
| GET    | `/api/auth/me`       | Get current user   |

### Rooms
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/api/rooms`          | Create a room        |
| POST   | `/api/rooms/join`     | Join a room          |
| GET    | `/api/rooms`          | Get user's rooms     |
| GET    | `/api/rooms/:roomId`  | Get room by ID       |
| DELETE | `/api/rooms/:roomId`  | Delete room (host)   |

### Files
| Method | Endpoint                    | Description         |
|--------|-----------------------------|---------------------|
| POST   | `/api/files/upload/:roomId` | Upload file to room |
| GET    | `/api/files/:roomId`        | List room files     |

---

## 🔧 Socket Events

| Event               | Direction      | Description                    |
|---------------------|----------------|--------------------------------|
| `join-room`         | Client → Server | Join a whiteboard room        |
| `leave-room`        | Client → Server | Leave a room                  |
| `draw-stroke`       | Bidirectional   | Real-time drawing sync        |
| `clear-board`       | Bidirectional   | Clear the canvas              |
| `undo` / `redo`     | Bidirectional   | Undo/redo actions             |
| `send-message`      | Client → Server | Send chat message             |
| `receive-message`   | Server → Client | Receive chat message          |
| `users-in-room`     | Server → Client | Online users list             |
| `screen-share-*`    | Bidirectional   | WebRTC signaling              |
| `file-shared`       | Bidirectional   | File upload notification      |

---

## ⌨️ Keyboard Shortcuts

| Shortcut    | Action       |
|-------------|-------------|
| `P`         | Pencil tool |
| `E`         | Eraser tool |
| `Ctrl + Z`  | Undo        |
| `Ctrl + Y`  | Redo        |

---

## 📝 License

MIT License — feel free to use, modify, and distribute.
