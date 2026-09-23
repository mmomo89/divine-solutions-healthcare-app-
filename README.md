# Divine Solutions Healthcare LLC \u2014 Website + CMS

A full-stack recreation of the Divine Solutions Healthcare LLC website, built from
the supplied source HTML exports, plus a real admin CMS.

- **Frontend:** React + TypeScript + Vite + React Router
- **Backend:** Django + Django REST Framework + PostgreSQL
- **Auth:** JWT (djangorestframework-simplejwt), role-based (Super Admin / Content Admin)
- **PDF:** Server-generated with ReportLab (real files, not browser print)
- **Storage:** Django FileField (local disk by default; swap `DEFAULT_FILE_STORAGE` for S3 in production)

## What was preserved from the source HTML

All 7 supplied pages (Home, About Us, Ohio Office Services, North Dakota Office
Services, Careers, Resources, Contact Us) were parsed for their exact copy,
nav/footer links, contact details, the 7-item Values list, the Ohio/ND service
cards, the Resources list, and the real hero/service photos (extracted from the
base64-embedded images in the export, including the 1920\u00d7600 About Us and
Ohio hero images). That content is loaded into the database by the
`seed_content` management command \u2014 see below.

A handful of destination links referenced by the source site (Request Brochure,
Billing Questions, Insurance Verification, Request a Consultation, and the
individual Ohio/ND service detail pages) did not have full page exports
supplied. Per the project brief, those routes exist and are CMS-editable, but
no substantial content was invented for them beyond the one-line descriptions
that appeared on their source link cards.

## Going live (production deploy)

