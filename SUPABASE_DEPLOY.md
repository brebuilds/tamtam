# Deploy TamerX Inventory to Supabase + Vercel

This guide walks you through deploying your inventory system to the cloud using **Supabase** (PostgreSQL database + storage) and **Vercel** (hosting). This setup works perfectly for Mac, Windows, and Chromebooks!

## Why Supabase + Vercel?

- ✅ **100% Free** (for your scale)
- ✅ **Works on ALL devices** (Mac, Windows, Chromebooks)
- ✅ **Built-in image storage** (no need for S3)
- ✅ **Easy database management** (nice UI dashboard)
- ✅ **Auto-scaling** (handles traffic spikes)
- ✅ **Automatic backups** (point-in-time recovery)

---

## Part 1: Set Up Supabase Database

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (easiest method)

### Step 2: Create New Project

1. Click "New Project"
2. Fill in:
   - **Name**: `tamerx-inventory`
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your team's location
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for setup to complete

### Step 3: Get Connection String

1. In your project dashboard, click the **Settings** icon (gear) on left sidebar
2. Click **Database** in the settings menu
3. Scroll down to **Connection string**
4. Select the **Connection pooling** tab (important!)
5. Copy the connection string in **Transaction** mode - it will look like:
   ```
   postgres://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with the actual database password you created
7. **Save this connection string** - you'll need it in a moment!

---

## Part 2: Initialize Database Schema

Now we'll create all the tables in your Supabase database from your Mac:

### Step 1: Install Dependencies

```bash
cd /Users/bre/tamtam-1
pnpm install
```

### Step 2: Set Up Environment Variable

Create a temporary `.env.local` file with your Supabase connection string:

```bash
echo 'DATABASE_URL="your-connection-string-here"' > .env.local
```

**Replace `your-connection-string-here`** with the connection string from Part 1, Step 3.

Example:
```bash
echo 'DATABASE_URL="postgres://postgres.xxxxx:your-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"' > .env.local
```

### Step 3: Generate and Run Migrations

```bash
# Generate SQL migration files from your schema
pnpm drizzle-kit generate

# Push the schema to Supabase
DATABASE_URL=$(cat .env.local | grep DATABASE_URL | cut -d '=' -f2- | tr -d '"') pnpm drizzle-kit push
```

You should see output like:
```
✓ Executing migrations...
✓ Done!
```

### Step 4: Verify Tables

1. Go back to your Supabase dashboard
2. Click **Table Editor** on the left sidebar
3. You should see all your tables:
   - `users`
   - `products`
   - `vendors`
   - `purchase_orders`
   - `po_line_items`
   - `form_templates`
   - `form_submissions`

---

## Part 3: Set Up Supabase Storage (for Product Images)

### Step 1: Create Storage Bucket

1. In Supabase dashboard, click **Storage** on left sidebar
2. Click **Create a new bucket**
3. Fill in:
   - **Name**: `product-images`
   - **Public bucket**: Toggle ON (so images can be viewed)
4. Click **Create bucket**

### Step 2: Set Up Upload Policies

1. Click on your `product-images` bucket
2. Click **Policies** tab
3. Click **New policy**
4. Click **For full customization**
5. Create a policy for uploading:
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
     ```sql
     (bucket_id = 'product-images')
     ```
6. Click **Review** then **Save policy**

7. Create another policy for reading:
   - **Policy name**: `Allow public downloads`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`, `authenticated`
   - **Policy definition**:
     ```sql
     (bucket_id = 'product-images')
     ```
8. Click **Review** then **Save policy**

### Step 3: Get Storage URL

1. Click **Settings** (gear icon) in sidebar
2. Click **API**
3. Find **Project URL** - copy this (example: `https://xxxxx.supabase.co`)
4. Save this for later!

---

## Part 4: Deploy to Vercel

### Step 1: Push Code to GitHub

If you haven't already:

