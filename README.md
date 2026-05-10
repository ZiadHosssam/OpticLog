# OpticLog - Your Personal Vision Archive

A secure web application for tracking eye prescriptions and managing vision records.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Eye
```

### 2. Configure Environment Variables

1. Copy the example configuration files:
   ```bash
   cp .env.example .env
   cp config.example.js config.js
   ```

2. Update `.env` and `config.js` with your Supabase credentials:
   - Get your Supabase URL and API key from https://supabase.com
   - Replace the placeholder values in both files

### 3. Open the Application
Simply open `index.html` in your browser or use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js with http-server
npx http-server
```

Then navigate to `http://localhost:8000`

## Project Structure

```
├── index.html          # Main landing page
├── app.js             # Application logic
├── style.css          # Styling
├── config.js          # Environment configuration (git-ignored)
├── config.example.js  # Template for config.js
├── .env               # Environment variables (git-ignored)
├── .env.example       # Template for .env
└── .gitignore         # Git ignore rules
```

## Security

- **Do NOT** commit `.env` or `config.js` files to the repository
- Always use `.env.example` and `config.example.js` as templates
- The `.gitignore` file is configured to prevent accidental commits

## Features (Phase 1)

- User authentication with Supabase
- Prescription logging (SPH, CYL, Axis for both eyes)
- Prescription history timeline
- 3-month check-up reminders

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
