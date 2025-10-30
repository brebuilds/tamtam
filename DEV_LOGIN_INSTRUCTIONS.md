# Quick Dev Login Instructions

## Current Setup:
- ✅ Supabase Auth configured
- ✅ Backend ready
- ✅ Frontend connected

## To Login:

### Option 1: Sign Up Properly (Recommended)
1. Go to http://localhost:3001
2. Click **"Sign Up"** tab
3. Enter email & password (6+ chars)
4. Check email for confirmation link from Supabase
5. Click link to confirm
6. Go back and **Sign In**

### Option 2: Use Supabase Dashboard (Skip Email)
1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to **Authentication → Users**
4. Click **Add User** → **Create new user**
5. Enter email/password
6. Toggle **Auto Confirm User** ON
7. Create user
8. Now sign in at http://localhost:3001

### Option 3: Disable Email Confirmation (Dev Only!)
1. Go to Supabase Dashboard
2. **Authentication → Providers → Email**
3. Toggle **"Confirm email"** OFF
4. Now you can sign up without email confirmation

## What Should Happen After Login:
- ✅ Redirected to News Feed (/)
- ✅ Can access Parts Database (558 products!)
- ✅ Can use Knowledge Hub
- ✅ Full access to all features

## Troubleshooting:

**"Invalid login credentials"**
→ User doesn't exist or wrong password. Try signing up first.

**"Email not confirmed"**
→ Check email or use Supabase dashboard to manually confirm

**Stuck on login page**
→ Check browser console (F12) for errors

**403/401 errors**
→ Supabase keys might be wrong in `.env`

