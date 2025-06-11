# Cashlyzer Backend API Documentation

A comprehensive financial management system API that provides endpoints for managing expenses, income, budgets, and AI-powered financial insights.

## Base URL

```
https://api.cashlyzer.com
```

## Project Structure

```
├── app.js                 # Main application entry point
├── config/               # Configuration files
├── constants/           # Application constants
├── controllers/         # Route controllers
├── cron/               # Scheduled tasks
├── middlewares/        # Custom middleware functions
├── ml/                 # Machine learning models
├── routes/             # API route definitions
├── services/           # Business logic services
└── utils/              # Utility functions
```

## Technologies Used

- Node.js & Express.js
- Firebase Admin SDK
- Google Generative AI
- Cohere AI
- Node-cron for scheduling
- Nodemailer for email notifications
- ML Regression for predictions

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env` file
4. Run the development server:
   ```bash
   npm run dev
   ```
5. For production:
   ```bash
   npm start
   ```

## API Documentation

### Authentication

All endpoints except those under `/api/auth` require authentication using a Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

#### Authentication Endpoints

##### Register User
- **POST** `/api/auth/signup`
- **Description:** Create a new user account
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "your_password",
    "name": "John Doe"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token"
  }
  ```

##### Login
- **POST** `/api/auth/login`
- **Description:** Authenticate user and get access token
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "your_password"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token"
  }
  ```

##### Forgot Password
- **POST** `/api/auth/forgot-password`
- **Description:** Request password reset
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "message": "Password reset email sent"
  }
  ```

##### Get Profile
- **GET** `/api/auth/profile`
- **Description:** Get authenticated user's profile
- **Headers:** Requires authentication
- **Response:** `200 OK`
  ```json
  {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-03-20T00:00:00.000Z"
  }
  ```

### Expenses

#### Add Expense
- **POST** `/api/expenses`
- **Description:** Add a new expense
- **Headers:** Requires authentication
- **Request Body:**
  ```json
  {
    "amount": 50.00,
    "category": "FOOD",
    "subcategory": "GROCERIES",
    "note": "Weekly groceries",
    "date": "2024-03-20"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "message": "Expense added successfully",
    "expense": {
      "id": "expense_id",
      "amount": 50.00,
      "category": "FOOD",
      "subcategory": "GROCERIES",
      "note": "Weekly groceries",
      "date": "2024-03-20",
      "userId": "user_id"
    }
  }
  ```

#### Get Expenses
- **GET** `/api/expenses`
- **Description:** Get all expenses with optional date filtering
- **Headers:** Requires authentication
- **Query Parameters:**
  - `startDate` (optional): Start date in YYYY-MM-DD format
  - `endDate` (optional): End date in YYYY-MM-DD format
- **Response:** `200 OK`
  ```json
  {
    "expenses": [
      {
        "id": "expense_id",
        "amount": 50.00,
        "category": "FOOD",
        "subcategory": "GROCERIES",
        "note": "Weekly groceries",
        "date": "2024-03-20",
        "userId": "user_id"
      }
    ],
    "total": 1,
    "totalAmount": 50.00
  }
  ```

#### Delete Expense
- **DELETE** `/api/expenses/:id`
- **Description:** Delete an expense by ID
- **Headers:** Requires authentication
- **Response:** `200 OK`
  ```json
  {
    "message": "Expense deleted successfully",
    "id": "expense_id"
  }
  ```

### Income

#### Add Income
- **POST** `/api/incomes`
- **Description:** Add a new income entry
- **Headers:** Requires authentication
- **Request Body:**
  ```json
  {
    "amount": 3000.00,
    "source": "Salary",
    "note": "Monthly salary",
    "date": "2024-03-01"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "message": "Income added successfully",
    "income": {
      "id": "income_id",
      "amount": 3000.00,
      "source": "Salary",
      "note": "Monthly salary",
      "date": "2024-03-01",
      "userId": "user_id"
    }
  }
  ```

