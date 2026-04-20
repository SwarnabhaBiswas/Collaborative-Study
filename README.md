# Sync: Collaborative Study Room

Sync is a real-time study room application where users can join shared spaces, study together using a synchronized Pomodoro timer, and chat live. The goal of the app is simple: make studying feel less isolating and more structured without any flashy components.

Instead of studying alone and losing focus, Sync lets you sit in a virtual room with others, track time, and stay accountable.

## Features

- User authentication (JWT-based login and registration)
- Create and join study rooms using a unique room ID
- Real-time chat using Socket.IO
- Shared Pomodoro timer synced across all users in a room
- Presence system (see who is in the room)
- Track and revisit previously created rooms
- Clean and responsive UI with a focused design

## Tech Stack

Frontend:
- React (Vite)
- Tailwind CSS

Backend:
- Node.js
- Express.js
- MongoDB (Mongoose)

Real-time:
- Socket.IO

## Project Structure


/frontend
/backend


## How to Run Locally

### 1. Clone the repository


git clone <your-repo-url>
cd <project-folder>


---

### 2. Setup Backend


cd backend
npm install


Create a `.env` file inside `/backend`:


PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173


Start backend:


npm run dev


---

### 3. Setup Frontend


cd frontend
npm install


Create a `.env` file inside `/frontend`:


VITE_API_URL=http://localhost:5000


Start frontend:


npm run dev


---

### 4. Open the app

Visit:


http://localhost:5173


---

## Notes

- Backend must run before frontend
- Socket connection depends on backend availability

---

## What I Learned

This project helped me understand how real-time systems work in practice, especially syncing state (like timers) across multiple users. It also forced me to think about UI/UX more seriously — not just making things work, but making them feel smooth and natural.

---

## Future Improvements

- Persistent chat history
- Leaderboard based on focus time
- Room roles (admin/mod)
- Better mobile experience (bottom sheet modal)
- Still improving.

---

## Author

Built by me as part of learning full-stack development and real-time systems.