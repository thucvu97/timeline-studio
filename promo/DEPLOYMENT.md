# Deployment Guide for Timeline Studio Promo Site

## Problem
When you refresh the page on routes like `/changelog`, `/blog`, etc., you get a blank page or 404 error. This is because the server doesn't know how to handle SPA routes.

## Solution by Hosting Provider

### Netlify
Already configured with `_redirects` file in public folder:
```
/*    /index.html   200
```

### Vercel
Already configured with `vercel.json` in public folder:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### GitHub Pages
Already configured with `404.html` (copy of index.html)

### Apache Server
Already configured with `.htaccess` in public folder

### Nginx
Use the provided `nginx.conf` configuration:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Cloudflare Pages
Should work automatically with the SPA mode

### Firebase Hosting
Use the provided `firebase.json` configuration

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