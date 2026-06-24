# 🐝 Brainy Bees Summer Camp — Complete Deployment Guide

## What You Need (Total Cost: ~$10–22/year)

| Item | Provider | Cost |
|------|----------|------|
| Domain (brainybeescamp.ca) | Cloudflare Registrar | ~$12/yr |
| Website Hosting | Cloudflare Pages | FREE |
| Form Backend (Worker) | Cloudflare Workers | FREE (100k req/day) |
| Database (registrations) | Cloudflare KV | FREE |
| Email sending | Resend.com | FREE (3,000/mo) |
| Analytics | Cloudflare Analytics | FREE |
| SSL Certificate | Cloudflare | FREE |

**Total: ~$12/year** (just the domain)

---

## STEP 1 — Create Your Accounts (15 minutes)

### 1a. Cloudflare Account (FREE)
1. Go to **https://cloudflare.com**
2. Click "Sign Up" → use your business email
3. Verify your email address
4. You now have access to: Pages, Workers, KV, Analytics, DNS, Registrar

### 1b. Resend Account (FREE — for emails)
1. Go to **https://resend.com**
2. Sign up with your email
3. Go to API Keys → Create API Key → copy it (save it — shown only once!)
4. Free plan: 3,000 emails/month (more than enough)

### 1c. GitHub Account (FREE — for deployment pipeline)
1. Go to **https://github.com**
2. Sign up (free)
3. Create a new repository named `brainy-bees`
4. Set it to Private

---

## STEP 2 — Buy Your Domain (10 minutes)

### Why Cloudflare Registrar?
- **Cheapest renewal prices** (at-cost, no markup)
- Free WHOIS privacy included
- Auto-renews, no surprise fees
- Same dashboard as your hosting

### Buy brainybeescamp.ca
1. Log into **dash.cloudflare.com**
2. Left sidebar → **Domain Registration** → **Register Domains**
3. Search: `brainybeescamp.ca`
4. Add to cart → Checkout
5. Fill in registrant info (your real name/address — required by CIRA for .ca)
6. Enable **Auto-Renew** ✅
7. Pay (~$12 CAD)

### Domain Comparison

| Registrar | .ca First Year | .ca Renewal | Privacy | Notes |
|-----------|---------------|-------------|---------|-------|
| **Cloudflare ✅** | ~$12 | ~$12 | FREE | Best overall, same dashboard |
| Porkbun | ~$8 | ~$10 | FREE | Good alternative |
| Namecheap | ~$10 | ~$15 | ~$5/yr | More expensive renewal |
| GoDaddy | ~$3 promo | ~$20+ | ~$10/yr | Avoid — bait-and-switch pricing |

**Recommended domain priority:**
1. `brainybeescamp.ca` ← best for local SEO
2. `brainybeescamp.com` ← buy both if possible (~$10 more/yr)

---

## STEP 3 — Set Up Cloudflare Pages (20 minutes)

### 3a. Upload your website files
**Option A — Direct Upload (easiest, no GitHub needed):**
1. Go to **dash.cloudflare.com**
2. Left sidebar → **Pages** → **Create a project**
3. Click **"Upload assets"**
4. Name your project: `brainy-bees`
5. Drag and drop your `index.html` file (and any other files)
6. Click **Deploy site**
7. You'll get a URL like `brainy-bees.pages.dev` — your site is LIVE!

**Option B — GitHub (recommended for ongoing updates):**
1. Push the project folder to your GitHub repo
2. In Cloudflare Pages → **Connect to Git**
3. Select your repository
4. Build settings:
   - Build command: `npm run build` (or leave blank for plain HTML)
   - Build output directory: `dist` (or `.` for plain HTML)
5. Click **Save and Deploy**
6. Every time you push to GitHub, site auto-deploys ✅

### 3b. Connect your domain
1. In your Pages project → **Custom Domains**
2. Click **Set up a custom domain**
3. Enter: `brainybeescamp.ca`
4. Also add: `www.brainybeescamp.ca`
5. Cloudflare auto-configures DNS (since domain is also on Cloudflare)
6. SSL certificate issues automatically ✅

---

## STEP 4 — Set Up the Form Backend (30 minutes)

### 4a. Create KV Namespace (stores registrations)
Run in terminal (after installing Node.js and wrangler):
```bash
npm install -g wrangler
wrangler login
wrangler kv:namespace create "REGISTRATIONS"
```
Copy the `id` output and paste it into `wrangler.toml` where it says `YOUR_KV_NAMESPACE_ID_HERE`

### 4b. Add your email secret
```bash
wrangler secret put RESEND_API_KEY
# Paste your Resend API key when prompted
```

### 4c. Deploy the Worker
```bash
wrangler deploy workers/registration.js
```
You'll get a URL like: `brainy-bees-registration.YOUR-ACCOUNT.workers.dev`

### 4d. Update the website form
In `index.html`, find the `submitForm()` function and update the fetch URL:
```javascript
// Replace this line in submitForm():
const response = await fetch('https://brainy-bees-registration.YOUR-ACCOUNT.workers.dev', {
```

### 4e. Set up email routing (receive emails at info@brainybeescamp.ca)
1. Cloudflare Dashboard → **Email** → **Email Routing**
2. Enable Email Routing for your domain
3. Add a rule: `info@brainybeescamp.ca` → forwards to `your-personal@gmail.com`
4. This gives you a professional email address FREE

---

## STEP 5 — View Your Registrations (Admin Dashboard)

