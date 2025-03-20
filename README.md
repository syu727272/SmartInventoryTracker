
# Tokyo Event Finder

An interactive web application for discovering and managing events in Tokyo. Built with React, Express, and TypeScript.

## Features

- 🗺️ Browse events by district
- 📅 Filter events by date
- 👤 User authentication
- ❤️ Save favorite events
- 🌏 Multilingual support (日本語/English)

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express.js
- UI: Radix UI + Tailwind CSS
- Database: PostgreSQL (via Nix)
- Authentication: Passport.js

## Getting Started

1. Click the "Run" button to start the development server
2. The application will be available at port 5000
3. Open the web preview to interact with the application

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Project Structure

```
├── client/          # Frontend React application
├── server/          # Express backend
└── shared/          # Shared TypeScript types
```

## Environment Variables

Set up the following environment variables in the Secrets tab:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session management

## License

MIT
