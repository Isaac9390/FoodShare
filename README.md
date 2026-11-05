# FoodShare – React + Vite

A React + Vite food waste management demo with Donor, Recipient and Admin modules.

## Requirements
- Node.js 18 or newer
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).

## Build for review
```bash
npm run build
npm run preview
```

## Modules
- **Donor:** sign up/login, submit surplus food, and track verification status.
- **Recipient:** sign up/login, view admin-approved food, claim food, and view own claims.
- **Admin:** review all food submissions, verify/reject posts, and view recipient claim records.

## Demo admin login
- Username: `admin`
- Password: `Admin@123`

## LocalStorage keys
- `foodshare_users`
- `foodshare_foods`
- `foodshare_session`

Use the same browser profile for the demo because LocalStorage is stored per browser and per origin. To reset demo data, open browser DevTools → Application → Local Storage and clear the site's storage.

## Deploy to Vercel
1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework preset: **Vite** (usually detected automatically).
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy and test the generated URL.

## Important limitations
This is a frontend academic demonstration. LocalStorage data is not shared across devices or browsers. Passwords stored in LocalStorage are not secure, and frontend-only admin credentials can be inspected in source code. For production, use a backend, database, secure password hashing, and server-side authorization.
