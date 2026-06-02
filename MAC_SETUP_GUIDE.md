# System Setup Guide for Mac

This guide will walk you through setting up the project on your Mac, including installing the necessary dependencies (Node.js, PostgreSQL, and Git), cloning the repository, and running the application.

## 1. Install Prerequisites

### Git
Git is used for version control and cloning the project.
- Mac usually comes with Git pre-installed. You can check by opening your terminal and typing: `git --version`
- If it's not installed, you can download it from the official site: [Download Git for Mac](https://git-scm.com/download/mac)

### Node.js
Node.js is the runtime for both the frontend (Vite/React) and backend (Express) applications.
- Download the "LTS" (Long Term Support) version for Mac from the official website: [Download Node.js](https://nodejs.org/en/download/)
- Run the installer and follow the prompts.
- Verify the installation in your terminal: `node -v` and `npm -v`

### PostgreSQL
PostgreSQL is the database used for this project.
- **Recommended for Mac**: Use [Postgres.app](https://postgresapp.com/). It's the easiest, most Mac-friendly way to get started. Just download, move to Applications, and click "Initialize".
- Alternatively, you can download the official installer: [Download PostgreSQL](https://www.postgresql.org/download/macosx/)
- Once installed, make sure the PostgreSQL server is running.

## 2. Clone the Project

1. Open your Terminal application.
2. Navigate to the folder where you want to store the project (e.g., `cd Desktop`).
3. Clone the repository using Git:
   ```bash
   git clone <INSERT_YOUR_GITHUB_REPO_URL_HERE>
   ```
   *(Note: Remember to replace `<INSERT_YOUR_GITHUB_REPO_URL_HERE>` with the actual Git URL of your project repository)*
4. Navigate into the project folder:
   ```bash
   cd IT_CAPSTONE_PROJECT
   ```

## 3. Database Configuration

You need to create a database for the application to connect to.
1. Open your terminal.
2. If you are using Postgres.app or have command-line tools installed, you can simply create the database by running:
   ```bash
   createdb real_estate_db
   ```
   *(If this command doesn't work, open your preferred PostgreSQL client like pgAdmin, Postico, or the Postgres.app UI, and manually create a new database named `real_estate_db`)*

## 4. Backend (Server) Setup

1. In your terminal, navigate to the `server` directory from the root of the project:
   ```bash
   cd server
   ```
2. Install the server dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   - Make a copy of the `.env.example` file and name it `.env`. You can do this in the terminal:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file in a text editor.
   - Look at the `DATABASE_URL` line:
     `DATABASE_URL=postgresql://postgres:your_password@localhost:5432/real_estate_db`
   - If your local PostgreSQL setup requires a password, update it here. *(Note: If you use Postgres.app on a Mac, you often don't need a username/password, and changing it to `DATABASE_URL=postgresql://localhost:5432/real_estate_db` usually works).*
4. Run the database migrations to create the tables:
   ```bash
   npm run migrate:up
   ```
5. (Optional) Run the seed script to populate the database with initial data:
   ```bash
   npm run seed
   ```
6. Start the backend server:
   ```bash
   npm run dev
   ```
   *The server should now be running on `http://localhost:5000`.*

## 5. Frontend (Client) Setup

1. Open a **new, separate terminal window** (keep the server running in the first one).
2. Navigate to the `client` directory from the root of the project:
   ```bash
   cd path/to/IT_CAPSTONE_PROJECT/client
   ```
   *(Or if you are already in the root folder, just `cd client`)*
3. Install the client dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The application should now be accessible in your web browser, typically at `http://localhost:5173`.*

---

**Troubleshooting:**
- **Port already in use**: If port 5000 or 5173 is in use, make sure you don't have other projects running.
- **Database connection error**: Double-check the credentials in your `.env` file inside the `server` folder.
