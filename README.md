# OpticLog

A minimal web app for tracking eye prescriptions and managing your vision records.

## Features

- **User Authentication** — Secure login with Supabase
- **Prescription Logging** — Track SPH, CYL, and Axis for both eyes
- **History Timeline** — View all your prescription records at a glance
- **Check-up Reminders** — 3-month notifications to stay on top of your eye health
- **PDF Reports** — Export your prescription history
- **Email Notifications** — Get reminders sent to your inbox
- **Responsive Design** — Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend** — Vanilla JavaScript, HTML, CSS
- **Build** — Vite
- **Backend** — Supabase (Auth + Database)
- **Notifications** — Resend API

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/ZiadHosssam/OpticLog.git
cd OpticLog
npm install
```

### 2. Setup Environment
Copy the example files and add your Supabase credentials:
```bash
cp config.example.js src/config.js
cp .env.example .env
```

Update `src/config.js` and `.env` with your [Supabase](https://supabase.com) credentials.

### 3. Run
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Deploy

```bash
npm run build
```

The `dist` folder is ready for deployment.

## How to Contribute

We welcome contributions! Here's how you can help:

1. **Fork the repository** — Click the Fork button on GitHub
2. **Create a feature branch** — `git checkout -b feature/your-feature-name`
3. **Make your changes** — Add new features or fix bugs
4. **Test thoroughly** — Ensure your changes work on desktop and mobile
5. **Commit with clear messages** — `git commit -m "Add feature: description"`
6. **Push to your fork** — `git push origin feature/your-feature-name`
7. **Submit a Pull Request** — Open a PR with a clear description of your changes

### Development Guidelines

- Keep code clean and well-organized
- Follow existing code style and conventions
- Test responsiveness across devices
- Add comments for complex logic
- Update documentation as needed

## License

ISC
