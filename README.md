# Fashion-Hub

A multi-brand fashion marketplace with customer, seller/brand, and admin experiences.

## Project structure

- `Backend/` — Node.js + Express + MongoDB API (JWT/cookie auth, role-based access: `customer`, `seller`, `admin`)
- `Frontend/` — React + Vite + Tailwind CSS storefront, seller dashboard, and admin dashboard

## Getting started

### Backend

```powershell
cd Backend
npm install
npm run dev
```

### Frontend

```powershell
cd Frontend
npm install
npm run dev
```

## Key routes

| Path | Access |
| ---- | ------ |
| `/login` | Customer login |
| `/brand-login` | Brand / seller login (approved brands only) |
| `/admin-login` | Administrator login |
| `/register` | Customer registration + combined seller/brand application |
| `/shop`, `/product/:id` | Public storefront |
| `/seller` | Approved sellers only |
| `/admin` | Admins only |

## Checks

```powershell
cd Backend; npm test
cd Frontend; npm run lint; npm run build
```
