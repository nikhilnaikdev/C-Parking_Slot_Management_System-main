# EventPro

EventPro is a full-stack event booking and management website built with HTML5, CSS3, vanilla JavaScript, Node.js, Express.js, and MySQL.

## Features

- User registration and login with bcrypt password hashing
- JWT authentication and browser session management with localStorage
- Home page with hero, categories, search, featured events, and footer
- Dynamic events page with MySQL-powered search and category filtering
- Event details page with countdown timer and ticket booking form
- Booking confirmations with unique confirmation codes
- User dashboard to view and cancel bookings
- Admin panel with login, dashboard statistics, event CRUD, users, and bookings
- Contact page with contact form, Google Maps embed, and social links
- Responsive black and gold UI with glassmorphism cards, hover effects, and loading/toast states

## Project Structure

```text
event-management/
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── views/
├── routes/
├── controllers/
├── models/
├── config/
├── middleware/
├── database/
├── server.js
├── package.json
└── README.md
```

## Setup

1. Open the `event-management` folder in VS Code.
2. Install dependencies:

```bash
npm install
```

3. Create your environment file:

```bash
copy .env.example .env
```

4. Update `.env` with your MySQL username and password.
5. Create tables and seed demo data:

```bash
npm run setup-db
```

6. Start the development server:

```bash
npm run dev
```

7. Open:

```text
http://localhost:5000
```

## Demo Accounts

Admin login:

```text
Email: admin@eventpro.com
Password: admin123
```

Create regular users from the Register page.

## MySQL Database

The complete schema is in `database/schema.sql`. It creates:

- `users`
- `admins`
- `events`
- `bookings`

The schema includes primary keys, foreign keys, timestamps, booking status, seat counts, and confirmation codes.

## REST API

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/login`
- `GET /api/auth/me`

Events:

- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events` admin
- `PUT /api/events/:id` admin
- `DELETE /api/events/:id` admin

Bookings:

- `POST /api/bookings`
- `GET /api/bookings/mine`
- `PATCH /api/bookings/:id/cancel`

Admin:

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/bookings`

Contact:

- `POST /api/contact`

## Deployment

1. Create a production MySQL database.
2. Set production environment variables on your host:

```text
PORT
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
```

3. Run `npm install --omit=dev`.
4. Run `npm run setup-db` once for schema and seed data.
5. Start with `npm start`.
6. Put the app behind HTTPS with a reverse proxy such as Nginx, Apache, Render, Railway, or a Node-compatible hosting provider.

## Notes For Beginners

- Keep `.env` private and never commit it.
- Change the default admin password after setup.
- Use strong random text for `JWT_SECRET`.
- Replace demo Unsplash image URLs with assets in `public/images` for production.
