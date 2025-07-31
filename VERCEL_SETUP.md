# Environment Variables for Vercel Deployment

You need to add these environment variables to your Vercel project settings:

1. Go to your Vercel dashboard
2. Select your expense-tracker project
3. Go to Settings → Environment Variables
4. Add these variables:

## Required Environment Variables

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: Set to "production"
- `PORT`: Set to "3001" (optional, Vercel will handle this)

## Example Values

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker
JWT_SECRET=your-very-secure-jwt-secret-key-here
NODE_ENV=production
```

## Note

Make sure to use the same MongoDB URI and JWT secret as in your local .env file for consistency.
