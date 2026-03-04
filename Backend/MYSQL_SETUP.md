# MySQL Setup Guide for DJ Rental Backend

This guide covers multiple ways to set up MySQL for your DJ Rental application.

---

## Option 1: MySQL Local Installation (Recommended for Development)

### For Windows:

1. **Download MySQL**
   - Visit: https://dev.mysql.com/downloads/installer/
   - Download MySQL Installer (mysql-installer-community)
   - Choose "mysql-installer-web-community" (smaller download)

2. **Install MySQL**
   ```
   - Run the installer
   - Choose "Developer Default" setup type
   - Keep default settings
   - Set root password (remember this!)
   - Configure MySQL as a Windows Service
   - Complete the installation
   ```

3. **Verify Installation**
   ```bash
   # Open Command Prompt
   mysql --version
   ```

4. **Start MySQL** (usually starts automatically)
   ```bash
   # Check if running
   net start MySQL80
   
   # Stop if needed
   net stop MySQL80
   ```

5. **Connect to MySQL**
   ```bash
   mysql -u root -p
   # Enter your root password
   ```

### For macOS:

1. **Install using Homebrew**
   ```bash
   # Install Homebrew if you don't have it
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install MySQL
   brew install mysql
   ```

2. **Start MySQL**
   ```bash
   # Start as a service
   brew services start mysql
   
   # Or run in foreground
   mysql.server start
   ```

3. **Secure Installation** (Recommended)
   ```bash
   mysql_secure_installation
   # Follow prompts to set root password and security settings
   ```

4. **Connect to MySQL**
   ```bash
   mysql -u root -p
   ```

### For Linux (Ubuntu/Debian):

1. **Update Package Index**
   ```bash
   sudo apt update
   ```

2. **Install MySQL**
   ```bash
   sudo apt install mysql-server
   ```

3. **Secure Installation**
   ```bash
   sudo mysql_secure_installation
   # Set root password and answer security questions
   ```

4. **Start MySQL**
   ```bash
   sudo systemctl start mysql
   sudo systemctl enable mysql  # Auto-start on boot
   ```

5. **Check Status**
   ```bash
   sudo systemctl status mysql
   ```

6. **Connect to MySQL**
   ```bash
   sudo mysql -u root -p
   ```

---

## Option 2: MySQL with Docker (Easiest) ⭐ Recommended

Perfect if you have Docker installed.

### Setup Steps:

1. **Install Docker**
   - Windows/Mac: Download Docker Desktop from https://www.docker.com/products/docker-desktop
   - Linux: 
     ```bash
     curl -fsSL https://get.docker.com -o get-docker.sh
     sudo sh get-docker.sh
     ```

2. **Run MySQL Container**
   ```bash
   docker run -d \
     --name mysql-dj-rental \
     -p 3306:3306 \
     -e MYSQL_ROOT_PASSWORD=rootpassword123 \
     -e MYSQL_DATABASE=dj_rental \
     -e MYSQL_USER=djadmin \
     -e MYSQL_PASSWORD=djpass123 \
     -v mysql_data:/var/lib/mysql \
     mysql:8.0
   ```

3. **Verify Container is Running**
   ```bash
   docker ps
   ```

4. **Connect to MySQL**
   ```bash
   docker exec -it mysql-dj-rental mysql -u djadmin -p
   # Enter password: djpass123
   ```

5. **Update Your .env File**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=dj_rental
   DB_USER=djadmin
   DB_PASSWORD=djpass123
   ```

6. **Useful Docker Commands**
   ```bash
   # Stop MySQL
   docker stop mysql-dj-rental
   
   # Start MySQL
   docker start mysql-dj-rental
   
   # View logs
   docker logs mysql-dj-rental
   
   # Remove container
   docker rm -f mysql-dj-rental
   
   # Remove volume (deletes all data!)
   docker volume rm mysql_data
   ```

---

## Option 3: Cloud MySQL (PlanetScale - Free Tier)

Perfect for production or if you don't want to install locally.

### Setup Steps:

1. **Create Account**
   - Go to: https://planetscale.com
   - Sign up with GitHub or email

2. **Create Database**
   ```
   - Click "Create database"
   - Name: dj-rental-db
   - Region: Choose closest to you
   - Plan: Select "Hobby" (Free)
   - Click "Create database"
   ```

3. **Get Connection Details**
   ```
   - Click "Connect"
   - Choose "Node.js"
   - Copy connection details
   ```

4. **Update Your .env File**
   ```env
   DB_HOST=your-database.us-east-1.psdb.cloud
   DB_PORT=3306
   DB_NAME=dj_rental
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

---

## Setup the Database

### Method 1: Let Sequelize Create Tables Automatically

