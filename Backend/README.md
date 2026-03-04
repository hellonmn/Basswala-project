# DJ Rental Backend API (MySQL)

A comprehensive backend system for a DJ rental service with location-based features similar to Uber, using MySQL database.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📍 **Live Location Tracking** - Real-time location capture like Uber
- 🎧 **DJ Discovery** - Find nearby DJs based on user location using Haversine formula
- 📅 **Booking System** - Complete booking management
- ⭐ **Rating & Reviews** - Rate DJs after events
- 🔍 **Advanced Search** - Filter DJs by genre, price, location, rating

## Tech Stack

- **Node.js** + **Express** - Backend framework
- **MySQL 8.0** - Relational database
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup MySQL (Choose one):
# Option A: Docker (Easiest)
docker run -d --name mysql-dj-rental -p 3306:3306 \
  -e MYSQL_DATABASE=dj_rental \
  -e MYSQL_USER=djadmin \
  -e MYSQL_PASSWORD=djpass123 \
  mysql:8.0

# Option B: Local MySQL
mysql -u root -p
CREATE DATABASE dj_rental;

# 3. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 4. Start server
npm start
```

Server runs at `http://localhost:5000`
Tables are **automatically created** by Sequelize!

See `MYSQL_SETUP.md` for detailed database setup.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with location
- `POST /api/auth/login` - Login with location update
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/location` - Update location

### DJs
- `GET /api/djs` - Get all DJs
- `GET /api/djs/nearby?latitude=X&longitude=Y&maxDistance=50` - Find nearby
- `GET /api/djs/search?genre=Hip-Hop&minRate=100` - Search with filters
- `GET /api/djs/:id` - Get single DJ

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `PUT /api/bookings/:id/review` - Add review
- `DELETE /api/bookings/:id` - Cancel booking

Full API documentation in the file!

## Location Features

**Haversine Formula** for distance calculation:
```sql
SELECT *, (6371 * acos(
  cos(radians(?)) * cos(radians(latitude)) * 
  cos(radians(longitude) - radians(?)) + 
  sin(radians(?)) * sin(radians(latitude))
)) as distance
FROM djs
HAVING distance <= ?
ORDER BY distance;
```

## Testing

1. **Import Postman Collection**: `postman_collection.json`
2. **Open Login Page**: `public/login.html`
3. **Add Sample Data**: See README for SQL INSERT statements

## Project Structure

- `config/` - Database configuration
- `models/` - Sequelize models (User, DJ, Booking)
- `controllers/` - Business logic
- `routes/` - API routes
- `middleware/` - Authentication
- `public/` - Frontend login page

## License

MIT
