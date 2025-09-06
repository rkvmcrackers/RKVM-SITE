# RKVM Crackers Admin Panel

This is a frontend-only admin panel for managing products in the RKVM Crackers website.

## Access

- **Login URL**: `/admin`
- **Dashboard URL**: `/admin/dashboard` (only accessible after login)

## Login Credentials

- **Username**: `rkvmowner`
- **Password**: `rkvm@123`

## Features

### 1. Product Management
- **Add Products**: Click "Add New Product" button
- **Edit Products**: Click the edit (pencil) icon on any product row
- **Delete Products**: Click the delete (trash) icon on any product row

### 2. Product Fields
- **Product Name**: Required field
- **Price**: Required field (in Indian Rupees ₹)
- **Category**: Required field (select from predefined categories)
- **Description**: Required field
- **Stock Status**: In Stock / Out of Stock
- **Image**: Optional 300x300 image upload with preview

### 3. Image Handling
- Images are automatically resized to 300x300 pixels
- Maintains aspect ratio with padding if needed
- Stored as base64 data URLs in localStorage
- Preview available before saving

### 4. Data Persistence
- All data is stored in browser's localStorage
- No backend required
- Data persists across browser sessions
- Automatic synchronization with other pages

## How It Works

1. **Login**: Navigate to `/admin` and enter credentials
2. **Dashboard**: After login, you're redirected to `/admin/dashboard`
3. **Manage Products**: Add, edit, or delete products as needed
4. **Automatic Sync**: Changes automatically appear in:
   - Quick Purchase page (`/quick-purchase`)
   - Price List page (`/price-list`)

## Security Notes

- This is a frontend-only implementation
- Credentials are hardcoded in the component
- No server-side validation
- Suitable for demo/internal use only

## File Structure

```
src/
├── pages/
│   ├── AdminLogin.tsx          # Login page
│   └── AdminDashboard.tsx      # Product management dashboard
├── hooks/
│   └── use-local-storage.ts    # Custom hook for localStorage sync
└── utils/
    └── productData.ts          # Product data utilities
```

## Customization

### Adding New Categories
Edit `src/utils/productData.ts` and add new categories to the `categories` array.

### Changing Login Credentials
Edit `src/pages/AdminLogin.tsx` and update the hardcoded credentials in the `handleSubmit` function.

### Styling
The admin panel uses Tailwind CSS and shadcn/ui components. Modify the className attributes to customize the appearance.

## Troubleshooting

### Products Not Showing
- Check if you're logged in
- Clear browser localStorage and try again
- Check browser console for errors

### Images Not Uploading
- Ensure the image file is valid (JPEG, PNG, etc.)
- Check browser console for errors
- Try refreshing the page

### Login Issues
- Verify credentials: `rkvmowner` / `rkvm@123`
- Check if localStorage is enabled in your browser
- Try clearing browser cache and cookies

## Browser Compatibility

- Modern browsers with ES6+ support
- localStorage support required
- Canvas API support for image resizing
- File API support for image uploads

## Future Enhancements

- User management system
- Order management
- Analytics dashboard
- Export/import functionality
- Image optimization and CDN integration
- Real-time notifications
