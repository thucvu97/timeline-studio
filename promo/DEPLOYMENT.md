# Deployment Guide for Timeline Studio Promo Site

## GitHub Pages Deployment

The promo site is optimized for GitHub Pages hosting with the following configuration:

### HashRouter Implementation
The site uses React HashRouter instead of BrowserRouter to ensure compatibility with GitHub Pages static hosting. This means:
- All routes use hash navigation: `#/changelog`, `#/pricing`, `#/blog`, etc.
- Page refresh works correctly on all routes
- No additional server configuration needed

### Required Files
- `404.html` - Copy of index.html for fallback routing
- Standard build output in `dist/` folder

### Deployment Process
1. Build the project:
```bash
cd promo
bun run build
```

2. The `dist` folder is ready for GitHub Pages deployment

### URL Structure
- Homepage: `https://timelinestudio.pro/`
- Changelog: `https://timelinestudio.pro/#/changelog`
- Pricing: `https://timelinestudio.pro/#/pricing`
- Blog: `https://timelinestudio.pro/#/blog`
- About: `https://timelinestudio.pro/#/about`
- Docs: `https://timelinestudio.pro/#/docs`

## Content Synchronization

### Changelog Updates
The changelog content is automatically synchronized from the main repository's CHANGELOG.md file using semantic-release. The process works as follows:

1. **Automatic Updates**: When new releases are created, semantic-release updates CHANGELOG.md
2. **Sync Script**: The `scripts/sync-changelog.js` copies CHANGELOG.md to `promo/content/changelog/latest.md`
3. **Build Process**: During build, content files are copied from `content/` to `public/content/`
4. **GitHub Actions**: The deploy workflow automatically syncs changelog on every push

### Manual Sync
If you need to manually sync the changelog:
```bash
node scripts/sync-changelog.js
```

## Build and Deploy

1. Prepare content files:
```bash
cd promo
mkdir -p public/content
cp -r content/changelog public/content/
```

2. Build the project:
```bash
npm run build
```

3. Deploy the `dist` folder to your hosting provider

## Testing Locally

```bash
cd promo
# Sync changelog if needed
node ../scripts/sync-changelog.js

# Prepare content
mkdir -p public/content
cp -r content/changelog public/content/

# Build and preview
npm run build
npm run preview
```

Then try accessing http://localhost:4173/changelog directly

## Troubleshooting

### Changelog not showing up
1. Check if `CHANGELOG.md` exists in the root directory
2. Run the sync script: `node scripts/sync-changelog.js`
3. Verify files in `promo/content/changelog/`
4. Ensure content is copied to `public/content/` before build
5. Check browser console for 404 errors on `/content/changelog/latest.md`

### GitHub Actions deployment
The deployment workflow is triggered by:
- Changes to `promo/**` files
- Changes to `CHANGELOG.md`
- Manual workflow dispatch

The workflow automatically handles content synchronization.