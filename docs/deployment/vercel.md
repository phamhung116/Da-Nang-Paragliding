# Vercel Deployment

Repo nay nen duoc deploy thanh 4 Vercel projects rieng:

- `apps/customer-web`
- `apps/admin-web`
- `apps/pilot-web`
- `apps/backend`

## 1. Customer Web

- Root Directory: repo root `./`
- Framework Preset: `Other`
- Build Command: doc tu `vercel.json`
- Output Directory: doc tu `vercel.json`
- Env:
  - `VERCEL_FRONTEND_APP=customer`
  - `VITE_API_BASE_URL=https://<backend-domain>/api/v1`

File config da co san:
- `vercel.json`
- `scripts/vercel-build.mjs`

## 2. Admin Web

- Root Directory: repo root `./`
- Framework Preset: `Other`
- Build Command: doc tu `vercel.json`
- Output Directory: doc tu `vercel.json`
- Env:
  - `VERCEL_FRONTEND_APP=admin`
  - `VITE_API_BASE_URL=https://<backend-domain>/api/v1/admin`

File config da co san:
- `vercel.json`
- `scripts/vercel-build.mjs`

## 3. Pilot Web

- Root Directory: repo root `./`
- Framework Preset: `Other`
- Build Command: doc tu `vercel.json`
- Output Directory: doc tu `vercel.json`
- Env:
  - `VERCEL_FRONTEND_APP=pilot`
  - `VITE_API_BASE_URL=https://<backend-domain>/api/v1/pilot`

File config da co san:
- `vercel.json`
- `scripts/vercel-build.mjs`

## 4. Backend Django

- Root Directory: `apps/backend`
- Framework Preset: `Other`
- Python runtime: doc `api/index.py`
- Install Command: khong can nhap tay neu doc file `apps/backend/vercel.json`, vi da duoc set thanh `pip3 install -r requirements.txt`
- Env bat buoc:
  - `DJANGO_SECRET_KEY=<strong-secret>`
  - `DJANGO_DEBUG=false`
  - `DJANGO_ALLOWED_HOSTS=.vercel.app,.now.sh`
  - `MONGODB_URI=<your-mongodb-uri>`
  - `MONGODB_NAME=paragliding_platform`
  - `APP_TIME_ZONE=Asia/Bangkok`
  - `CORS_ALLOWED_ORIGINS=https://<customer-domain>,https://<admin-domain>,https://<pilot-domain>`
  - `ONLINE_PAYMENT_DISCOUNT_PERCENT=10`
  - `ONLINE_DEPOSIT_PERCENT=30`
  - `BUSINESS_NAME=SkyNest Paragliding`
  - `BUSINESS_PHONE=+84 909 000 123`
  - `BUSINESS_EMAIL=hello@skynest.vn`
  - `BUSINESS_ADDRESS=Doi bay Son Tra, Da Nang`
  - `CUSTOMER_WEB_URL=https://<customer-domain>`
  - `EMAIL_VERIFICATION_TOKEN_TTL_HOURS=24`
  - `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
  - `EMAIL_HOST=smtp.gmail.com`
  - `EMAIL_PORT=587`
  - `EMAIL_HOST_USER=<smtp-email>`
  - `EMAIL_HOST_PASSWORD=<smtp-app-password>`
  - `EMAIL_USE_TLS=true`
  - `EMAIL_USE_SSL=false`
  - `DEFAULT_FROM_EMAIL=SkyNest <hello@skynest.vn>`
  - `NOTIFICATION_PROVIDER=console`
  - `PAYMENT_PROVIDER=mockpay`

Files config da co san:
- `apps/backend/vercel.json`
- `apps/backend/api/index.py`
- `apps/backend/src/config/settings/production.py`
- `apps/backend/.python-version`

## Luu y quan trong

- Frontend khong nen set Root Directory vao tung `apps/*` vi repo nay dang dung shared packages o `packages/*`. Vi vay 3 frontend projects deu deploy tu repo root va chon app can build bang env `VERCEL_FRONTEND_APP`.
- Backend Django tren Vercel dang chay qua Python Runtime, phu hop de demo/MVP. Neu sau nay can worker/background jobs, websocket, cron nang, hoac GPS tracking tan suat cao, nen can nhac Render/Railway/Fly.io cho backend.
- Frontend dang la SPA React, nen `vercel.json` da them rewrite ve `index.html` de route client-side hoat dong dung.
- Sau deploy backend, phai cap nhat lai `VITE_API_BASE_URL` cua 3 frontend theo domain backend that.
