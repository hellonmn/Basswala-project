# Quick Start Guide - DJ Rental Backend

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env and set your MongoDB URI
# If using local MongoDB: mongodb://localhost:27017/dj-rental
```

### Step 3: Start MongoDB
```bash
# If using local MongoDB
mongod

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 4: Start Server
```bash
npm start
```

Server will be running at: `http://localhost:5000`

### Step 5: Test the API

Open your browser and visit:
```
http://localhost:5000
```

You should see:
```json
{
  "success": true,
  "message": "Welcome to DJ Rental API",
  "version": "1.0.0"
}
```

### Step 6: Open Login Page

Open `public/login.html` in your browser or serve it with:
```bash
# Using Python
python -m http.server 8080

# Using Node (install http-server globally first)
npx http-server public -p 8080
```

Then visit: `http://localhost:8080/login.html`

## 📱 Testing Location Features

The login page will automatically:
1. Request location permission from your browser
2. Capture your GPS coordinates
3. Convert coordinates to address using reverse geocoding
4. Send location data with login/registration

## 🧪 Test with Postman

1. Import `postman_collection.json` into Postman
2. Set BASE_URL environment variable to `http://localhost:5000/api`
3. Run requests in this order:
   - Register User → Token saved automatically
   - Get Current User → Verify location is saved
   - Get Nearby DJs → Test geospatial queries

## 📊 Sample Data

To test with sample DJs, run this MongoDB command:

```javascript
// Connect to MongoDB shell
mongosh

// Use database
use dj-rental

// Insert sample DJs
db.djs.insertMany([
  {
    name: "DJ Awesome",
    description: "Professional DJ with 10+ years experience",
    equipment: {
      speakers: "JBL Professional",
      mixer: "Pioneer DDJ-1000",
      turntables: true,
      microphones: 2,
      lightingSystem: true
    },
    location: {
      type: "Point",
      coordinates: [-74.0060, 40.7128] // New York
    },
    pricing: {
      hourlyRate: 150,
      minimumHours: 2
    },
    availability: {
      isAvailable: true
    },
    rating: {
      average: 4.8,
      count: 45
    },
    genres: ["Hip-Hop", "EDM", "Pop"]
  },
  {
    name: "DJ Beats",
    description: "Specializing in weddings and corporate events",
    equipment: {
      speakers: "Bose Professional",
      mixer: "Denon DJ Prime 4",
      turntables: false,
      microphones: 4,
      lightingSystem: true
    },
    location: {
      type: "Point",
      coordinates: [-118.2437, 34.0522] // Los Angeles
    },
    pricing: {
      hourlyRate: 200,
      minimumHours: 3
    },
    availability: {
      isAvailable: true
    },
    rating: {
      average: 4.9,
      count: 78
    },
    genres: ["Pop", "Rock", "Jazz"]
  }
])
```

## 🔧 Common Issues

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running:
```bash
mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in .env file or kill the process:
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Location Permission Denied
**Solution:** 
- Use HTTPS or localhost (browsers restrict geolocation on HTTP)
- Check browser location settings
- Enable location services on your device

## 📚 Next Steps

1. **Add More DJs**: Use the sample data script above
2. **Test Nearby Search**: Register with your real location
3. **Create Bookings**: Book a DJ and test the full flow
4. **Add Reviews**: Rate DJs after "completing" bookings
5. **Customize**: Modify models and add features as needed

## 💡 Pro Tips

- The token is automatically saved in localStorage after login
- Location updates automatically on each login
- Use the `/auth/location` endpoint to update location anytime
- Nearby DJs query uses MongoDB's geospatial indexes for speed
- All passwords are hashed - never stored in plain text

## 🆘 Need Help?

Check the full documentation in `README.md` or raise an issue!

Happy coding! 🎧
