// src/config/github.ts
// GitHub API Configuration
// Values are loaded securely from environment variables

export const GITHUB_CONFIG = {
  // Your GitHub username or organization name
  owner: import.meta.env.VITE_GITHUB_OWNER as string,

  // Your repository name
  repo: import.meta.env.VITE_GITHUB_REPO as string,

  // Branch name (usually 'main' or 'master')
  branch: import.meta.env.VITE_GITHUB_BRANCH || "main",

  // Your GitHub Personal Access Token
  // Stored only in .env / Vercel Env Variables (never hardcoded)
  token: import.meta.env.VITE_GITHUB_TOKEN as string,
};

export default GITHUB_CONFIG;
