# 🎮 Game Project

[![Netlify Status](https://api.netlify.com/api/v1/badges/92c8f3e8-5593-4bc1-8c80-4a766793dd05/deploy-status)](https://app.netlify.com/sites/tower-defence-staging/deploys)

Welcome to the **Game Project**! This repository contains a **modern JavaScript/TypeScript game**, powered by **Vite**,
designed for an optimized development experience. The project features **server-side logic**, **real-time
interactions**, and a **scalable architecture**.

## 🚀 Project Overview

This project is a **strategic tower defense game** with real-time mechanics. Players must build defensive structures,
counter enemy attacks, and leverage environmental advantages to succeed. The game is designed to be highly customizable
and expandable.

## 📦 Prerequisites

Before setting up the project, ensure that you have the following installed:

- **Node.js** (LTS recommended) - [Download here](https://nodejs.org/)
- **npm** (Comes with Node.js) - Ensure it’s updated: `npm install -g npm`
- **Git** (Version control system) - [Download here](https://git-scm.com/)
- **Netlify CLI** (For deployment) - `npm install -g netlify-cli` Verify installations by running:

```sh
node -v
npm -v
git --version
netlify --version
```

## ⚙️ Project Setup & Configuration

### 1️⃣ Clone the Repository

```sh
git clone https://github.com/OpenMindS-IT-Lab/game.git
cd game
```

### 2️⃣ Install Dependencies

```sh
npm install
```

### 3️⃣ Set Up Environment Variables

Copy the `.env.example` file to `.env` (or `.env.development` and `.env.production` if needed):

```sh
cp .env.example .env
```

Then, open `.env` and configure the necessary values.

---

#### 🔍 Environment Variables Explained

This project requires several environment variables for proper functionality. Below is a description of each:

##### 📌 General Variables

- `APP_TITLE` – The game title displayed in the UI.
- `API_URL` – Backend server URL handling client requests.
- `API_KEY` – Unique key for authenticating API requests.
- `SET_WEBHOOK_URL` – Endpoint for setting the Telegram bot webhook.
- `WEBHOOK_URL` – URL where Telegram sends updates.

##### ⚙️ Node.js Environment

- `NODE_ENV` – Node.js mode (development, production, etc.).
- `NODE_VERSION` (commented out) – Recommended Node.js version.

##### 🤖 Telegram Integration

- `TELEGRAM_WEB_APP_URL` – URL for the Telegram Web App.
- `TELEGRAM_BOT_ID` – Unique identifier of the Telegram bot.
- `TELEGRAM_PUBLIC_KEY` – Public key for verifying Telegram Web App signatures.
- `TELEGRAM_BOT_TOKEN` – Authentication token for the Telegram bot.

##### 🛠 Local Telegram Bot API (optional)

- `BOT_API_URL` – URL of a self-hosted Telegram Bot API instance.
- `BOT_API_PORT` – Port for accessing the local API.
- `BOT_API_ID` – API ID for working with Telegram API.
- `BOT_API_HASH` – API Hash for authenticating requests.
- `BOT_API_VERBOSITY` – Logging level (0 – silent mode, 2 – detailed logs).

Ensure these variables are configured before running the project.

---

### 4️⃣ Authenticate with Netlify

Log in to Netlify using the CLI:

```sh
netlify login
```

Then, create a new site or link an existing one:

```sh
netlify link
```

### 5️⃣ Run the Development Server

```sh
npm run dev
```

The project will be available at `http://localhost:$PORT`. You can change the value of `PORT` environment variable
(defaults to `8877`).

## 📂 Project Structure

```plaintext
/
│── .vscode/         # VS Code settings
│── app/            # Frontend application logic
│── bot/            # Telegram bot integration
│── public/         # Static assets (images, fonts, etc.)
│   ├── assets/     # Game-related assets (sprites, audio, etc.)
│── server/         # Backend logic & API endpoints
│   ├── api/        # Game API for authentication & logic
│── types/          # Type definitions for TypeScript
│── .env.example    # Example environment variables
│── .gitignore      # Git ignore rules
│── .nvmrc          # Node.js version manager config
│── netlify.toml    # Netlify deployment configuration
│── package.json    # Project dependencies & scripts
│── tsconfig.json   # TypeScript configuration
│── vite.config.ts  # Vite build configuration
│── README.md       # Project documentation
│── SECURITY.md     # Security policy
│── ideas.md        # Notes and ideas for future features
│── index.html      # Main HTML entry point
```

## 🔧 Dependencies & Tooling

This project utilizes the following technologies:

- **Backend:** Express.js, Telegraf (for Telegram integration)
- **Utilities:** Lodash, qs (query string parsing)
- **Build System:** Vite (fast development & bundling)
- **TypeScript Support:** Type definitions for Express, Node.js, Three.js
- **Serverless Deployment:** Netlify Functions, Serverless HTTP

## 📖 Game Rules & Mechanics

The game is a **real-time strategic tower defense** experience, where players must build and upgrade defenses to
withstand waves of enemy attacks. Players can:

- Strategically place different types of defensive structures.
- Use resources efficiently to enhance their defenses.
- Adapt to dynamic enemy behavior and environmental conditions.
- Compete for high scores and achievements. Each decision affects the outcome, making planning and quick thinking
  essential.

## 📜 Scripts (package.json)

Below is a list of available npm scripts for managing the development, dependencies, and deployment of the project. |
Command | Description | | ------------------------ | ------------------------------------------------ | |
`npm run prestart` | Kills the process running on port `5173` (Vite App) before starting | | `npm run deps:install` |
Installs dependencies using a nested strategy, ignoring peer dependency warnings | | `npm run deps:reinstall` | Removes
`node_modules`, `package-lock.json`, and `dist`, then reinstalls dependencies | | `npm run dev` | Runs `prestart` and
starts the development server via Netlify Dev | | `npm run dev:bot-api` | Starts the local Telegram Bot API using
environment variables | | `npm run build` | Builds the project using Netlify | | `npm run preview` | Previews the
production build using Vite Preview | | `npm run start` | Builds the project and serves it using Vite Preview |

## 🌍 Deployment (Netlify)

1. Connect the repository to [Netlify](https://www.netlify.com/).
2. Define required **environment variables**.
3. Deploy and monitor the build logs. For alternative deployment options, consider [Vercel](https://vercel.com/) or
   [self-hosting](https://vercel.com/).

## 🤝 Contributing

1. **Fork the repository**.
2. **Create a feature branch:** `git checkout -b feature-branch`
3. **Implement changes** following best practices.
4. **Write clear commit messages:** `git commit -m "Description of change"`
5. **Push to GitHub:** `git push origin feature-branch`
6. **Open a Pull Request**. Code reviews ensure quality improvements before merging.

## 📜 License

Currently, this project does not have an explicit license. Consider adding a `LICENSE.md` file for clarity.

## 💬 Contact & Support

For issues, suggestions, or discussions:

- **Open an issue** in the repository
- **Join the community discussions**

🚀 _Happy coding, and enjoy the game!_ 🎮