```bash
cd /Users/bre/tamtam-1
git add .
git commit -m "Converted to PostgreSQL for Supabase deployment"
git push origin master
```

### Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (easiest method)

### Step 3: Import Project

1. Click **Add New...** → **Project**
2. Find your `tamtam-1` repository (or whatever it's called on GitHub)
3. Click **Import**

### Step 4: Configure Environment Variables

Before deploying, add these environment variables:

1. In the **Configure Project** section, expand **Environment Variables**
2. Add each variable one by one (click "Add" after each):

**Required Variables:**
```
DATABASE_URL = postgres://postgres.xxxxx:your-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres
VITE_APP_ID = proj_tamerx_inventory
VITE_OAUTH_PORTAL_URL = https://vida.butterfly-effect.dev
VITE_APP_TITLE = TamerX Inventory
VITE_APP_LOGO = https://placehold.co/40x40/3b82f6/ffffff?text=T
OAUTH_SERVER_URL = https://vidabiz.butterfly-effect.dev
JWT_SECRET = your-random-secret-here-change-this-to-something-secure
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_ANON_KEY = your-supabase-anon-key-here
```

**To get your `SUPABASE_ANON_KEY`:**
1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy the **anon/public** key

**Generate a secure `JWT_SECRET`:**
```bash
openssl rand -base64 32
```

3. Once all variables are added, click **Deploy**

### Step 5: Wait for Deployment

- Vercel will build and deploy your app (takes 2-3 minutes)
- Once complete, you'll get a URL like: `https://tamerx-inventory.vercel.app`
- Click "Visit" to see your app live!

---

## Part 5: Create First Admin User

1. Visit your deployed app URL
2. Sign in with OAuth (using your Vida account)
3. You'll be logged in but won't have permissions yet

### Manually Promote to Admin (in Supabase):

1. Go to Supabase dashboard → **Table Editor**
2. Click on the `users` table
3. Find your user row
4. Click to edit
5. Change `role` from `readonly` to `admin`
6. Click **Save**
7. Refresh your app - you now have full admin access!

---

## Part 6: Import Your Products (Optional)

If you have the CSV export from your Access database:

1. SSH into your Mac or use VS Code terminal
2. Make sure you have the CSV file somewhere accessible
3. Update the `import_data.py` script to use your Supabase connection:
   ```bash
   export DATABASE_URL="your-supabase-connection-string"
   python3 import_data.py
   ```

Or you can import products manually through the UI at `/products`!

---

## Part 7: Share With Your Team

Send your team the Vercel URL (e.g., `https://tamerx-inventory.vercel.app`)

**They can access it on:**
- ✅ Windows PCs
- ✅ HP Laptops
- ✅ Chromebooks
- ✅ Any device with a web browser!

**No installation needed** - just visit the URL and sign in!

---

## Troubleshooting

### "Connection pool timeout"
- You may have hit the connection limit on Supabase free tier
- Solution: In your connection string, make sure you're using the **Transaction mode pooler** (port 6543)

### "Database not available"
- Double-check your `DATABASE_URL` in Vercel environment variables
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Try "Redeploy" in Vercel dashboard

### "No permissions" after login
- Go to Supabase Table Editor → `users` table
- Find your user and change `role` to `admin`
- Refresh the app

### Images won't upload
- Make sure you created the `product-images` bucket in Supabase Storage
- Check that upload and read policies are set correctly
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel

---

## Cost Breakdown

**Supabase Free Tier:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- **Should handle 1,131 products + images easily!**

**Vercel Free Tier:**
- 100 GB bandwidth
- Unlimited deployments
- **Perfect for your team size!**

**Total Cost: $0/month** 🎉

---

## Next Steps

1. ✅ Set up user roles for your team members
2. ✅ Upload product images through the UI
3. ✅ Import products from Access database (if available)
4. ✅ Create some vendors and test purchase orders
5. ✅ Try out the barcode scanner on mobile!

---

## Need Help?

If you get stuck at any step, just let me know which part and I'll help you through it!
