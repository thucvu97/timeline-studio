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

## Build and Deploy

1. Build the project:
```bash
cd promo
npm run build
```

2. Deploy the `dist` folder to your hosting provider

## Testing Locally

```bash
cd promo
npm run build
npm run preview
```

Then try accessing http://localhost:4173/changelog directly