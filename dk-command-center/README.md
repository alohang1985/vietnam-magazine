# DK Command Center v1.0

Local control dashboard for Mac Mini.

Quick start:

1. Install dependencies:
   npm install
2. Start server:
   npm start
3. Open http://localhost:3333

Design:
- Node + Express backend
- Static HTML frontend (public/index.html)
- Data stored in data/*.json
- Widgets in widgets/ (drop a file to add)

Security note:
- Commands executed through /api/run/execute will run on your machine. Use carefully.
