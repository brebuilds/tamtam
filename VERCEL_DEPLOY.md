# 🚀 Vercel Deployment Guide - Diesel Industry Hub

This guide will help you deploy your Diesel Industry Hub to Vercel in under 10 minutes.

---

## ✅ Prerequisites

- [ ] Supabase account with your database and auth set up
- [ ] GitHub repository with your code pushed (`brebuilds/tamtam`)
- [ ] Vercel account (free tier works great!)

---

## 📦 Step 1: Push Your Code to GitHub

Your code is already on GitHub at `brebuilds/tamtam` - you're all set!

---

## 🌐 Step 2: Deploy to Vercel

### Option A: One-Click Deploy

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `brebuilds/tamtam`
4. Vercel will auto-detect the configuration ✅
5. Click **"Deploy"** (we'll add environment variables next)

### Option B: Vercel CLI (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
cd /Users/bre/tamtam-1
vercel

# Follow the prompts
```

---

## 🔐 Step 3: Add Environment Variables

In your Vercel project dashboard:

1. Go to **Settings → Environment Variables**
2. Add the following variables for **Production**:

### Required Variables:

```bash
# Database (from Supabase)
DATABASE_URL=postgresql://postgres.[project-id]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase Auth (from Supabase Dashboard → Settings → API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Settings
VITE_APP_TITLE=Diesel Industry Hub
VITE_APP_LOGO=/tamerx-logo.svg
```

### Optional Variables (if using AWS S3):

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

3. Click **"Save"**
4. Go to **Deployments** tab and click **"Redeploy"**

---

## 🎯 Step 4: Verify Deployment

1. Wait for deployment to complete (~2 minutes)
2. Visit your Vercel URL: `https://your-project.vercel.app`
3. You should see the login page!

### Test Checklist:

- [ ] Login page loads
- [ ] Can sign up with email/password
- [ ] Receive Supabase confirmation email
- [ ] Can sign in after email confirmation
- [ ] News Feed loads
- [ ] Parts Database shows 558 products
- [ ] Knowledge Hub accessible

---

## 🔄 Automatic Deployments

Every time you push to the `master` branch on GitHub, Vercel will automatically:

1. Pull the latest code
2. Run the build
3. Deploy the new version
4. Zero downtime! 🎉

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Missing environment variables`
- **Fix:** Add all required variables in Vercel Settings → Environment Variables

**Error:** `Cannot connect to database`
- **Fix:** Check your `DATABASE_URL` is correct (use the **connection pooler** URL from Supabase)

### App Loads But Can't Sign In

**Error:** `Supabase Auth not working`
- **Fix:** 
  1. Go to Supabase Dashboard → Authentication → URL Configuration
  2. Add your Vercel URL to **Site URL**: `https://your-project.vercel.app`
  3. Add to **Redirect URLs**: `https://your-project.vercel.app/**`

### API Calls Failing

**Error:** `404 on /api/trpc`
- **Fix:** Check that `vercel.json` exists and has the correct rewrites
- The `api/index.ts` file should be present

---

## 🎨 Custom Domain (Optional)

1. Go to Vercel project → **Settings → Domains**
2. Add your custom domain (e.g., `dieselhub.com`)
3. Update DNS records as instructed
4. Update Supabase redirect URLs to use your custom domain

---

## 📊 Monitoring & Logs

### View Logs:
1. Vercel Dashboard → Your Project
2. Click **Deployments** → Select deployment
3. Click **View Function Logs**

### Monitor Performance:
- Vercel provides analytics on the **Analytics** tab
- View request counts, response times, and errors

---

## 💡 Pro Tips

1. **Environment Variables per Environment:**
   - Set different values for Production, Preview, and Development
   - Preview deployments use preview environment variables

2. **Branch Deployments:**
   - Create a `dev` branch for testing
   - Vercel creates preview deployments for every branch
   - Test changes before merging to master!

3. **Rollback:**
   - If a deployment breaks something:
   - Go to **Deployments** → Find the working deployment
   - Click **"..."** → **"Promote to Production"**

---

## 🎉 You're Done!

Your Diesel Industry Hub is now live on Vercel! 

**What You Have:**
- ✅ Auto-deployment from GitHub
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Serverless API functions
- ✅ Zero-downtime deployments
- ✅ Automatic preview deployments

**Next Steps:**
- Share the URL with your team
- Set up a custom domain
- Monitor usage in Vercel dashboard

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Check your deployment logs** in Vercel dashboard

---

**Deployment Status:**
- [x] Netlify config removed
- [x] Old OAuth removed
- [x] Clean Vercel setup
- [x] Environment variables documented
- [x] Local testing passed ✅

**Happy Deploying! 🚀**

