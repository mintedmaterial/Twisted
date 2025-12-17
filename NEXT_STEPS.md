# Next Steps: Deploy Twisted Custom Leather to Cloudflare

## ✅ What's Been Completed

1. **Landing Page Built**:
   - Western-themed design with video background
   - Satoshi font with glowing effects
   - Product cards for: Wallets, Belts, Purses, Welding Gear, Bible Covers
   - YouTube embed for craftsman showcase
   - Fully responsive (mobile, tablet, desktop)

2. **Git Repository Initialized**:
   - All files committed to local git
   - `.gitignore` configured
   - GitHub Actions workflow ready

3. **Cloudflare Worker Configured**:
   - Worker name: `twisted`
   - `wrangler.toml` created
   - OpenNext build completed
   - Worker bundle ready (`.open-next/worker.js`)

## 🚀 Deploy to Cloudflare (3 Steps)

### Step 1: Create GitHub Repository

You have two options:

**Option A: Using GitHub CLI (gh)**
```bash
cd C:\Users\Minte\Desktop\dev-code\TwistedCustomLeather\tcl-app

# Create repository
gh repo create TwistedCustomLeather/tcl-app --public --source=. --remote=origin

# Push code
git push -u origin main
```

**Option B: Using GitHub Web Interface**
1. Go to https://github.com/new
2. Repository name: `tcl-app`
3. Owner: `TwistedCustomLeather` (or your username)
4. Public repository
5. Don't initialize with README (we already have one)
6. Click "Create repository"

Then in your terminal:
```bash
cd C:\Users\Minte\Desktop\dev-code\TwistedCustomLeather\tcl-app

# Add remote
git remote add origin https://github.com/TwistedCustomLeather/tcl-app.git

# Push code
git push -u origin main
```

### Step 2: Get Cloudflare Credentials

#### Get Account ID:
1. Go to https://dash.cloudflare.com/
2. Click "Workers & Pages" in the left sidebar
3. Look for "Account ID" in the right sidebar
4. Copy the Account ID (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

#### Get API Token:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Click "Continue to summary"
5. Click "Create Token"
6. **IMPORTANT**: Copy the token NOW (you won't see it again)

### Step 3: Add Secrets to GitHub

1. Go to your repository on GitHub:
   `https://github.com/TwistedCustomLeather/tcl-app`

2. Click "Settings" tab

3. In left sidebar: "Secrets and variables" > "Actions"

4. Click "New repository secret"

5. Add **CLOUDFLARE_API_TOKEN**:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: [paste your API token from Step 2]
   - Click "Add secret"

6. Click "New repository secret" again

7. Add **CLOUDFLARE_ACCOUNT_ID**:
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Value: [paste your Account ID from Step 2]
   - Click "Add secret"

### Step 4: Deploy!

The GitHub Action will automatically deploy when you push to main. Since you already pushed in Step 1, check the deployment:

1. Go to your GitHub repository
2. Click "Actions" tab
3. You should see a workflow running: "Deploy Twisted Worker to Cloudflare"
4. Click on it to watch the progress
5. When complete, your worker will be live!

Your site will be available at:
```
https://twisted.<YOUR_SUBDOMAIN>.workers.dev
```

To find your URL:
1. Go to https://dash.cloudflare.com/
2. Click "Workers & Pages"
3. Click on "twisted"
4. You'll see your worker URL at the top

## 🌐 Add Custom Domain (Optional)

Once deployed, add `twistedcustomleather.com`:

1. In Cloudflare Dashboard, go to Workers & Pages
2. Click on "twisted" worker
3. Click "Triggers" tab
4. Under "Custom Domains", click "Add Custom Domain"
5. Enter: `twistedcustomleather.com`
6. Click "Add Custom Domain"
7. Cloudflare will automatically configure DNS

## 🔧 Local Development

To continue developing locally:

```bash
# Start development server
npm run dev

# Visit http://localhost:3000
```

Changes will auto-deploy when you push to GitHub:
```bash
git add .
git commit -m "Update landing page"
git push
```

## 📊 Future Enhancements

Once deployed, you can add these Cloudflare bindings:

### Workers AI Binding
Add to `wrangler.toml`:
```toml
[ai]
binding = "AI"
```

This enables AI features like:
- Product recommendations
- Image analysis
- Chatbot support

### D1 Database
```bash
# Create database
npx wrangler d1 create twisted-products-db

# Add to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "twisted-products-db"
database_id = "<YOUR_DATABASE_ID>"
```

### R2 Object Storage (Product Images)
```bash
# Create bucket
npx wrangler r2 bucket create twisted-images

# Add to wrangler.toml
[[r2_buckets]]
binding = "IMAGES_BUCKET"
bucket_name = "twisted-images"
```

### KV Storage (Product Cache)
```bash
# Create KV namespace
npx wrangler kv:namespace create "PRODUCT_CACHE"

# Add to wrangler.toml
[[kv_namespaces]]
binding = "PRODUCT_CACHE"
id = "<YOUR_KV_ID>"
```

## 🔍 Monitoring & Logs

View worker logs:
```bash
npx wrangler tail
```

Or in Cloudflare Dashboard:
1. Workers & Pages > twisted
2. Click "Logs" tab
3. Real-time logs appear here

## 💳 Square Integration (Planned)

For payment processing, you'll set up:
1. Square MCP Server
2. Environment variables for Square credentials
3. Bindings for secure key storage

## 📝 Summary

**Current Status**:
- ✅ Landing page complete
- ✅ Worker bundle built
- ✅ Git repository ready
- ⏳ Pending: GitHub push & Cloudflare credentials

**Next Action**:
Complete Steps 1-4 above to deploy!

**Questions?**
- Check README.md for detailed documentation
- Check DEPLOYMENT_GUIDE.md for alternative deployment methods
- GitHub Actions logs will show any deployment errors

---

**Worker Name**: `twisted`
**Repository**: `TwistedCustomLeather/tcl-app`
**Framework**: Next.js 15 + Cloudflare Workers
**Live URL**: Will be `https://twisted.<subdomain>.workers.dev` after deployment
