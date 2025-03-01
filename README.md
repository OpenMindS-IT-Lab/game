# 🎮 Game Project

Welcome to the **Game Project**! This repository contains a **modern JavaScript/TypeScript game**, powered by **Vite**, designed for an optimized development experience. The project features **server-side logic**, **real-time interactions**, and a **scalable architecture**.

---

## 🚀 Project Overview

This project is a **strategic tower defense game** with real-time mechanics. Players must build defensive structures, counter enemy attacks, and leverage environmental advantages to succeed. The game is designed to be highly customizable and expandable.

---

## 📦 Prerequisites

Before setting up the project, ensure that you have the following installed:

- **Node.js** (LTS recommended) - [Download here](https://nodejs.org/)
- **npm** (Comes with Node.js) - Ensure it’s updated: `npm install -g npm`
- **Git** (Version control system) - [Download here](https://git-scm.com/)
- **Netlify CLI** (For deployment) - `npm install -g netlify-cli`

Verify installations by running:

```sh
node -v
npm -v
git --version
netlify --version
```

---

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

#### 🔍 Environment Variables Explained

- `` – The name of the application, displayed in the UI and metadata.
- `` – The base URL of the backend API that the game communicates with.
- `` – The URL where the Telegram Bot sends data updates.
- `` – Defines the environment mode (`development`, `production`, or `staging`).
- `` – The unique identifier for the Telegram bot. Obtain from [BotFather](https://t.me/BotFather).
- `` – The public key for secure Telegram API communications.
- `` – The authentication token for the Telegram bot, provided by [BotFather](https://t.me/BotFather).
- `` – A secure key for authorizing API requests.

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

The project will be available at `http://localhost:`8877. You can change port in `netlify.toml` file.

---

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

---

## 🔧 Dependencies & Tooling

This project utilizes the following technologies:

- **Backend:** Express.js, Telegraf (for Telegram integration)
- **Utilities:** Lodash, qs (query string parsing)
- **Build System:** Vite (fast development & bundling)
- **TypeScript Support:** Type definitions for Express, Node.js, Three.js
- **Serverless Deployment:** Netlify Functions, Serverless HTTP

---

## 📖 Game Rules & Mechanics

The game is a **real-time strategic tower defense** experience, where players must build and upgrade defenses to withstand waves of enemy attacks. Players can:

- Strategically place different types of defensive structures.
- Use resources efficiently to enhance their defenses.
- Adapt to dynamic enemy behavior and environmental conditions.
- Compete for high scores and achievements.

Each decision affects the outcome, making planning and quick thinking essential.

---

## 📜 Scripts (package.json)

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Starts the dev server via Netlify Dev        |
| `npm run build`          | Builds the project using Netlify             |
| `npm run preview`        | Previews the production build                |
| `npm run deps:install`   | Installs dependencies with a nested strategy |
| `npm run deps:reinstall` | Cleans and reinstalls dependencies           |

---

## 🌍 Deployment (Netlify)

1. Connect the repository to [Netlify](https://www.netlify.com/).
2. Define required **environment variables**.
3. Deploy and monitor the build logs.

For alternative deployment options, consider [Vercel](https://vercel.com/) or [self-hosting](https://vercel.com/).

---

## 🤝 Contributing

1. **Fork the repository**.
2. **Create a feature branch:** `git checkout -b feature-branch`
3. **Implement changes** following best practices.
4. **Write clear commit messages:** `git commit -m "Description of change"`
5. **Push to GitHub:** `git push origin feature-branch`
6. **Open a Pull Request**.

Code reviews ensure quality improvements before merging.

---

## 📜 License

Currently, this project does not have an explicit license. Consider adding a `LICENSE.md` file for clarity.

---

## 💬 Contact & Support

For issues, suggestions, or discussions:

- **Open an issue** in the repository
- **Join the community discussions**

🚀 *Happy coding, and enjoy the game!* 🎮

