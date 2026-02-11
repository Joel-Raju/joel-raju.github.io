# joelraju.com

Personal blog built with [Zola](https://www.getzola.org/) and [Tailwind CSS](https://tailwindcss.com/) (standalone CLI).

## Prerequisites

- [Zola](https://www.getzola.org/documentation/getting-started/installation/) (v0.19+)
- [Tailwind CSS standalone CLI](https://tailwindcss.com/blog/standalone-cli) — no Node.js required

## Local Development

1. **Build Tailwind CSS**

   ```bash
   ./tailwindcss -i tailwind-input.css -o static/tailwind.css --minify
   ```

   ```bash
   ./tailwindcss -c ./tailwind.config.js -i ./tailwind-input.css -o ./static/tailwind.css --watch
   ```

2. **Start Zola dev server**

   ```bash
   zola serve
   ```

3. **Watch mode** (run both in separate terminals for hot reload)

   ```bash
   # Terminal 1 — Tailwind watch
   ./tailwindcss -i tailwind-input.css -o static/tailwind.css --watch

   # Terminal 2 — Zola serve
   zola serve
   ```

   Site will be available at `http://127.0.0.1:1111`.

## Project Structure

```
├── content/
│   ├── blog/           # Blog posts
│   ├── collections/    # Curated lists
│   └── now.md          # /now page
├── static/
│   ├── images/         # Static images referenced in posts
│   ├── tailwind.css    # Generated — do not edit directly
│   └── robots.txt
├── templates/          # Zola Tera templates
├── tailwind-input.css  # Tailwind source with custom styles
├── tailwind.config.js  # Tailwind configuration
└── zola.toml           # Zola site configuration
```

## Adding Content

### Blog post

Create a new `.md` file in `content/blog/`:

```toml
+++
title = "My New Post"
date = 2026-01-01
description = "A short description."

[taxonomies]
tags = ["tag1", "tag2"]
+++

Your markdown content here.
```

### Images

Place images in `static/images/blog/<post-name>/` and reference them in markdown:

```markdown
![Alt text](/images/blog/<post-name>/image.png)
```

## Deploy to Netlify

### Option 1: Netlify UI

1. Push this repo to GitHub.
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
3. Connect your GitHub repo and select the branch (e.g. `v2`).
4. Set build settings:
   - **Build command:** `./tailwindcss -i tailwind-input.css -o static/tailwind.css --minify && zola build`
   - **Publish directory:** `public`
5. Under **Environment variables**, add:
   - `ZOLA_VERSION` = `0.19.2` (or your preferred version)
6. Click **Deploy site**.

### Option 2: `netlify.toml`

Add a `netlify.toml` to the repo root (see below), then connect the repo in Netlify — it will pick up the config automatically.

```toml
[build]
  command = "tailwindcss -i tailwind-input.css -o static/tailwind.css --minify && zola build"
  publish = "public"

[build.environment]
  ZOLA_VERSION = "0.19.2"

[context.deploy-preview]
  command = "tailwindcss -i tailwind-input.css -o static/tailwind.css --minify && zola build --base-url $DEPLOY_PRIME_URL"
```

### Custom domain

1. In Netlify → **Domain management** → **Add custom domain**.
2. Add `www.joelraju.com` and follow the DNS instructions.
3. Enable HTTPS under **SSL/TLS certificate**.
