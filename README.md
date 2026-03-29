# Paragliding Booking Platform

Monorepo cho nen tang dat lich du luon voi:

- `apps/backend`: Django + DRF + MongoDB backend
- `apps/customer-web`: React app cho khach hang
- `apps/admin-web`: React app cho admin
- `apps/pilot-web`: React app cho pilot
- `packages/ui`: UI primitives va theme dung chung
- `packages/api-client`: typed API client dung chung

## Architecture

- Backend tach theo bounded context: `catalog`, `availability`, `bookings`, `payments`, `tracking`, `notifications`
- Moi module backend theo 4 lop: `domain -> application -> infrastructure -> presentation`
- Frontend tach 3 app rieng `customer-web`, `admin-web` va `pilot-web`
- API URL, route, status label, payment/weather config khong bi hard-code rai rac trong page

Tai lieu chi tiet:

- [Project Structure](./docs/architecture/project-structure.md)
- [Backend Guide](./apps/backend/README.md)
- [Customer Web Guide](./apps/customer-web/README.md)
- [Admin Web Guide](./apps/admin-web/README.md)

## Quick Start

### 1. Khoi dong MongoDB

```bash
cd infra/docker
docker compose up -d
```

MongoDB chay o `mongodb://127.0.0.1:27017`  
Mongo Express chay o `http://localhost:8081`

### 2. Chay backend

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r apps/backend/requirements.txt
copy apps/backend/.env.example apps/backend/.env
cd apps/backend
..\..\.venv\Scripts\python manage.py migrate
..\..\.venv\Scripts\python manage.py seed_demo_data
..\..\.venv\Scripts\python manage.py runserver
```

Backend API:

- `http://localhost:8000/health/`
- `http://localhost:8000/api/v1/services/`
- `http://localhost:8000/api/v1/admin/booking-requests/`
- `http://localhost:8000/api/v1/pilot/flights/?phone=...`

### 3. Chay customer web

```bash
copy apps/customer-web/.env.example apps/customer-web/.env
npm install
npm run dev:customer
```

Customer web chay o `http://localhost:5173`

### Chay tat ca bang 1 lenh

```bash
npm run dev:all
```

Lenh nay chay cung luc:

- backend: `http://localhost:8000`
- customer web: `http://localhost:5173`
- admin web: `http://localhost:5174`
- pilot web: `http://localhost:5175`

Neu muon `migrate + seed_demo_data` truoc khi bat tat ca:

```bash
npm run dev:all:fresh
```

### 4. Chay admin web

```bash
copy apps/admin-web/.env.example apps/admin-web/.env
npm run dev:admin
```

Admin web chay o `http://localhost:5174`

### 5. Chay pilot web

```bash
copy apps/pilot-web/.env.example apps/pilot-web/.env
npm run dev:pilot
```

Pilot web chay o `http://localhost:5175`

## Demo Data

Seed command tao san:

- 3 goi dich vu
- lich availability cho 2 thang
- 1 booking pending
- 1 booking confirmed thanh toan tien mat
- 1 booking confirmed da thanh toan online va dang o trang thai `FLYING`
- 2 booking da duoc gan pilot demo

So dien thoai demo de track:

- `+84909000111`
- `+84909000222`
- `+84909000333`

## Verified

Da verify trong moi truong nay:

- `python manage.py check`
- `python manage.py migrate`
- `python manage.py seed_demo_data`
- customer build production thanh cong
- admin build production thanh cong
- pilot build production thanh cong
- API `services`, `tracking lookup`, `admin booking requests` tra JSON dung shape