The project ships with a standalone production stack (`docker-compose.prod.yml`)
that adds [Caddy](https://caddyserver.com/) in front of the app for automatic
HTTPS (free Let's Encrypt certificates, renewed automatically) and stops
exposing Postgres/Django directly to the internet \u2014 only ports 80/443 are
public; everything else is only reachable inside the Docker network.

**On your VPS** (a $6\u201312/mo box from DigitalOcean, Hetzner, Linode, etc. is
plenty):

1. Point your domain's DNS A record at the server's IP address first \u2014 Caddy
   needs this to succeed before it can request a certificate.
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Get the project onto the server (`git clone` your repo, or `scp -r` the folder).
4. `cp .env.production.example .env` and fill in real values \u2014 a random
   `DJANGO_SECRET_KEY` (generate one with `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`),
   a strong `POSTGRES_PASSWORD`, and your actual domain.
5. Run `./deploy.sh` \u2014 it builds the images, starts the stack, runs migrations,
   and seeds the content.
6. Immediately change the seeded admin passwords (the script prints the exact
   commands at the end).

To redeploy after making changes:
```bash
git pull   # or re-upload changed files
docker compose -f docker-compose.prod.yml up -d --build
```

To view logs:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

## Quick start (Docker, local development)

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:8000/api
- Django admin (superuser tooling): http://localhost:8000/admin/django/

Then, in a second terminal, run migrations + seed the database:

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_content
```

This creates two admin accounts (**change these passwords immediately**):

| Username        | Password       | Role           |
|------------------|----------------|----------------|
| `superadmin`     | `ChangeMe123!` | Super Admin    |
| `contentadmin`   | `ChangeMe123!` | Content Admin  |

Log in at http://localhost:8080/admin/login.

## Quick start (local, no Docker)

**Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# start a local Postgres and create a `divine_solutions` database, or edit .env
cp .env.example .env
python manage.py migrate
python manage.py seed_content
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173. The API base URL is set in `frontend/.env`
(`VITE_API_URL`).

## Project structure

```
backend/
  config/          Django project settings/urls
  cms/             Models, serializers, views, permissions, PDF util, seed command
  seed_assets/     Real photos extracted from the source HTML exports
frontend/
  src/api/         Axios client with JWT auth + refresh
  src/context/     Auth + site-data (settings/navigation) React contexts
  src/components/  public/ (Header, Footer, Hero, forms, cards\u2026) and admin/ (layout)
  src/pages/       public/ (7 main pages + generic/service-detail/404) and admin/ (CMS screens)
  src/styles/      global.css (public site design tokens) and admin.css (CMS UI)
```

## CMS feature map

- **Dashboard** \u2014 page/submission/resource/service counts, recent submissions, recent activity
- **Pages** \u2014 section-based editor (heading/subheading/body/CTA per section, visibility, sort order), draft/published/archived, live Preview link
- **Services** \u2014 CRUD, image upload, region (Ohio/ND/Home), publish state, sort order
- **Resources** \u2014 CRUD, external link, publish state
- **Form Submissions** \u2014 filter by status/type, search, status workflow (New \u2192 Read \u2192 In Progress \u2192 Completed \u2192 Archived), admin notes, **email reply directly to the applicant/customer** (recorded as a correspondence thread), **Print** view, **Download PDF** (server-generated), **CSV export**
- **Media Library** \u2014 upload, alt text, delete
- **Navigation** \u2014 edit header/footer link labels, URLs, order, visibility
- **Site Settings** \u2014 company info, social links, footer/copyright, SEO defaults
- **Users** (Super Admin only) \u2014 view admin accounts and roles
- **Activity Log** \u2014 logins, content edits, submission status changes, PDF generation, CSV exports

## Security notes for production

- Set a real `DJANGO_SECRET_KEY` and `DJANGO_DEBUG=False`
- Put the backend behind HTTPS; update `CORS_ALLOWED_ORIGINS`/`CSRF_TRUSTED_ORIGINS`
- Change the seeded admin passwords immediately (`python manage.py changepassword <username>`)
- The public contact/careers form endpoint is rate-limited (5/min per IP) and includes
  a honeypot field + a minimum-time-to-submit check on the frontend; consider adding
  hCaptcha/Turnstile for additional bot protection at scale
- Swap local `MEDIA_ROOT` storage for S3/GCS via `django-storages` for horizontal scaling

## Recently added

- **North Dakota office info added to Contact page** \u2014 matches the
  "Contact Our North Dakota Office" card (Fargo Office + Registered
  Address + all three phone numbers) already used on the North Dakota
  Services page, added to the Contact Us page too via the existing
  `OfficeInfo` component. Fully editable from **Pages \u2192 Contact Us** in
  the admin dashboard, same as any other section.
- **Render deployment support + real production-readiness fixes** \u2014 found
  and fixed two genuine bugs while preparing for deployment, verified both
  live rather than just patched:
  - **Media files were 404ing in any real production environment.**
    `urls.py` used Django's `static()` helper, which has `if not
    settings.DEBUG: return []` baked into it *internally* \u2014 so no uploaded
    hero image, media library file, or resume would have ever loaded once
    `DJANGO_DEBUG=False` (which is required \u2014 the app now refuses to start
    otherwise). Fixed by registering the view directly instead of going
    through that helper. Verified with a real HTTP request against a
    freshly uploaded file with `DEBUG=False`: `200`, confirmed via the
    resolver that the URL pattern is actually registered in both modes.
  - **Static files (Django admin CSS/JS) had nothing serving them** in
    production \u2014 no separate nginx/CDN layer on a platform like Render.
    Added WhiteNoise; verified `collectstatic` runs cleanly and serves
    compressed, cache-busted files.
  - **Added `/api/health/`** \u2014 checks actual database connectivity (not
    just "the process is alive"), for Render's health checks and any
    uptime monitor. Verified returns `200`.
  - **`DATABASE_URL` support** (via `dj-database-url`) alongside the
    existing `POSTGRES_*` vars \u2014 Render (and Heroku/Railway) provide a
    single connection string rather than separate host/user/password.
    Verified both paths connect correctly, including SSL against Render's
    managed Postgres requirement.
  - **Dockerfile now binds to `$PORT`** (Render assigns this dynamically)
    with a `:-8000` fallback so local `docker-compose` usage is unaffected
    \u2014 verified both cases resolve correctly. Worker count now configurable
    via `WEB_CONCURRENCY`.
  - **`render.yaml`** (new file, project root) \u2014 a Render Blueprint that
    defines all three services (Postgres, backend, frontend) for one deploy.
    Validated as correct YAML. See the deployment steps in the chat reply
    that shipped this change.

- **Security hardening pass** \u2014 implemented and verified live:
  - **Startup safety check**: the app now refuses to start with
    `DJANGO_DEBUG=False` if `DJANGO_SECRET_KEY` is still the placeholder
    value \u2014 a hard crash with a clear error, not a silent "works but
    less securely" state. Verified: crashes correctly with the default key,
    starts fine in normal dev mode.
  - **Account lockout**: after 5 failed login attempts on one account, it's
    locked for 30 minutes (`423 Locked`) \u2014 independent of, and in addition
    to, the existing per-IP rate limit, so a distributed attack against one
    username is still caught. Verified live: 5 failed attempts, then a 6th
    attempt with the *correct* password is still blocked with 423, proving
    it's a real lockout and not just a credential check.
  - **Security response headers**: added `Content-Security-Policy`,
    `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, and
    `X-Frame-Options: DENY` (via a small custom middleware,
    `cms/middleware.py`, plus Django's built-in `SecurityMiddleware`).
    In production (`DEBUG=False`) this also enables HSTS, forces HTTPS
    redirects, and marks session/CSRF cookies secure-only \u2014 correctly
    accounts for Caddy terminating TLS and proxying over plain HTTP
    internally, via `SECURE_PROXY_SSL_HEADER`. Verified: all headers present
    on live API responses.
  - Also fixed a **real latent bug** found while implementing this: the
    previous login view's failed-attempt logging was dead code \u2014
    `TokenObtainPairView.post()` raises an exception on bad credentials
    rather than returning a non-200 response, so the `else` branch that
    logged failed attempts could never actually execute. Now properly
    wrapped in try/except.
  - Added `must_change_password` tracking: when a Super Admin resets
    someone's password directly, that user is flagged until they change it
    themselves (cleared automatically via the self-service password change).
  - **Still outstanding** (flagged, not yet implemented): MFA/2FA for admin
    accounts, and moving JWT storage from `localStorage` to httpOnly cookies.
    Both are larger changes worth scoping separately if wanted.
- **North Dakota services enriched from the state DHS brochure** \u2014 examined
  the uploaded "Developmental Disabilities Services" brochure (North Dakota
  Human Services). Its "Family Support Services" section directly matched
  three existing services (In-Home Supports/Respite, Extended Home Health
  Care, Family Care Option) \u2014 their descriptions were rewritten with the
  real detail from the brochure. It also revealed **two service types that
  weren't listed at all**: Self-Directed Supports and Parenting Supports \u2014
  both added as new North Dakota services with their own detail pages,
  images, and grid cards. (Note: the brochure's "Contact Information" list
  is the *state's* own regional intake offices, not Divine Solutions'
  offices \u2014 deliberately not merged into your own office contact info.)
  `ServiceDetail.tsx` was also updated to render multi-paragraph
  descriptions properly (the richer content needed it). All of this was
  already, and remains, editable from **Services** in the admin dashboard \u2014
  verified live: edited a service's description via the API and confirmed
  it updated immediately on the public site. The description field there
  now has more room (6 rows instead of 3) to reflect that content is
  meant to be fuller than a one-line teaser.
- **Custom, hard-to-guess admin login path** \u2014 the admin area's base path is
  now configurable via `VITE_ADMIN_PATH` (frontend) instead of hardcoded to
  `/admin`. Set it to something private before deploying, e.g.
  `VITE_ADMIN_PATH=mgmt-7f2a91` moves the login to `/mgmt-7f2a91/login`
  instead of the very guessable `/admin/login`. Verified: the custom value
  correctly bakes into the production build. The separate built-in Django
  admin (`DJANGO_ADMIN_PATH`) is independently configurable too, off its
  default `/admin/django/`. This is one layer of defense against casual/
  automated scanners \u2014 it doesn't replace real auth, which is still fully
  enforced server-side regardless of which path reaches it. Also added,
  since we were hardening this area anyway: a dedicated, stricter rate limit
  on the login endpoint itself (8 attempts/minute, separate from the general
  API rate limit) \u2014 verified live: rapid-fire bad logins correctly get
  cut off with 429 after the limit \u2014 plus failed login attempts are now
  logged to the Activity Log for security monitoring.
- **Home page services replaced with North Dakota services** \u2014 the "What
  we Do / Services We Offer" section on the Home page previously linked to
  three Ohio-flavored cards (Share Living, Community Transition, View More
  Services). Replaced with all of your actual North Dakota Office Services
  (Residential Services, Independent Day Habilitation, Prevocational
  Services, and the three Family Support Services), each linking to its own
  real service detail page \u2014 reusing the same `ServiceGrid`/`ServiceDetail`
  infrastructure already used on the North Dakota Office Services page
  itself, so no new page-rendering logic was needed. Verified via the live
  API that the Home page now serves this section correctly.
- **Full page-builder and navigation management** \u2014 Super Admins (and
  Content Admins, for everything except Users) can now:
  - **Create menu items** from scratch (Navigation page) \u2014 link to any
    existing page via a picker, or a custom URL; upload a small icon/graphic
    per item; set header vs. footer, order, visibility, and open-in-new-tab;
    delete items.
  - **Create brand-new pages** (Pages page) \u2014 title, URL slug (auto-generated
    from the title if left blank), breadcrumb label, and draft/published
    status. Lands directly in the page editor afterward. Delete pages too
    (cascades to their sections).
  - **Add and delete sections** on any page (Text, Intro, CTA, Card Grid, or
    Custom) directly from the page editor \u2014 previously the editor could only
    modify sections that already existed from the initial seed; there was no
    way to add new content blocks to a page at all.
  - **Attach an image or icon to any section** (or a page's hero) via upload,
    with a remove option \u2014 previously the editor only exposed text fields.
  - **Set an Anchor ID on any section**, letting a menu item or CTA link
    directly to that exact spot on the page (e.g. `/about-us#mission`) rather
    than just the top of the page. Generalized from the one hardcoded
    `#mission` anchor that only existed on the About Us page before \u2014 now
    works for any section, on any page, including brand-new ones.
  - `GenericPage.tsx` (the renderer for any page without a bespoke layout \u2014
    which is what every newly created page uses) was also fixed to render
    **all** of a page's sections in order, rather than only the first "text"
    and first "cta" section it found \u2014 a real gap, since it would have
    silently dropped any additional sections an admin added.
  - Verified end-to-end: created a page, added a section with an anchor ID,
    confirmed it in the public API, created a nav item linking to that page,
    confirmed it appears in the live header navigation, then cleanly deleted
    both the nav item and the page.
- **New admin users set their own password via a one-time invitation link**
  instead of a Super Admin typing a password for them. Creating a user now
  only asks for username, email, and role; the system generates a secure
  one-time token, emails a setup link (`/admin/set-password/<token>`), and
  also displays it directly in the Users page (handy since email defaults
  to the console backend in dev). The new user's account has no usable
  password until they visit that link and choose their own \u2014 verified:
  login attempts before setup correctly fail, the link is single-use
  (a second attempt returns 404), and it expires after 7 days. Super Admins
  can **resend** the invitation for anyone who hasn't completed setup yet.
  The existing "Reset Password" action (Super Admin sets a password
  directly) remains available separately, for account-recovery situations
  on existing users who've already completed setup.
- **Full admin user management** \u2014 Super Admins can now create new admin
  users (username, email, password, role) directly from the CMS, edit
  existing users (role, active status, email), and reset any user's
  password without needing their current password (`Users` in the sidebar).
  Every admin \u2014 Super Admin or Content Admin \u2014 can also self-manage their
  own account under the new **My Account** page: change their own username/
  email freely, and change their own password (requires entering their
  current password first). Safety guards, verified working: a Super Admin
  cannot delete their own account, cannot demote themselves out of the
  Super Admin role, and a Content Admin cannot escalate their own role via
  the self-service profile endpoint (role changes only ever happen through
  the Super-Admin-only Users page). All of this is logged to the Activity
  Log (user created/updated/deleted, password changed, password reset by
  admin).
- **Fixed the real bug behind "the Careers form isn't displaying"** \u2014 the
  scroll-reveal animation used a percentage-based intersection threshold
  (15% of the element's area had to be visible before it faded in). That
  works fine for normal-sized sections, but the Careers application form is
  now huge (~50 fields, many screens tall) \u2014 mathematically, 15% of its
  total area can never be visible in a normal browser viewport at once, so
  the reveal condition was **never met** and the form stayed at
  `opacity: 0` permanently. Fixed the `useReveal` hook to trigger on any
  intersection at all (not a percentage), and additionally stopped wrapping
  the form itself in a scroll-reveal (a long form shouldn't hide-and-seek
  with scrolling anyway \u2014 better UX regardless of the underlying fix).
  This was a genuine, reproducible bug that DOM-presence checks alone
  couldn't catch (the content was always in the DOM, just invisible via CSS).
- **Admin sessions now time out instead of persisting indefinitely** \u2014
  previously, JWT refresh tokens rotated on every use (7-day lifetime,
  endlessly renewed by any activity), so an active admin effectively never
  got logged out. Now: access tokens expire after 1 hour, refresh tokens are
  **not** rotated and expire 12 hours after login (a firm absolute session
  cap, not extended by activity), and the frontend additionally auto-logs-out
  after 20 minutes of no mouse/keyboard/scroll/touch activity, showing "You
  were signed out after a period of inactivity" on the login page.

- **Country-code phone selector** \u2014 added a reusable `PhoneInput`
  component (flag + dial code dropdown, ~30 common countries, US first as
  the default) and wired it into all four phone fields on the careers
  application form: the applicant's main phone and each of the three
  employment-history employer phone fields. Submits as a combined value
  (e.g. `+1 6145550100`) \u2014 verified working with both a US number and an
  international one.
- **Careers page now has the real, complete application form** \u2014 rebuilt
  from a screenshot of the live site's actual form widget (the crawlable HTML
  only ever exposed a bare link to the form template, never its fields). Now
  captures every section and field shown: Personal Information (name,
  address, phone/email, position applied for, desired salary, employment
  type), Eligibility (5 yes/no questions), Education (High School,
  College/University, Other/Trade School), Employment History (3 full
  employer blocks with dates/supervisor/reason for leaving/responsibilities),
  Voluntary Self-Identification (ethnicity & race checkboxes, protected
  veteran status, resume upload), and Applicant Certification and Agreement
  (4 required consent checkboxes, signature name + date).
- **Resume upload now works end to end** \u2014 the public submission endpoint
  accepts `multipart/form-data` with a resume file (validated: .pdf/.doc/
  .docx/.txt only, 10MB max), stores it via the Media Library, and links it
  to the submission. Admins can download it directly from the Submission
  Detail page. Verified: valid resumes upload and attach correctly; invalid
  file types are rejected with a 400 before a submission record is even kept.
- **North Dakota page now shows both known office addresses** \u2014 rather
  than guessing which was current, the North Dakota Office Services page now
  displays both under labeled headings: "Fargo Office" (Brandt Office Park \u2014
  from the original site export) and "Registered Address" (from the federal
  NPI registry). `OfficeInfo.tsx` now supports an arbitrary list of labeled
  addresses (`data.addresses = [{label, address}, ...]`) rather than a single
  address string.
- **Careers page restructured to match the live source exactly** \u2014 removed
  an invented "Apply Today" heading and "Complete the form below to start
  your application." subtext that had been added above the application form.
  The actual live page has no such heading at all: just the hero, one intro
  paragraph, and the form directly beneath it. Fixed to match.
- **Cross-checked every remaining page against the live site** \u2014 Resources
  matched exactly (all 5 organizations, same order, no changes needed). Could
  not directly fetch the live Ohio/North Dakota Services or Privacy Policy
  pages (not indexed for direct retrieval), but found and incorporated a
  genuinely richer, real service description for **Community Transition**
  from a search snippet of your own site. Flagged (not silently changed) a
  **North Dakota address discrepancy**: the seeded office address (from your
  original HTML export) is "Brandt Office Park, 3523 45th St S, Suite 100,
  Fargo, ND 58104," while a federal NPI registry record for Divine Solutions
  Healthcare LLC lists "5497 28th Ave S Apt 2013, Fargo, ND 58104" \u2014
  confirm which is current and correct via Site Settings / the North Dakota
  page editor in the CMS.
- **Rebuilt Home page to match the live site exactly** \u2014 using
  `https://www.divinesolutionshealthcare.com/` as the direct source, I found and
  fixed several structural gaps versus what had been built: added the **hero
  image slider** (3 auto-rotating photos with a fixed headline/CTA overlay,
  using the original slider images already extracted from your HTML export),
  added the **"What we Do / Services We Offer" heading** above the Share
  Living/Community Transition/View More cards, and added the **Mission
  Statement and Vision Statement sections directly on the Home page** (they're
  also still on About Us, with a working `#mission` anchor link between them,
  matching the live site).
- **Global map section** \u2014 discovered the Google Maps embed is actually a
  **global footer element present on every page** (Home, About, Careers,
  Contact, etc. all show the identical embed in the identical position), not
  page-specific content. Moved it out of the Contact page and into `Footer.tsx`
  so it now correctly appears site-wide, right above the "Get In Touch"
  contact details. `SiteSettings.map_embed_url` now defaults to the real
  embed URL for 2242 S. Hamilton Road (also fixed: the field was too short
  for the actual URL length \u2014 bumped from 200 to 1000 chars).
- **Contact page intro text corrected** to match the exact live copy ("We're
  here to answer your questions and provide support...") \u2014 the earlier
  seed had slightly different (non-source) wording here.
- **Modernized public-site design** \u2014 the color palette is 100% unchanged
  (`#1f2a24` / `#9ad176` / `#409aff`, still pulled from the source export's CSS
  variables), but the visual depth, motion, and layout have been substantially
  upgraded: layered shadows, gradient buttons/CTAs built from the *same* palette
  via `color-mix()`, a subtle Ken Burns zoom on hero images, a glassmorphism
  header that gains shadow/opacity on scroll, image-zoom hover on service cards,
  numbered value badges, a refined contact-form card treatment, and a
  scroll-triggered reveal animation (`src/hooks/useReveal.ts` + `Reveal.tsx`)
  applied throughout the site \u2014 content fades/rises into view as you scroll,
  respecting `prefers-reduced-motion`. Mobile nav also now auto-closes on route
  change. See `src/styles/global.css` for the full design-token system.
- **Reply-to-applicant email** \u2014 on any submission's detail page, admins can compose
  and send a real email directly back to the person who submitted the form
  (`POST /api/submissions/<id>/replies/`). Every reply is recorded on the submission
  (`SubmissionReply` model) so there's a full correspondence thread, visible in the
  UI and included in the Print/PDF view. Sending a reply automatically advances the
  submission out of New/Read into In Progress. The email's `Reply-To` header is set
  to `ADMIN_NOTIFICATION_EMAIL`, so if the applicant hits "Reply" in their email
  client, it goes to your real inbox rather than the system's From address. A
  subject/body template is pre-filled based on form type (contact vs. careers) and
  is fully editable before sending. Failed sends (e.g. bad SMTP config) are recorded
  with the error message rather than silently disappearing.
- **Drag-and-drop reordering** for page sections, services (per region), and resources,
  via a dependency-free `DragReorderList` component and `/reorder/` bulk-update
  endpoints on each viewset (`page-sections/reorder/`, `services/reorder/`,
  `resources/reorder/`). A numeric Sort Order field remains as a manual fallback.
- **Bulk PDF export** \u2014 `GET /api/admin/submissions/export/pdf-bulk/` bundles
  multiple submission PDFs into a single ZIP. Accepts `?ids=uuid1,uuid2,...` for a
  specific selection (checkboxes in the Submissions list), or falls back to the
  current status/type filters (capped at 200 submissions per request).
- **Real email notifications** on new form submissions via `django.core.mail.send_mail`,
  sent to `ADMIN_NOTIFICATION_EMAIL`. Uses the console backend in dev (prints to the
  server log) \u2014 configure `EMAIL_HOST`/`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`/
  `EMAIL_USE_TLS` env vars for real SMTP delivery. Failures never block the actual
  form submission.
- **BreadcrumbList JSON-LD structured data** is now emitted on every public page
  (see `src/components/public/Breadcrumbs.tsx`), including multi-level trails on
  service detail pages (Home \u2192 Region \u2192 Service).

## Known gaps / next steps

- No third-party CAPTCHA (hCaptcha/Turnstile) is wired in \u2014 the contact/careers
  form currently relies on a honeypot field, a minimum-time-to-submit check, and
  server-side rate limiting (5/min per IP). Adding a CAPTCHA provider requires your
  own site key/secret and is a small, isolated addition to `ContactForm.tsx` +
  `SubmitFormView`.
- The internal destination pages referenced by the source site but not fully
  exported (Request Brochure, Billing Questions, Insurance Verification, Request a
  Consultation, and individual service detail pages) intentionally contain only the
  one-line descriptions that existed in the source \u2014 per the project's
  content-preservation rule, no additional copy was invented for them. They are
  fully CMS-editable via Pages \u2192 [page] once real copy is available.
