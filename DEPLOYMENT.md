# Deploying to Vercel

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas database (or other MongoDB hosting)
3. Gemini API key from Google AI Studio

## Environment Variables
Set these environment variables in your Vercel project settings:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-tracker?retryWrites=true&w=majority
JWT_SECRET=your_very_long_and_secure_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
```

## Deployment Steps

### Option 1: Deploy via Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel --prod`

### Option 2: Deploy via GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Vercel will automatically deploy on every push to main branch

### Option 3: Deploy via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables
5. Deploy

## Build Configuration
The project is already configured with:
- `vercel.json` for routing and build settings
- Build scripts in `package.json`
- Proper Node.js version targeting

## Post-Deployment
1. Set up your environment variables in Vercel dashboard
2. Test all functionality including:
   - User authentication
   - Expense tracking
   - Split expenses
   - PDF generation
   - Data clearing with captcha

## MongoDB Atlas Setup
1. Create a cluster at https://cloud.mongodb.com
2. Create a database user
3. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)
4. Get the connection string and set it as MONGODB_URI

## Domain Configuration
- Vercel provides a free domain like `your-app.vercel.app`
- You can add a custom domain in project settings
