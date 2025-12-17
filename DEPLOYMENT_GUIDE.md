# Twisted Custom Leather - Cloudflare Deployment Guide

## Windows Workerd Compatibility Issue

Unfortunately, Cloudflare's `workerd` runtime has known compatibility issues on Windows, causing access violations during build and deployment. The worker has been successfully built but cannot be deployed from Windows CLI.

## Successfully Built

✅ **Worker Bundle:** `.open-next/worker.js` (Created successfully)
✅ **Worker Name:** `twisted`
✅ **Static Assets:** `.open-next/assets/`

## Deployment Options

### Option 1: Deploy via Cloudflare Dashboard (Recommended for Windows)

1. **Login to Cloudflare Dashboard:**
   - Go to https://dash.cloudflare.com/
   - Navigate to **Workers & Pages**

2. **Create a New Worker:**
   - Click "Create Application"
   - Select "Create Worker"
   - Name it: `twisted`

3. **Upload Worker Code:**
   - Click on your new worker
   - Go to "Quick Edit" or "Edit Code"
   - Copy the contents of `.open-next/worker.js`
   - Paste into the editor
   - Click "Save and Deploy"

4. **Configure Bindings:**
   - Go to Settings > Variables
   - Add bindings from `wrangler.jsonc`:
     - **IMAGES**: Type: Service Binding (Images)
     - **ASSETS**: Type: Fetcher (for static assets)
     - **WORKER_SELF_REFERENCE**: Type: Service Binding, Service: `twisted`

5. **Upload Static Assets:**
   - You'll need to set up Assets binding
   - Upload files from `.open-next/assets/` to Cloudflare R2 or use Workers Assets
   - Configure the ASSETS binding to point to your storage

### Option 2: Deploy via GitHub Actions (Automated CI/CD)

Create `.github/workflows/deploy.yml`:

\`\`\`yaml
name: Deploy to Cloudflare

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Build OpenNext
        run: npx opennextjs-cloudflare build --skipBuild

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
\`\`\`

**Setup:**
1. Push your code to GitHub
2. Get Cloudflare API Token from https://dash.cloudflare.com/profile/api-tokens
3. Add token as GitHub Secret: `CLOUDFLARE_API_TOKEN`
4. Push to main branch - automatic deployment!

### Option 3: Deploy from WSL (Windows Subsystem for Linux)

If you have WSL installed:

\`\`\`bash
# From WSL terminal
cd /mnt/c/Users/Minte/Desktop/dev-code/TwistedCustomLeather/tcl-app

# Install dependencies
npm install

# Build
npm run build

# Build OpenNext worker
npx opennextjs-cloudflare build --skipBuild

# Login to Cloudflare
npx wrangler login

# Deploy
npx wrangler deploy
\`\`\`

### Option 4: Use Cloudflare Pages (Alternative)

Cloudflare Pages has better Windows support and can deploy Next.js apps directly:

1. **Via Dashboard:**
   - Go to https://dash.cloudflare.com/
   - Navigate to **Workers & Pages**
   - Click "Create Application" > "Pages"
   - Connect your GitHub repo
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output: `.next`
   - Deploy!

2. **Via CLI (might work better on Windows):**
   \`\`\`bash
   npx wrangler pages deploy .next --project-name=twisted-custom-leather
   \`\`\`

## Worker Configuration

The worker is configured in `wrangler.jsonc`:

\`\`\`jsonc
{
  "name": "twisted",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-12-01",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "assets": {
    "binding": "ASSETS",
    "directory": ".open-next/assets"
  },
  "images": {
    "binding": "IMAGES"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "twisted"
    }
  ]
}
\`\`\`

## Future Bindings (Planned)

Once deployed, you can add these bindings via Cloudflare Dashboard:

### Storage
- **D1 Database:** Serverless SQL for product catalog
- **KV Storage:** Fast edge-cached reads for product data
- **R2 Object Storage:** Store product images with zero egress fees
- **Durable Objects:** Real-time cart/session management

### Compute
- **Workers AI:** Product recommendations, image analysis
- **Workflows:** Order processing automation
- **Vectorize:** Semantic search for products
- **Queues:** Order queue with guaranteed delivery

### External Integrations
- **Square Payments:** Via MCP server tools (planned)
- **Email Service:** Order confirmations
- **Analytics:** User behavior tracking

## After Deployment

Your site will be available at:
- **Workers:** `https://twisted.<YOUR_SUBDOMAIN>.workers.dev`
- **Custom Domain:** Configure in Cloudflare Dashboard > Workers > twisted > Triggers > Custom Domains

## Testing Locally (Without Cloudflare Runtime)

Since Windows has issues with workerd, test using standard Next.js:

\`\`\`bash
npm run dev
# Visit http://localhost:3000
\`\`\`

## Next Steps

1. Choose a deployment method (Dashboard upload recommended for Windows)
2. Deploy the worker
3. Configure custom domain (twistedcustomleather.com)
4. Add AI binding for future features
5. Set up Square MCP integration
6. Add product database (D1 or external)
7. Implement shopping cart with Durable Objects

## Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- OpenNext Cloudflare: https://opennext.js.org/cloudflare
- Windows Issues: https://github.com/cloudflare/workers-sdk/issues

---

**Built:** ✅
**Ready for Deployment:** ✅
**Deployment Method:** Choose from options above
