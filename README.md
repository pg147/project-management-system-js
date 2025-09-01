# 🎯 Project Management System

A comprehensive **Project Management API** built with **Node.js + Express**, featuring robust user authentication, email verification, password reset functionality, and secure session management with JWT tokens.

## 🚀 Features

- 🔐 **Complete Authentication System** with JWT access/refresh tokens
- 📧 **Email Verification** with secure token-based confirmation
- 🔄 **Password Reset Flow** with temporary secure links
- 🛡️ **Input Validation** using Zod schemas
- 🗄️ **MongoDB Integration** with Mongoose ODM
- 🍪 **Secure Cookie Management** with httpOnly flags
- 📨 **Email Service** with Nodemailer + Mailgen templates
- 🔒 **Password Hashing** with bcryptjs
- 🌐 **CORS Support** for cross-origin requests
- ⚡ **Hot Reload** with Nodemon for development
- 🎨 **Code Formatting** with Prettier

## 📂 Project Structure

`````bash
project-management/
├── src/    # Main source code
│ ├── controllers/    # Request handlers & business logic
│ │ └── user.controllers.js
│ ├── models/    # MongoDB schemas with Mongoose
│ │ └── user.models.js
│ ├── routes/    # API route definitions
│ ├── services/    # Business logic & data operations
│ │ └── user.services.js
│ ├── middlewares/    # Auth & custom middlewares
│ ├── utils/    # Helper functions & utilities
│ ├── validations/    # Zod validation schemas
│ │ └── schema.js
│ ├── constants/    # Application constants
│ └── app.js    # Express app configuration
│
├── public/    # Static assets
├── .env    # Environment variables
├── package.json    # Dependencies & scripts
└── README.md    # Project documentation
`````

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js 5.1.0 |
| **Database** | MongoDB with Mongoose 8.18.0 |
| **Authentication** | JWT (jsonwebtoken 9.0.2) |
| **Validation** | Zod 4.1.4 |
| **Email Service** | Nodemailer 7.0.5 + Mailgen 2.0.29 |
| **Security** | bcryptjs 3.0.2, cookie-parser 1.4.7 |
| **Development** | Nodemon 3.1.10, Prettier 3.6.2 |
| **Environment** | dotenv 17.2.1 |
| **CORS** | cors 2.8.5 |

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/project-management.git
cd project-management
```

### 2️⃣ Install dependencies
``` bash
npm install
```

### 3️⃣ Configure environment variables
Create a `.env` file in the root directory:
``` env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/project-management

# JWT Secrets
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Application URLs
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
```
### 4️⃣ Start the server
**Development mode:**
``` bash
npm run dev
```
**Production mode:**
``` bash
npm start
```
## 📡 API Endpoints
### 👤 Authentication & User Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/v1/users/register` | Register new user & send verification email | ❌ |
| `POST` | `/api/v1/users/login` | Login user with email/password | ❌ |
| `POST` | `/api/v1/users/logout` | Logout user & clear tokens | ✅ |
| `GET` | `/api/v1/users/current-user` | Get current authenticated user | ✅ |
| `POST` | `/api/v1/users/refresh-token` | Refresh expired access token | ❌ |
### 📧 Email Verification

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `GET` | `/api/v1/users/verify/:token` | Verify email with token from email | ❌ |
| `POST` | `/api/v1/users/resend-verification` | Resend verification email | ✅ |
### 🔐 Password Management

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| `POST` | `/api/v1/users/forgot-password` | Send password reset link to email | ❌ |
| `POST` | `/api/v1/users/reset-password/:token` | Reset password with token | ❌ |
| `PUT` | `/api/v1/users/change-password` | Change password (authenticated) | ✅ |
## 🔒 Security Features
- **JWT Token Rotation**: Automatic refresh token rotation on each use
- **Secure Cookies**: httpOnly, secure flags for token storage
- **Password Hashing**: bcrypt with salt rounds for password security
- **Token Expiry**: Short-lived access tokens with longer refresh tokens
- **Email Verification**: Required email confirmation for account activation
- **Input Validation**: Zod schemas prevent malformed data processing
- **CORS Protection**: Configurable cross-origin request handling

## 🧪 Available Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start server in production mode |
| `npm run dev` | Start server with nodemon (hot reload) |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
## 📨 Email Templates
The system includes pre-built email templates for:
- ✅ **Account Verification** - Welcome emails with verification links
- 🔄 **Password Reset** - Secure password reset instructions
- 🔔 **Account Notifications** - Various account-related updates

## 🚦 Request/Response Examples
### Register User
``` javascript
// POST /api/v1/users/register
{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "SecurePass123!"
}

// Response
{
  "status": 201,
  "data": {
    "user": {
      "id": "...",
      "username": "johndoe",
      "email": "john@example.com",
      "isEmailVerified": false
    }
  },
  "message": "User created and verification link sent successfully!"
}
```
### Login User
``` javascript
// POST /api/v1/users/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response (sets httpOnly cookies)
{
  "status": 200,
  "data": {
    "user": { /* user data */ },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "message": "User logged in successfully!"
}
```
## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⭐ Show Your Support
If you found this project helpful, please give it a ⭐ on GitHub!
## 📞 Contact
For any questions or suggestions, feel free to reach out:
- 📧 Email: hi@prathmesh.dev
- 🐛 Issues: [GitHub Issues](https://github.com/pg147/project-management-system-js/issues)

**Built with ❤️ using Node.js & Express**



