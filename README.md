# RKVM Crackers - Fireworks & Crackers Store

A modern, responsive web application for managing and selling fireworks and crackers, built with React, TypeScript, and Tailwind CSS.

## ✨ Features

### 🛍️ Customer Features
- **Quick Purchase**: Browse products and add to cart
- **Price List**: View all products with pricing
- **Easy Checkout**: Simple order placement with WhatsApp integration
- **Responsive Design**: Works perfectly on all devices

### 🔧 Admin Features
- **Product Management**: Add, edit, and delete products
- **Order Management**: Track customer orders with status updates
- **Real-time Updates**: Changes reflect immediately across all users
- **No Database Required**: Uses GitHub API for data persistence

### 🚀 Technical Features
- **GitHub API Integration**: Store data in GitHub repositories
- **Real-time Sync**: Automatic data synchronization
- **Image Management**: Product image upload and optimization
- **Order Tracking**: Complete order lifecycle management

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Components**: shadcn/ui + Tailwind CSS
- **Build Tool**: Vite
- **Data Storage**: GitHub API (no database required)
- **State Management**: React Hooks
- **Styling**: Tailwind CSS with custom animations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- GitHub account and repository
- GitHub Personal Access Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd rkvm-cracker-sparkle-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure GitHub API**
   - Follow the [GitHub Setup Guide](./GITHUB_SETUP.md)
   - Update `src/config/github.ts` with your details

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Admin: http://localhost:5173/admin

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── config/             # Configuration files
└── assets/             # Static assets
```

## 🔧 Configuration

### GitHub API Setup
The application uses GitHub's API to store data. See [GITHUB_SETUP.md](./GITHUB_SETUP.md) for detailed setup instructions.

### Environment Variables (Optional)
Create a `.env` file for production deployments:

```env
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=your-repo
VITE_GITHUB_BRANCH=main
VITE_GITHUB_TOKEN=your-token
```

## 📱 Usage

### For Customers
1. Browse products on the home page
2. Use Quick Purchase for easy shopping
3. View complete price list
4. Place orders with simple checkout

### For Admins
1. Access admin panel at `/admin`
2. Manage products (add, edit, delete)
3. Track customer orders
4. Update order statuses
5. Manage highlights and configuration

## 🔒 Security Features

- Admin authentication required for dashboard access
- GitHub token security best practices
- Input validation and sanitization
- Secure image handling

## 🌟 Key Benefits

- **No Database Setup**: Zero database configuration required
- **Free Storage**: GitHub provides free storage for public repositories
- **Version Control**: All data changes are tracked with Git history
- **Global Access**: Data is accessible from anywhere
- **Automatic Backup**: Data backed up through GitHub
- **Real-time Updates**: Changes reflect immediately across all users

## 🚀 Deployment

### Deploy to Lovable
1. Open [Lovable](https://lovable.dev)
2. Import your project
3. Click Share → Publish

### Deploy to Vercel/Netlify
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Check the [GitHub Setup Guide](./GITHUB_SETUP.md)
- Review browser console for error messages
- Verify GitHub configuration settings

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
