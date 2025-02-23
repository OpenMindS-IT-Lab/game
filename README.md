# 🎮 Game Project

Welcome to the **Game Project**! This repository is a **modern JavaScript/TypeScript game** powered by **Vite** for an optimized development experience. It features **server-side logic**, **real-time interactions**, and a **scalable architecture**.

---

## 🚀 Project Structure

```plaintext
/
│── .vscode/         # VS Code settings
│── app/            # Frontend application logic
│── public/         # Static assets (images, fonts, etc.)
│   ├── assets/     # Game-related assets (sprites, audio, etc.)
│── server/         # Backend logic & API endpoints
│   ├── api/        # Game API for authentication & logic
│── types/          # Type definitions for TypeScript
│── .env.example    # Example environment variables
│── netlify.toml    # Netlify deployment configuration
│── package.json    # Project dependencies & scripts
│── tsconfig.json   # TypeScript configuration
│── vite.config.ts  # Vite build configuration
```

---

## 🔧 Dependencies & Tooling

This project uses:

- **Backend:** Express.js, Telegraf (for Telegram integration)
- **Utilities:** Lodash, qs (query string parsing)
- **Build System:** Vite (fast development & bundling)
- **TypeScript Support:** Definitions for Express, Node.js, Three.js
- **Serverless Deployment:** Netlify Functions, Serverless HTTP

---

## 📜 Scripts (package.json)

| Command                 | Description |
|-------------------------|-------------|
| `npm run dev`          | Starts the dev server via Netlify Dev |
| `npm run build`        | Builds the project using Netlify |
| `npm run preview`      | Previews the production build |
| `npm run deps:install` | Installs dependencies with a nested strategy |
| `npm run deps:reinstall` | Cleans and reinstalls dependencies |

---

## 🛠️ TypeScript Configuration (tsconfig.json)

- **Target:** ESNext for modern JavaScript features
- **Module Resolution:** Node.js strategy
- **Strict Mode:** Ensured for type safety
- **Library Support:** DOM, ESNext, Promise
- **Output Directory:** `./dist`
- **Includes:** `app/**/*`, `types`, `server`

---

## ⚡ Vite Configuration (vite.config.ts)

- **Root Directory:** `./`
- **Plugins:** Supports custom Vite plugins
- **Build Optimizations:** ES module support
- **Preview Mode:** Uses Vite's built-in preview system

---

## 🏰 Game Mechanics

### Towers

- **🛡️ Main Tower** – Precise shots at enemies
- **🌪️ Air Tower** – Pushes enemies back
- **🔥 Fire Tower** – Burns enemies over time
- **🌍 Earth Tower** – Smashes enemies with seismic force
- **❄️ Water Tower** – Freezes enemies in place

### Enemies

- **⚡ Fast Enemies** – High speed, low health
- **🛑 Tank Enemies** – Slow but heavily armored
- **👻 Stealth Enemies** – Invisible until detected
- **👹 Bosses** – Unique combinations of strength & speed

### Additional Features

- **⛈️ Dynamic Environments:** Changing lighting & weather
- **🎯 Trap System:** Mines, ice zones, electric fields
- **⏳ Time Control:** Slow down or speed up gameplay
- **🌍 Multiplayer:** Score-based & co-op defense modes

---

## 📦 Getting Started

### Prerequisites

Ensure you have:

- [Node.js](https://nodejs.org/) (Check `.nvmrc` for recommended version)
- A package manager: [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

```sh
# Clone the repo
git clone https://github.com/OpenMindS-IT-Lab/game.git
cd game

# Install dependencies
npm install  # or yarn install
```

### Running the Project

```sh
npm run dev  # or yarn dev
```

This starts both frontend & backend components automatically.

---

## 🌍 Deployment (Netlify)

1. Connect the repo to [Netlify](https://www.netlify.com/).
2. Define required **environment variables**.
3. Deploy and monitor the build logs.

For alternatives, consider [Vercel](https://vercel.com/) or self-hosting.

---

## 🤝 Contributing

1. **Fork the repo**.
2. **Create a feature branch:** `git checkout -b feature-branch`
3. **Make changes** following best practices.
4. **Commit with clear messages:** `git commit -m "Description of change"`
5. **Push to GitHub:** `git push origin feature-branch`
6. **Open a Pull Request**.

Code reviews ensure quality & improvements before merging.

---

## 📜 License

Currently, no explicit license. **Consider adding `LICENSE.md`** for clarity.

---

## 💬 Contact & Support

For issues, suggestions, or discussions:

- **Open an issue** in the repository
- **Join the community discussions**

🚀 _Happy coding and enjoy the game!_ 🎮

