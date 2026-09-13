# Twisted Custom Leather - Western E-Commerce Landing Page

A Next.js-powered landing page for Twisted Custom Leather, featuring a western theme with video background, glowing effects, and rustic aesthetics. Deployed as a Cloudflare Worker named "Twisted".

## Features

- **Video Background**: Full-screen background video with overlay
- **Western Theme**: Rustic color palette (weathered wood, sage, copper, cream)
- **Satoshi Font**: Custom typography with glowing text effects
- **Glowing Cards**: Warm amber candlelight glow on product cards
- **Glass Morphism**: Semi-transparent UI elements
- **Responsive Design**: Mobile-first approach with smooth animations
- **Product Categories**: Wallets, Belts, Purses, Welding Gear, Bible Covers
- **YouTube Integration**: Embedded craftsman showcase video

## Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **Styling**: Tailwind CSS v4
- **Fonts**: Satoshi (self-hosted WOFF files)
- **Deployment**: Cloudflare Workers via OpenNext
- **Video**: Background.mp4 (15.9MB)

## Project Structure

```
tcl-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx             # Main landing page
│   │   └── globals.css          # Global styles, colors, animations
│   └── components/
│       ├── VideoBackground.tsx  # Full-screen video background
│       ├── Header.tsx           # Sticky navigation
│       ├── Hero.tsx             # Hero section with tagline
│       ├── ProductCard.tsx      # Reusable glowing card
│       ├── ProductSection.tsx   # Product grid layout
│       ├── YouTubeEmbed.tsx     # Video showcase
│       └── Footer.tsx           # Footer with links
├── public/
│   ├── background.mp4          # Western background video
│   ├── twisted.png             # Logo
│   └── fonts/satoshi/          # Self-hosted Satoshi fonts
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions deployment
├── wrangler.jsonc              # Cloudflare Worker configuration
└── next.config.ts              # Next.js configuration

```

## Local Development

### Prerequisites
- Node.js 22 (the version used by verification and deployment)
- npm or pnpm

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tcl-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

### Note on Windows
The Cloudflare workerd runtime has compatibility issues on Windows. For local development, the Cloudflare integration is disabled to use the standard Next.js server. The app works perfectly for development and will deploy correctly on Linux runners via GitHub Actions.

## Deployment

Custom-order publication is intentionally gated. See [docs/deployment-guide.md](docs/deployment-guide.md) for required Turnstile, Images, R2 lifecycle, rate-limit/WAF, Square, maintenance-reconciliation, and protected-environment checks.

### GitHub Actions (Recommended)

A push to `main` verifies the application but does not deploy it. Production deployment requires a manual `workflow_dispatch`, successful verification, and approval through the protected production environment. Configure the public `NEXT_PUBLIC_TURNSTILE_SITE_KEY` repository variable and the Cloudflare account/token secrets before requesting that approval. Follow [docs/deployment-guide.md](docs/deployment-guide.md) for every external and manual publication gate.

### Manual Deployment (Linux/WSL Only)

If you're on Linux or WSL:

```bash
# Install the locked dependency graph and run the same gates as CI
npm ci
npm test
npm run typecheck
npm run cf-typecheck
npm run build:opennext

# Login to Cloudflare
npx wrangler login

# Deploy
npx wrangler deploy --config wrangler.jsonc
```

## Worker Configuration

The worker is configured in `wrangler.jsonc`:

- **Name**: `twisted`
- **Runtime**: Cloudflare Workers (workerd)
- **Compatibility**: nodejs_compat flag enabled
- **Bindings**:
  - `ASSETS`: Static file serving
  - `IMAGES`: Image optimization and canonical reference-image conversion
  - `WORKER_SELF_REFERENCE`: Self-reference for caching
  - `DB`: D1 newsletter database
  - `ORDER_ASSETS`: Private R2 order intents, uploads, attempt-bound assets, and manifests
  - `ORDER_INTENT_RATE_LIMITER`: Order-session creation limits
  - `ORDER_UPLOAD_RATE_LIMITER`: Reference upload/removal limits
  - `ORDER_CHECKOUT_RATE_LIMITER`: Checkout creation limits

## Custom Domain

To add a custom domain (e.g., twistedcustomleather.com):

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Click on "twisted" worker
4. Go to "Triggers" tab
5. Add Custom Domain
6. Enter: `twistedcustomleather.com`
7. Cloudflare will automatically handle DNS

## Future Enhancements

### Possible Future Bindings
- **Workers AI**: Product recommendations, chat support
- **KV Storage**: Fast edge-cached product data
- **Durable Objects**: Shopping cart and sessions
- **Queues**: Order processing

### Planned Integrations
- **Square Payments**: MCP server for payment processing
- **Product Management**: Admin dashboard
- **User Authentication**: Customer accounts
- **Email Notifications**: Order confirmations

## Design System

### Colors
```css
/* Rustic Western Palette */
--wood-dark: #3a2f2f
--wood-medium: #5c4a3a
--wood-light: #8b7355
--sage: #9caf88
--sage-dark: #6b7d5c
--cream: #f5f1e8
--beige: #d4c5b0
--copper: #b87333
--copper-light: #d4a574
```

### Typography
- **Font**: Satoshi (self-hosted)
- **Headings**: font-weight 900, italic
- **Body**: italic styling
- **Effects**: Text glow, glitch animation, floating

### Animations
- **Text Glow**: Multi-layered shadows
- **Glitch**: Red/cyan text-shadow shifts on hover
- **Float**: Subtle vertical movement (3s loop)
- **Card Glow**: Warm amber glow intensifies on hover

## Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Build
npm run build        # Build Next.js app

# Deployment (via OpenNext)
npm run deploy       # Build + deploy to Cloudflare
npm run preview      # Build + preview locally
npm run upload       # Build + upload (no preview)

# Linting
npm run lint         # Run ESLint
```

## Troubleshooting

### Windows Deployment Issues
**Problem**: `MiniflareCoreError [ERR_RUNTIME_FAILURE]` or access violations

**Solution**: Use GitHub Actions for deployment. The Linux runners handle Cloudflare's workerd runtime correctly.

### Font Loading Issues
**Problem**: Fonts not loading

**Solution**: Verify font files exist in `public/fonts/satoshi/` and paths in `globals.css` are correct.

### Video Not Playing
**Problem**: Background video doesn't autoplay

**Solution**: Ensure `background.mp4` exists in `public/` and video element has `muted` and `playsInline` attributes.

## License

All rights reserved - Twisted Custom Leather

## Contact

For questions about this project:
- Domain: twistedcustomleather.com
- GitHub: TwistedCustomLeather/tcl-app

---

Built with Next.js 15, Tailwind CSS v4, and deployed to Cloudflare Workers