The easiest way! Sequelize will automatically create all tables based on your models.

1. **Update .env with your MySQL credentials**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=dj_rental
   DB_USER=root
   DB_PASSWORD=your_password
   ```

2. **Create the database** (if it doesn't exist)
   ```bash
   # Connect to MySQL
   mysql -u root -p
   
   # Create database
   CREATE DATABASE dj_rental;
   
   # Exit
   exit;
   ```

3. **Start your application**
   ```bash
   npm install
   npm start
   ```

Sequelize will automatically create all tables! ✨

---

### Method 2: Manual SQL Schema (Optional)

If you prefer to create tables manually, here's the complete schema:

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE IF NOT EXISTS dj_rental;
USE dj_rental;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(10) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  locationStreet VARCHAR(255),
  locationCity VARCHAR(100),
  locationState VARCHAR(100),
  locationZipCode VARCHAR(20),
  locationCountry VARCHAR(100),
  locationUpdatedAt DATETIME,
  profilePicture VARCHAR(255) DEFAULT 'default-avatar.png',
  dateOfBirth DATE,
  isVerified BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  preferences JSON,
  lastLogin DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- DJs table
CREATE TABLE djs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  equipment JSON,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  locationCity VARCHAR(100),
  locationState VARCHAR(100),
  locationCountry VARCHAR(100),
  hourlyRate DECIMAL(10, 2) NOT NULL,
  minimumHours INT DEFAULT 2,
  currency VARCHAR(3) DEFAULT 'USD',
  isAvailable BOOLEAN DEFAULT TRUE,
  schedule JSON,
  ratingAverage DECIMAL(2, 1) DEFAULT 0,
  ratingCount INT DEFAULT 0,
  genres JSON,
  images JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX location_index (latitude, longitude),
  INDEX available_index (isAvailable)
);

-- Bookings table
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  djId INT NOT NULL,
  eventType ENUM('Wedding', 'Birthday', 'Corporate', 'Club', 'Private Party', 'Festival', 'Other') NOT NULL,
  eventDate DATETIME NOT NULL,
  startTime VARCHAR(10) NOT NULL,
  endTime VARCHAR(10) NOT NULL,
  duration INT NOT NULL,
  guestCount INT,
  specialRequests TEXT,
  eventLatitude DECIMAL(10, 8) NOT NULL,
  eventLongitude DECIMAL(11, 8) NOT NULL,
  eventStreet VARCHAR(255),
  eventCity VARCHAR(100),
  eventState VARCHAR(100),
  eventZipCode VARCHAR(20),
  eventCountry VARCHAR(100),
  basePrice DECIMAL(10, 2) NOT NULL,
  additionalCharges JSON,
  totalAmount DECIMAL(10, 2) NOT NULL,
  status ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
  paymentStatus ENUM('Pending', 'Paid', 'Refunded') DEFAULT 'Pending',
  paymentMethod VARCHAR(50),
  transactionId VARCHAR(100),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  reviewDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (djId) REFERENCES djs(id) ON DELETE CASCADE,
  INDEX user_bookings_index (userId),
  INDEX dj_bookings_index (djId),
  INDEX status_index (status)
);
```

---

## Insert Sample Data

After tables are created, add sample DJs for testing:

```sql
USE dj_rental;

INSERT INTO djs (name, description, equipment, latitude, longitude, locationCity, locationState, locationCountry, hourlyRate, minimumHours, isAvailable, ratingAverage, ratingCount, genres, images) VALUES
('DJ Awesome', 
 'Professional DJ with 10+ years experience in weddings and corporate events',
 '{"speakers": "JBL Professional Series", "mixer": "Pioneer DDJ-1000", "turntables": true, "microphones": 2, "lightingSystem": true, "additionalEquipment": ["Fog Machine", "LED Lights"]}',
 40.7128, -74.0060, 'New York', 'NY', 'USA',
 150.00, 2, TRUE, 4.8, 45,
 '["Hip-Hop", "EDM", "Pop", "Rock"]',
 '["dj-awesome-1.jpg"]'),

('DJ Beats Master',
 'Specializing in weddings, parties, and corporate events. Top-rated DJ in the area!',
 '{"speakers": "Bose Professional", "mixer": "Denon DJ Prime 4", "turntables": false, "microphones": 4, "lightingSystem": true, "additionalEquipment": ["Karaoke System", "Photo Booth"]}',
 34.0522, -118.2437, 'Los Angeles', 'CA', 'USA',
 200.00, 3, TRUE, 4.9, 78,
 '["Pop", "Rock", "Jazz", "Latin"]',
 '["dj-beats-1.jpg"]'),

('DJ Electric Vibes',
 'EDM specialist for clubs, festivals, and raves. Bring the energy!',
 '{"speakers": "QSC K-Series", "mixer": "Pioneer DJM-900NXS2", "turntables": true, "microphones": 2, "lightingSystem": true, "additionalEquipment": ["Laser Show", "CO2 Cannons"]}',
 41.8781, -87.6298, 'Chicago', 'IL', 'USA',
 180.00, 4, TRUE, 4.7, 32,
 '["EDM", "Hip-Hop", "Reggae"]',
 '["dj-electric-1.jpg"]');

-- Verify insertion
SELECT id, name, locationCity, hourlyRate, ratingAverage FROM djs;
```

