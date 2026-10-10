# Keystone Constructions website — deployment notes

Static site, no build step required. Upload the contents of this folder to the web root of any host
(Netlify, Vercel, Cloudflare Pages, cPanel/Apache, Nginx, S3 + CloudFront).

## Structure
- `index.html`, `our-work/`, `the-journey/`, `about/`, `contact/`, `thank-you/`, `404.html`
- `assets/css`, `assets/js`, `assets/img` (JPG + WebP, responsive sizes), `assets/video`, `assets/icons`
- `sitemap.xml`, `robots.txt`, `llms.txt`, `site.webmanifest`
- Host configs: `.htaccess` (Apache), `_headers` + `_redirects` (Netlify/Cloudflare Pages), `vercel.json` (Vercel). Keep the one you need; the others are harmless.

## Domain
The site is built for https://kscbuild.com (canonical URLs, sitemap, Open Graph). If the domain changes,
rebuild with the new DOMAIN or search-and-replace `https://kscbuild.com` in the HTML, sitemap and llms.txt.

## Contact form (sends to support@kscbuild.com)
The inquiry form posts to FormSubmit (https://formsubmit.co), which forwards each submission to
support@kscbuild.com. Nothing to install, but one step is required:

1. After the site is live, submit the form once.
2. FormSubmit emails support@kscbuild.com an **activation link**. Click it. From then on every
   submission arrives in that inbox (subject "New inquiry from kscbuild.com", fields in a table),
   the sender gets an automatic confirmation, and spam is filtered by the hidden honeypot field.

With JavaScript the form submits in place and redirects to /thank-you/; without JavaScript it posts
directly to FormSubmit, which then redirects back to /thank-you/.

If you later prefer another service (Netlify Forms, Basin, Formspree, HubSpot), change the `action`
and `data-ajax` attributes on `<form id="inquiry-form">` in `contact/index.html`.

## After launch
- Submit `https://kscbuild.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Create / claim the Google Business Profile with the same name, address and phone used on the site.
- Replace the client testimonial only with written approval on file; add more inside the
  `.testimonials .track` block on the Home and Journey pages.