### Option A — Cloudflare Dashboard
1. Cloudflare Dashboard → Workers & Pages → KV
2. Click your REGISTRATIONS namespace
3. Browse all submitted registrations as JSON

### Option B — Build a simple admin page
Create `admin.html` in your project (password protected) to view registrations in a table format. Ask me to build this for you!

---

## STEP 6 — Analytics Setup (15 minutes)

### Cloudflare Web Analytics (FREE, privacy-friendly)
1. Cloudflare Dashboard → **Web Analytics**
2. Add your site
3. Copy the `<script>` snippet
4. Paste it before `</head>` in your `index.html`
5. Done — see visitors, page views, top countries instantly

### Google Analytics 4 (optional, more detailed)
1. Go to **analytics.google.com**
2. Create account → Property (Web)
3. Copy your Measurement ID (G-XXXXXXXXXX)
4. Add to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Meta Pixel (for Facebook/Instagram ads)
1. Go to **business.facebook.com** → Events Manager
2. Create Pixel → copy Pixel ID
3. Add to `index.html` before `</head>`:
```html
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

---

## STEP 7 — SEO Setup (20 minutes)

### robots.txt
Create file at root:
```
User-agent: *
Allow: /
Sitemap: https://brainybeescamp.ca/sitemap.xml
```

### sitemap.xml
Create file at root:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://brainybeescamp.ca/</loc><priority>1.0</priority></url>
  <url><loc>https://brainybeescamp.ca/#programs</loc><priority>0.9</priority></url>
  <url><loc>https://brainybeescamp.ca/#register</loc><priority>0.9</priority></url>
</urlset>
```

### Google Search Console
1. Go to **search.google.com/search-console**
2. Add property → URL prefix → `https://brainybeescamp.ca`
3. Verify via Cloudflare DNS (add TXT record Cloudflare shows you)
4. Submit sitemap
5. Start tracking search rankings!

### Google Business Profile (FREE local SEO — very important!)
1. Go to **business.google.com**
2. Add your business: Brainy Bees Summer Camp
3. Category: Summer Camp / Educational Institution
4. Address: 85 Ellesmere Rd, Unit 205, Scarborough, ON M1R 4B7
5. Phone: 647-713-2781
6. Website: brainybeescamp.ca
7. Verify (they mail a postcard OR call you)
8. This makes you appear on Google Maps and local searches! ⭐

---

## STEP 8 — Go-Live Checklist

Before announcing your website, check every item:

**Website**
- [ ] Site loads at brainybeescamp.ca
- [ ] SSL lock shows (https://)
- [ ] Mobile responsive (test on phone)
- [ ] All nav links work
- [ ] Phone number is clickable on mobile
- [ ] Registration form submits and shows success message
- [ ] You receive the confirmation email
- [ ] Camp receives the notification email

**SEO & Analytics**
- [ ] Google Analytics tracking (check real-time tab)
- [ ] Google Search Console verified
- [ ] Sitemap submitted
- [ ] Google Business Profile live
- [ ] Meta description showing correctly

**Performance**
- [ ] Run Lighthouse: right-click page → Inspect → Lighthouse tab → Analyze
- [ ] Score 90+ on Performance, SEO, Accessibility

**Content**
- [ ] Phone number correct: 647-713-2781
- [ ] Address correct: 85 Ellesmere Rd, Unit 205, Scarborough, ON M1R 4B7
- [ ] Instagram link correct: @brainy_bees_
- [ ] Dates correct: July 6 – August 28
- [ ] Price correct: $175/week

---

## STEP 9 — Marketing Launch Plan

### Week 1 — Soft Launch
- Share link with friends and family for feedback
- Post on your personal Facebook/Instagram
- Ask 5 people to submit test registrations

### Week 2 — Local Push  
- Post in Facebook Groups: Scarborough Parents, Agincourt Community, North York Families
- Post on NextDoor (Scarborough neighbourhoods)
- Drop flyers at nearby schools, daycares, community centres
- Post on Kijiji under "Children's Activities"

### Week 3 — Paid Ads (optional, $10–20/day budget)
- **Facebook/Instagram Ad**: Target Scarborough parents, ages 25–45, with children
- **Google Search Ad**: Keywords "summer camp Scarborough", "kids camp Toronto"
- Both platforms let you set $10/day maximum — cancel anytime

### Ongoing
- Post weekly on Instagram (@brainy_bees_): activities, behind-the-scenes, countdown to camp
- Encourage registered parents to leave Google Reviews
- Referral program: give current parents a discount code for referrals

---

## Cost Summary

| Item | One-Time | Annual |
|------|----------|--------|
| Domain (brainybeescamp.ca) | — | ~$12 |
| Cloudflare hosting | FREE | FREE |
| Worker + KV + Analytics | FREE | FREE |
| Email sending (Resend) | FREE | FREE |
| Email receiving (Cloudflare) | FREE | FREE |
| Google Analytics | FREE | FREE |
| Google Business Profile | FREE | FREE |
| **TOTAL** | **$0** | **~$12/year** |

Optional paid upgrades:
- Second domain (.com): ~$10/year
- Facebook/Instagram ads: $10–50/day (your choice)
- Google ads: $10–30/day (your choice)

---

## Support

If you get stuck on any step, these resources help:

- **Cloudflare Pages docs**: developers.cloudflare.com/pages
- **Wrangler CLI docs**: developers.cloudflare.com/workers/wrangler
- **Resend email docs**: resend.com/docs
- **Video tutorial**: Search "Cloudflare Pages tutorial 2024" on YouTube

Or reach out — happy to help troubleshoot any specific step!