---

## Verify MySQL Connection

Test if everything is working:

### Method 1: Using MySQL Workbench (GUI)

1. Download MySQL Workbench: https://dev.mysql.com/downloads/workbench/
2. Open Workbench
3. Click "+" to add new connection
4. Enter connection details:
   - Connection Name: DJ Rental Local
   - Hostname: localhost
   - Port: 3306
   - Username: root (or your user)
5. Click "Test Connection"
6. Enter password
7. If successful, click "OK"

### Method 2: Command Line

```bash
# Connect to MySQL
mysql -u root -p

# Show databases
SHOW DATABASES;

# Use dj_rental database
USE dj_rental;

# Show tables
SHOW TABLES;

# View users table structure
DESCRIBE users;

# View sample DJ data
SELECT * FROM djs;
```

### Method 3: Test with Your Application

1. **Update .env file**
   ```env
   PORT=5000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=dj_rental
   DB_USER=root
   DB_PASSWORD=your_password
   
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRE=7d
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Look for success messages**
   ```
   MySQL Database connected successfully
   Database synchronized
   Server running in development mode on port 5000
   ```

---

## Troubleshooting

### Problem: "Access denied for user 'root'@'localhost'"

**Solution 1: Reset root password**
```bash
# Stop MySQL
sudo systemctl stop mysql  # Linux
brew services stop mysql   # Mac
net stop MySQL80          # Windows

# Start in safe mode
sudo mysqld_safe --skip-grant-tables &

# Connect without password
mysql -u root

# Reset password
USE mysql;
UPDATE user SET authentication_string=PASSWORD('newpassword') WHERE User='root';
FLUSH PRIVILEGES;
exit;

# Restart MySQL normally
sudo systemctl start mysql
```

**Solution 2: Create new user**
```sql
CREATE USER 'djadmin'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON dj_rental.* TO 'djadmin'@'localhost';
FLUSH PRIVILEGES;
```

### Problem: "Client does not support authentication protocol"

**Solution:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Problem: "Can't connect to MySQL server on 'localhost'"

**Solution:**
```bash
# Check if MySQL is running
# Linux
sudo systemctl status mysql

# Mac
brew services list

# Windows
net start MySQL80

# Check port
netstat -an | grep 3306
```

### Problem: Port 3306 already in use

**Solution:**
```bash
# Find what's using the port
# Linux/Mac
lsof -i :3306

# Windows
netstat -ano | findstr :3306

# Kill the process or change port in .env
DB_PORT=3307
```

---

## Best Practices

1. **Never commit .env file** - Add to .gitignore
2. **Use strong passwords** in production
3. **Create separate database users** for your application
4. **Backup your database regularly**
   ```bash
   mysqldump -u root -p dj_rental > backup.sql
   ```
5. **Restore from backup**
   ```bash
   mysql -u root -p dj_rental < backup.sql
   ```

---

## Quick Reference Commands

```bash
# MySQL Commands
mysql -u root -p                    # Connect to MySQL
SHOW DATABASES;                     # List all databases
USE dj_rental;                      # Switch to database
SHOW TABLES;                        # List tables
DESCRIBE users;                     # Show table structure
SELECT * FROM users;                # View all users
SELECT * FROM djs WHERE isAvailable = 1;  # View available DJs

# Application Commands
npm install                         # Install dependencies
npm start                           # Start server
npm run dev                         # Start with auto-reload

# Docker Commands
docker start mysql-dj-rental        # Start container
docker stop mysql-dj-rental         # Stop container
docker logs mysql-dj-rental         # View logs
```

---

## Next Steps

1. ✅ Install MySQL (Local, Docker, or Cloud)
2. ✅ Create database: `CREATE DATABASE dj_rental;`
3. ✅ Update `.env` with your credentials
4. ✅ Run `npm install`
5. ✅ Run `npm start` (Sequelize creates tables automatically!)
6. ✅ Insert sample DJ data
7. ✅ Open `login.html` and test!

---

Need help? The application will automatically create all tables when you start it! 🚀
