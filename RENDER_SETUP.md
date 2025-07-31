# Render Deployment Configuration

## Build Command
```
npm install && npm run build
```

## Start Command
```
npm start
```

## Environment Variables

Add these environment variables in your Render service settings:

- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: production
- `PORT`: 10000 (Render default, but will be automatically set)

## Service Type
- **Web Service** (not Static Site)

## Root Directory
- Leave empty (deploy from root)

## Auto-Deploy
- Enable auto-deploy from your main branch

## Health Check Path
- `/api/ping`
