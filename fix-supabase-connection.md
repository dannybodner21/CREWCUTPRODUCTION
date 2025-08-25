# 🔧 Fix Supabase Database Connection

## 🚨 Current Issue
Your current DATABASE_URL is not working:
```
postgresql://postgres.qyncvjksvfvbteiuzybu:Jesus35261414!@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

Error: "Tenant or user not found"

## ✅ Solution: Get Correct Connection String from Supabase

### Step 1: Go to Supabase Dashboard
1. Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `fvlhokredyyvccjgfele`

### Step 2: Get Database Connection String
1. In your project dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string** section
3. Look for **URI** format (not the pooler format)
4. Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 3: Update Your .env.local
Replace your current DATABASE_URL with the correct one from Supabase dashboard.

## 🔍 Alternative: Check Your Current Credentials

If you want to keep using your current setup, verify:
1. **Username**: Should be just `postgres` (not `postgres.qyncvjksvfvbteiuzybu`)
2. **Password**: Verify the password is correct
3. **Host**: Should be `db.fvlhokredyyvccjgfele.supabase.co` (not the pooler URL)

## 🧪 Test the Fix
After updating your .env.local:
1. Restart your development server
2. Run: `npm run db:migrate`
3. Check if NextAuth authentication works

## 📋 Required Environment Variables for Server Mode
Make sure you have these in your .env.local:
```bash
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_DRIVER=node

# Service Mode
NEXT_PUBLIC_SERVICE_MODE=server

# NextAuth
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3010

# Google OAuth
NEXT_AUTH_SSO_PROVIDERS=google
AUTH_GOOGLE_CLIENT_ID=your-google-client-id
AUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Key Vault
KEY_VAULTS_SECRET=your-key-vault-secret
```