#### Get Incomes
- **GET** `/api/incomes`
- **Description:** Get all income entries with optional date filtering
- **Headers:** Requires authentication
- **Query Parameters:**
  - `startDate` (optional): Start date in YYYY-MM-DD format
  - `endDate` (optional): End date in YYYY-MM-DD format
- **Response:** `200 OK`
  ```json
  {
    "incomes": [
      {
        "id": "income_id",
        "amount": 3000.00,
        "source": "Salary",
        "note": "Monthly salary",
        "date": "2024-03-01",
        "userId": "user_id"
      }
    ],
    "total": 1,
    "totalAmount": 3000.00
  }
  ```

### Budget Management

#### Set Monthly Budget
- **POST** `/api/budget`
- **Description:** Set or update monthly budget
- **Headers:** Requires authentication
- **Request Body:**
  ```json
  {
    "amount": 2000.00
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "message": "Budget updated successfully",
    "budget": {
      "amount": 2000.00,
      "month": "2024-03",
      "userId": "user_id"
    }
  }
  ```

#### Get Budget
- **GET** `/api/budget`
- **Description:** Get current monthly budget
- **Headers:** Requires authentication
- **Response:** `200 OK`
  ```json
  {
    "budget": {
      "amount": 2000.00,
      "month": "2024-03",
      "userId": "user_id"
    }
  }
  ```

### AI Features

#### Get Financial Insights
- **GET** `/api/ai/insights`
- **Description:** Get AI-powered financial insights
- **Headers:** Requires authentication
- **Response:** `200 OK`
  ```json
  {
    "insights": {
      "spendingPatterns": {
        "FOOD": 30,
        "TRANSPORT": 20,
        "ENTERTAINMENT": 15
      },
      "trends": {
        "FOOD": 5,
        "TRANSPORT": -2,
        "ENTERTAINMENT": 10
      },
      "recommendations": [
        {
          "category": "FOOD",
          "suggestion": "Consider reducing food expenses by 20%",
          "potentialSavings": 100.00
        }
      ]
    }
  }
  ```

### Dashboard Summary

#### Get Dashboard Summary
- **GET** `/api/summary/dashboard`
- **Description:** Get comprehensive financial summary
- **Headers:** Requires authentication
- **Response:** `200 OK`
  ```json
  {
    "monthlyIncome": 3000.00,
    "monthlyExpenses": 1500.00,
    "currentBalance": 1500.00,
    "monthlyBudget": 2000.00,
    "budgetUtilization": 75.00,
    "topCategories": [
      {
        "category": "FOOD",
        "amount": 500.00,
        "percentage": 33.33
      }
    ],
    "savingsRate": 50.00,
    "monthlyTrend": {
      "income": 5.00,
      "expenses": -2.00
    }
  }
  ```

### Error Responses

All endpoints may return the following error responses:

#### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters"
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

## Data Models

### Expense Categories
The system supports the following main categories:
- FOOD (Food & Dining)
- TRANSPORT (Transportation)
- BILLS (Bills & Utilities)
- SHOPPING (Shopping)
- ENTERTAINMENT (Entertainment)
- HEALTH (Health & Medical)
- EDUCATION (Education)
- TRAVEL (Travel)
- PERSONAL (Personal Care)
- GIFTS (Gifts & Donations)
- INVESTMENTS (Investments)
- SUBSCRIPTIONS (Subscriptions)
- TECHNOLOGY (Technology)
- HOME (Home & Living)
- OTHER (Other Expenses)

Each category has specific subcategories for more detailed expense tracking.

## Rate Limiting

The API implements rate limiting to prevent abuse. Current limits:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Security

- All endpoints are protected with JWT authentication
- Passwords are hashed using bcrypt
- Input validation is implemented for all endpoints
- CORS is enabled for specified origins
- Rate limiting is implemented to prevent abuse

## Development

### Prerequisites
- Node.js (v14 or higher)
- Firebase project with Firestore database
- Environment variables configured

### Environment Variables
```
PORT=3000
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

### Installation
```bash
npm install
npm start
```

## Support

For any questions or issues, please contact the development team or create an issue in the repository. 