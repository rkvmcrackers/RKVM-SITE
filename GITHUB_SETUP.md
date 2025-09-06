# GitHub API Setup Guide

This application uses GitHub's API to store data without requiring a traditional database. Follow these steps to set up the system:

## Prerequisites

1. A GitHub account
2. A GitHub repository (can be public or private)
3. A GitHub Personal Access Token

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner and select "New repository"
3. Choose a repository name (e.g., `rkvm-data`)
4. Make it public or private (your choice)
5. Don't initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Generate a Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "RKVM App Data Access")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - If using a public repo, you can use `public_repo` instead
5. Click "Generate token"
6. **IMPORTANT**: Copy the token immediately - you won't see it again!

## Step 3: Update Configuration

1. Open `src/config/github.ts`
2. Update the following values:

```typescript
export const GITHUB_CONFIG = {
  owner: 'your-actual-github-username',
  repo: 'your-actual-repo-name',
  branch: 'main', // or 'master' if that's your default branch
  token: 'ghp_your_actual_token_here'
};
```

## Step 4: Test the Setup

1. Start your application
2. Go to the Admin Dashboard
3. Try adding a product
4. Check your GitHub repository - you should see a `data/` folder with `products.json`

## How It Works

- **Products**: Stored in `data/products.json`
- **Orders**: Stored in `data/orders.json`
- **Data Structure**: All data is stored as JSON files in your GitHub repository
- **Real-time Updates**: Changes are immediately reflected across all users
- **No Database Required**: Everything is stored in GitHub's cloud

## Security Considerations

1. **Token Security**: Never commit your token to version control
2. **Repository Access**: Consider using a private repository for sensitive data
3. **Token Permissions**: Only grant the minimum required permissions
4. **Token Rotation**: Regularly rotate your access tokens

## Troubleshooting

### Common Issues

1. **"GitHub API error: 401"**
   - Check your token is correct
   - Ensure token has proper permissions
   - Verify repository name and owner

2. **"GitHub API error: 404"**
   - Repository doesn't exist
   - Repository name is misspelled
   - Branch name is incorrect

3. **"GitHub API error: 403"**
   - Token doesn't have write access
   - Repository is private and token lacks access

### Debug Steps

1. Check browser console for detailed error messages
2. Verify your GitHub configuration values
3. Test token access manually using GitHub's API explorer
4. Ensure repository exists and is accessible

## Alternative Setup (Environment Variables)

For production deployments, you can use environment variables:

1. Create a `.env` file in your project root:

```env
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=your-repo
VITE_GITHUB_BRANCH=main
VITE_GITHUB_TOKEN=your-token
```

2. Update `src/config/github.ts`:

```typescript
export const GITHUB_CONFIG = {
  owner: import.meta.env.VITE_GITHUB_OWNER || 'your-github-username',
  repo: import.meta.env.VITE_GITHUB_REPO || 'your-repo-name',
  branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
  token: import.meta.env.VITE_GITHUB_TOKEN || 'your-github-personal-access-token'
};
```

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your GitHub configuration
3. Ensure your token has proper permissions
4. Check that your repository exists and is accessible

## Benefits of This Approach

- **No Database Setup**: Zero database configuration required
- **Free Storage**: GitHub provides free storage for public repositories
- **Version Control**: All data changes are tracked with Git history
- **Global Access**: Data is accessible from anywhere
- **Backup**: Automatic backup through GitHub
- **Collaboration**: Multiple admins can manage data
- **Scalability**: GitHub handles the infrastructure
