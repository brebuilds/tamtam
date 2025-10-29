# Cloud Deployment Guide - Works on ALL Devices!

**Perfect for teams with Windows + Chromebooks**

This guide will get your inventory system running in the cloud, accessible from any device with a browser!

## 🚀 Quick Deploy (15 minutes)

### Step 1: Database Setup (PlanetScale - Free)

1. **Create Account:**
   - Go to https://planetscale.com
   - Sign up with GitHub (easiest)

2. **Create Database:**
   - Click "New database"
   - Name: `tamerx-inventory`
   - Region: Choose closest to you
   - Click "Create database"

3. **Get Connection String:**
   - Click "Connect"
   - Select "Node.js"
   - Copy the connection string (looks like):
     ```
     mysql://user:pass@region.psdb.cloud/tamerx-inventory?ssl={"rejectUnauthorized":true}
     ```
   - Save this for later!

4. **Initialize Schema:**
   - In terminal on ANY computer (Windows):
     ```bash
     # Update .env with PlanetScale URL
     DATABASE_URL=mysql://... # paste your connection string

     # Run migrations
     pnpm run db:push
     ```

✅ **Database is ready!**

### Step 2: Deploy to Vercel (Free)

1. **Push Code to GitHub:**
   - Already done! Your branch: `claude/session-011CUZTKQs3rZAszyaHd3YQw`

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import from GitHub
   - Select `brebuilds/tamtam` repository
   - Select your branch

3. **Configure Environment Variables:**

   Click "Environment Variables" and add:

   ```env
   DATABASE_URL=mysql://your-planetscale-connection-string
   JWT_SECRET=your-random-32-character-secret-here
   VITE_APP_TITLE=TamerX Inventory
   OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev
   VITE_OAUTH_PORTAL_URL=https://vida.butterfly-effect.dev
   PORT=3000
   NODE_ENV=production
   ```

   **Optional (for AI search):**
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your URL: `https://tamerx-inventory.vercel.app`

✅ **App is live!**

### Step 3: Create Admin User

1. **Visit your Vercel URL**
2. **Sign in** through OAuth
3. **Open PlanetScale Dashboard:**
   - Go to your database
   - Click "Console" tab
   - Run SQL:
     ```sql
     UPDATE users
     SET role = 'admin'
     WHERE email = 'your.email@example.com';
     ```
   - Or use phpMyAdmin if you prefer

✅ **You're an admin!**

### Step 4: Import Products (Optional)

From any Windows machine:

```bash
# 1. Update .env with PlanetScale connection string
DATABASE_URL=mysql://your-connection-string

# 2. Place your quality_master.csv in the repo

# 3. Update import_data.py (line 237):
csv_file = './quality_master.csv'

# 4. Run import
python3 import_data.py
```

✅ **All done!**

---

## 🌐 Access From Any Device

**Your URL:** `https://tamerx-inventory.vercel.app`

Works on:
- ✅ Windows PCs
- ✅ HP laptops
- ✅ Chromebooks
- ✅ Tablets
- ✅ Phones
- ✅ Any browser!

---

## 💰 Cost Breakdown

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| **PlanetScale** | 5GB storage, 1B reads/month | $29/mo for more |
| **Vercel** | 100GB bandwidth, unlimited sites | $20/mo for team features |
| **Total** | **$0** for small team! | $49/mo for unlimited |

**Your team will likely stay on free tier!**

---

## 🔒 Security Best Practices

1. **Change JWT_SECRET** to a random 32-character string:
   ```bash
   # Generate one:
   openssl rand -base64 32
   ```

2. **Use Environment Variables:**
   - Never commit `.env` to git
   - Always use Vercel's environment variable settings

3. **Enable 2FA:**
   - On PlanetScale account
   - On Vercel account
   - On GitHub account

4. **Regular Backups:**
   - PlanetScale: Automatic backups (free tier = 1 day retention)
   - Manual: Use data export feature in your app!

---

## 📊 Alternative: Railway.app (All-in-One)

If you want **everything in one place:**

1. **Go to https://railway.app**
2. **New Project** → **Deploy from GitHub**
3. **Add MySQL** service
4. **Configure environment variables**
5. **Deploy!**

**Cost:** $5-10/month (includes database)
**Pros:** Single dashboard for everything
**Cons:** Not free

---

## 🔧 Maintenance

### Update the App:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push

# Vercel auto-deploys! (takes 2-3 min)
```

### Database Backups:

**Option 1: PlanetScale automatic (free tier = 1 day)**

**Option 2: Manual export via your app:**
- Go to `/export` route
- Select all tables
- Download JSON backup
- Store safely

**Option 3: Command line:**
```bash
# Install PlanetScale CLI
brew install planetscale/tap/pscale  # Mac
# or download from planetscale.com/cli

# Create backup branch
pscale branch create tamerx-inventory backup
```

### Monitor Usage:

**PlanetScale Dashboard:**
- Storage used
- Reads/writes
- Connection count

**Vercel Dashboard:**
- Bandwidth usage
- Function executions
- Error logs

---

## 🐛 Troubleshooting

### Can't Connect to Database

```bash
# Test connection
pnpm run db:push

# Check PlanetScale:
# - Database is "awake" (auto-sleeps after 7 days)
# - Connection string is correct
# - SSL is enabled
```

### Deployment Failed

```bash
# Check Vercel logs
# Common issues:
# - Missing environment variables
# - Build errors (check build logs)
# - Wrong Node.js version (should be 18+)
```

### Site is Slow

```bash
# PlanetScale free tier may throttle
# Consider upgrading or:
# - Optimize queries
# - Add caching
# - Reduce data fetched
```

---

## 📈 Scaling Up

When you outgrow free tier:

1. **PlanetScale Scaler:** $29/month
   - 10GB storage
   - 100B reads/month
   - Production-ready

2. **Vercel Pro:** $20/month
   - Team features
   - More bandwidth
   - Better support

3. **Total:** $49/month for unlimited team use

**Alternative:** Self-host on DigitalOcean for $12/month (requires more setup)

---

## ✅ Post-Deployment Checklist

- [ ] Vercel deployment successful
- [ ] Database connected and migrated
- [ ] Admin user created
- [ ] Products imported (if applicable)
- [ ] All team members can access
- [ ] Environment variables configured
- [ ] JWT secret changed from default
- [ ] Regular backup schedule set
- [ ] Team trained on system

---

## 🎉 You're Live!

Your team can now access the inventory system from:
- Office Windows PCs
- Home laptops
- Chromebooks
- Phones
- Anywhere with internet!

**No installation needed on client devices!**

Just share the URL: `https://your-app.vercel.app`

---

## 📞 Support

If you need help:
1. Check Vercel deployment logs
2. Check PlanetScale connection status
3. Review error messages in browser console
4. Check the SETUP_GUIDE.md for detailed info

**Your app is now cloud-native and accessible from any device!** 🚀
