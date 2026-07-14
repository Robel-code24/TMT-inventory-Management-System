# Deployment Guide

This guide will help you deploy the Inventory Management System with:
- **Backend:** Render.com (Free)
- **Frontend:** Vercel (Free)

## Step 1: Push Code to GitHub

1. Go to https://github.com/new
2. Create a new repository named `inventory-management-system`
3. Don't initialize with README (we already have one)
4. After creating, run these commands in your project directory:

```bash
git remote add origin https://github.com/Robel-code24/inventory-management-system.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Render.com

1. Go to https://render.com
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository `inventory-management-system`
5. Configure:
   - **Name:** `tmt-inventory-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `DATABASE_URL`: `sqlite:///./inventory.db`
   - `JWT_SECRET`: Generate a secure random string
7. Click "Deploy Web Service"

Once deployed, your backend URL will be: `https://tmt-inventory-backend.onrender.com`

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up/login with your GitHub account
3. Click "Add New Project"
4. Select your `inventory-management-system` repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     - `VITE_API_URL`: Your Hugging Face Space URL (e.g., `https://Robel-code24-tmt-inventory-backend.hf.space`)
6. Click "Deploy"

Once deployed, Vercel will give you a URL like: `https://inventory-management-system.vercel.app`

## Step 4: Update Frontend API URL

After deploying both:

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
4. Update `VITE_API_URL` to your actual backend URL, for example `https://inventory-management-system-h6fu.onrender.com`
4. Redeploy the frontend

## Important Notes

- The backend uses SQLite database which is fine for development/small deployments
- For production, consider using PostgreSQL via Supabase
- Update the `DATABASE_URL` environment variable in Hugging Face if using PostgreSQL
- The frontend uses mock data when not authenticated - this is by design for the demo mode

## Accessing Your Deployed App

After deployment:
- **Frontend:** Your Vercel URL
- **Backend API:** Your Hugging Face Space URL + `/docs` for API documentation

Demo credentials:
- Admin: admin@inventory.com / admin123
- Staff: staff@inventory.com / staff123
