# TamerX Inventory - Deployment Options

## 🖥️ For Windows/HP Machines (Recommended)

### Option 1: Docker Setup (Easiest for Windows)

**Requirements:** Windows 10/11 with Docker Desktop

1. **Install Docker Desktop:**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and restart

2. **Run Setup:**
   ```bash
   # In PowerShell or Command Prompt
   cd path\to\tamtam
   .\scripts\setup.sh  # Or run commands manually
   ```

3. **Start Everything:**
   ```bash
   docker-compose up -d
   pnpm run dev
   ```

**✅ Works on Windows machines**
**❌ Does NOT work on Chromebooks**

---

## 💻 For Chromebooks (Cloud Database)

Since Chromebooks can't run Docker, use a **cloud-hosted MySQL database**:

### Option 2A: PlanetScale (Free Tier Available)

**Best for Chromebooks and easy setup!**

1. **Create Account:** https://planetscale.com
2. **Create Database:** Name it `tamerx_inventory`
3. **Get Connection String:**
   - Click "Connect"
   - Copy the MySQL connection string
4. **Update .env:**
   ```env
   DATABASE_URL=mysql://username:password@host.psdb.cloud/tamerx_inventory?ssl={"rejectUnauthorized":true}
   ```

**Pros:**
- ✅ Free tier (5GB storage, 1 billion reads/month)
- ✅ Works from any device (Chromebook, Windows, Mac)
- ✅ Automatic backups
- ✅ No local setup needed

**Cons:**
- Requires internet connection

### Option 2B: Railway.app (Free $5/month credit)

1. **Create Account:** https://railway.app
2. **New Project** → **Add MySQL**
3. **Copy Connection String**
4. **Update .env** with the connection string

### Option 2C: Render.com (Free Tier)

1. **Create Account:** https://render.com
2. **New** → **PostgreSQL** (or find MySQL provider)
3. **Copy Connection Info**
4. **Update .env**

### Option 2D: AWS RDS Free Tier

1. **Create AWS Account**
2. **RDS** → **Create Database** → **MySQL 8.0**
3. **Select Free Tier**
4. **Update .env** with endpoint

---

## 🌐 Full Cloud Deployment (All Devices)

### Option 3: Deploy Everything to Cloud

**Recommended Services:**

#### Vercel (Frontend) + PlanetScale (Database)

**Best for Chromebooks!**

1. **Push to GitHub** (already done!)

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Import GitHub repository
   - Add environment variables from `.env`
   - Deploy!

3. **Use PlanetScale for database** (see Option 2A)

**Result:** Access from anywhere, works on all devices including Chromebooks!

#### Railway.app (Full Stack)

1. **Connect GitHub** to Railway
2. **Deploy** - Railway handles everything
3. **Add MySQL** service
4. **Configure environment variables**

**Cost:** ~$5-10/month for small team

#### Render.com (Full Stack)

1. **Connect repository**
2. **Select** Web Service + MySQL
3. **Deploy**

**Cost:** Free tier available

---

## 📱 For Mixed Environment (Windows + Chromebooks)

**Recommended Setup:**

1. **Host on one Windows machine:**
   - Use Docker Compose setup
   - Run server on one reliable Windows PC
   - Access from LAN: `http://192.168.1.X:3000`

2. **Or use cloud database:**
   - Windows machines run the app locally
   - Chromebooks access via cloud deployment
   - All connect to same PlanetScale database

---

## 🔧 Setup Steps by Device Type

### For Windows (HP) Users:

```bash
# Install Node.js from nodejs.org (choose LTS version)
# Install pnpm: npm install -g pnpm

# Clone repository
git clone https://github.com/brebuilds/tamtam.git
cd tamtam

# Option A: With Docker (recommended)
docker-compose up -d
pnpm install
pnpm run db:push
pnpm run dev

# Option B: With cloud database
pnpm install
# Update .env with cloud database URL
pnpm run db:push
pnpm run dev
```

### For Chromebook Users:

**Chromebooks CANNOT run the app locally.** You must use:

1. **Cloud deployment** (Vercel + PlanetScale) - Access via URL
2. **LAN access** - Connect to Windows machine running the server
3. **Linux mode on Chromebook** (advanced):
   - Enable Linux (Beta) in Settings
   - Follow Linux setup instructions
   - This is complex and not recommended

**Easiest for Chromebooks:** Deploy to Vercel, access via web!

---

## ⚡ Quick Comparison

| Option | Chromebook | Windows | Cost | Setup Time |
|--------|------------|---------|------|------------|
| Docker Local | ❌ No | ✅ Yes | Free | 10 min |
| PlanetScale | ✅ Yes | ✅ Yes | Free | 5 min |
| Vercel Deploy | ✅ Yes | ✅ Yes | Free* | 15 min |
| Railway | ✅ Yes | ✅ Yes | $5-10/mo | 10 min |
| LAN Server | ✅ Via LAN | ✅ Yes | Free | 15 min |

*Free tier has limits

---

## 🎯 Recommended for Your Team

**Best Setup for Windows + Chromebook Mix:**

### Cloud Option (Best for Chromebooks):

1. **Deploy to Vercel** - Free, fast, accessible everywhere
2. **Use PlanetScale** - Free tier, no setup
3. **Access from any device** via URL

**Total cost:** $0 (free tier)
**Setup time:** 20 minutes
**Works on:** ✅ Everything

### Local Network Option (Best for offline work):

1. **One Windows PC hosts** with Docker
2. **Others access via LAN** - `http://192.168.1.X:3000`
3. **PlanetScale database** - everyone uses same data

**Total cost:** $0
**Setup time:** 30 minutes
**Works on:** ✅ Windows, ✅ Chromebooks (via LAN)

---

## 📞 Need Help Choosing?

- **All remote work?** → Vercel + PlanetScale
- **Office with good LAN?** → Docker on one PC + LAN access
- **Just Windows machines?** → Docker local setup
- **Budget conscious?** → Free tier cloud (PlanetScale + Vercel)
- **Need offline access?** → Docker local (Windows only)

---

**For your specific case (Windows + Chromebooks):**

I recommend **Vercel + PlanetScale** because:
- ✅ Works on ALL devices (Windows, HP, Chromebooks)
- ✅ Free tier is generous
- ✅ No local setup needed
- ✅ Automatic HTTPS
- ✅ Fast global CDN
- ✅ Easy to maintain

See `CLOUD_DEPLOY.md` for step-by-step cloud deployment!
