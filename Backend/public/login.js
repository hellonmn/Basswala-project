<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DJ Rental - Login</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            width: 100%;
            max-width: 450px;
            padding: 40px;
        }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 { color: #667eea; font-size: 32px; margin-bottom: 5px; }
        .logo p { color: #666; font-size: 14px; }
        .tabs {
            display: flex;
            margin-bottom: 30px;
            border-bottom: 2px solid #e0e0e0;
        }
        .tab {
            flex: 1;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            color: #666;
            font-weight: 500;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        .tab.active { color: #667eea; border-bottom-color: #667eea; }
        .form-container { display: none; }
        .form-container.active { display: block; }
        .form-group { margin-bottom: 20px; }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 15px;
            transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
        .location-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn:disabled { background: #ccc; cursor: not-allowed; }
        .error-message, .success-message {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }
        .error-message { background: #fee; color: #c00; }
        .success-message { background: #efe; color: #0a0; }
        .name-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .role-info {
            background: #fff3cd;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 13px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🎧 DJ Rental</h1>
            <p>Find the perfect DJ for your event</p>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="switchTab('login')">Login</div>
            <div class="tab" onclick="switchTab('register')">Register</div>
        </div>

        <div id="error" class="error-message"></div>
        <div id="success" class="success-message"></div>

        <!-- Login Form -->
        <div id="login-form" class="form-container active">
            <div class="location-info">
                <span id="location-status-login">Detecting location...</span>
            </div>

            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email or Phone</label>
                    <input type="text" id="login-email" placeholder="Enter your email or phone" required>
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" placeholder="Enter your password" required>
                </div>

                <button type="submit" class="btn">Login</button>
            </form>
        </div>

        <!-- Register Form -->
        <div id="register-form" class="form-container">
            <div class="location-info">
                <span id="location-status-register">Detecting location...</span>
            </div>

            <form onsubmit="handleRegister(event)">
                <div class="role-info">
                    <strong>👤 Select your role:</strong><br>
                    <small>User: Book DJs | DJ: Offer services | Admin: Manage platform</small>
                </div>

                <div class="form-group">
                    <label>Register as</label>
                    <select id="register-role" required>
                        <option value="user">User (Customer)</option>
                        <option value="dj">DJ (Service Provider)</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div class="name-group">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" id="register-firstname" placeholder="First name" required>
                    </div>

                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" id="register-lastname" placeholder="Last name" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="register-email" placeholder="your.email@example.com" required>
                </div>

                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="register-phone" placeholder="10-digit phone number" pattern="[0-9]{10}" required>
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="register-password" placeholder="Minimum 6 characters" minlength="6" required>
                </div>

                <button type="submit" class="btn">Create Account</button>
            </form>
        </div>
    </div>

    <script>
        const API_URL = 'http://localhost:5000/api';
        let currentLocation = { latitude: null, longitude: null, address: {} };

        function switchTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.form-container').forEach(f => f.classList.remove('active'));
            
            if (tab === 'login') {
                document.querySelectorAll('.tab')[0].classList.add('active');
                document.getElementById('login-form').classList.add('active');
            } else {
                document.querySelectorAll('.tab')[1].classList.add('active');
                document.getElementById('register-form').classList.add('active');
            }
            hideMessages();
        }

        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        currentLocation.latitude = position.coords.latitude;
                        currentLocation.longitude = position.coords.longitude;
                        updateLocationUI('Location detected ✓', true);
                    },
                    error => {
                        updateLocationUI('Location not available', false);
                    }
                );
            }
        }

        function updateLocationUI(text, success) {
            document.getElementById('location-status-login').textContent = text;
            document.getElementById('location-status-register').textContent = text;
        }

        function showError(message) {
            const errorEl = document.getElementById('error');
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            document.getElementById('success').style.display = 'none';
        }

        function showSuccess(message) {
            const successEl = document.getElementById('success');
            successEl.textContent = message;
            successEl.style.display = 'block';
            document.getElementById('error').style.display = 'none';
        }

        function hideMessages() {
            document.getElementById('error').style.display = 'none';
            document.getElementById('success').style.display = 'none';
        }

        async function handleLogin(event) {
            event.preventDefault();
            hideMessages();

            const emailOrPhone = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const isEmail = emailOrPhone.includes('@');
            
            const payload = {
                [isEmail ? 'email' : 'phone']: emailOrPhone,
                password: password,
                location: currentLocation
            };

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    showSuccess(`Login successful! Welcome ${data.user.role.toUpperCase()}`);
                    
                    // Redirect based on role
                    setTimeout(() => {
                        if (data.user.role === 'admin') {
                            alert('Admin Dashboard');
                        } else if (data.user.role === 'dj') {
                            alert('DJ Dashboard');
                        } else {
                            alert('User Dashboard');
                        }
                    }, 1000);
                } else {
                    showError(data.message || 'Login failed');
                }
            } catch (error) {
                showError('Network error. Please check connection.');
            }
        }

        async function handleRegister(event) {
            event.preventDefault();
            hideMessages();

            const payload = {
                firstName: document.getElementById('register-firstname').value,
                lastName: document.getElementById('register-lastname').value,
                email: document.getElementById('register-email').value,
                phone: document.getElementById('register-phone').value,
                password: document.getElementById('register-password').value,
                role: document.getElementById('register-role').value,
                location: currentLocation
            };

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    showSuccess(`Registration successful as ${data.user.role.toUpperCase()}!`);
                    
                    setTimeout(() => {
                        alert(`Welcome ${data.user.firstName}! Your account has been created.`);
                    }, 1000);
                } else {
                    showError(data.message || 'Registration failed');
                }
            } catch (error) {
                showError('Network error. Please check connection.');
            }
        }

        window.onload = function() {
            getLocation();
        };
    </script>
</body>
</html>