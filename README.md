# Cashlyzer Backend API Documentation

A comprehensive financial management system API that provides endpoints for managing expenses, income, budgets, and AI-powered financial insights.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints require authentication using a Bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <your_token>
```

## API Endpoints

### Authentication

#### Register User
- **POST** `http://localhost:5000/api/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "your_password",
    "name": "John Doe"
  }
  ```
- **Response:** User data and authentication token

#### Login User
- **POST** `http://localhost:5000/api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "your_password"
  }
  ```
- **Response:** User data and authentication token

### AI Insights

#### Get Financial Insights
- **GET** `http://localhost:5000/api/ai/insights`
- **Headers:**
  ```
  Authorization: Bearer <your_token>
  ```
- **Response:**
  ```json
  {
    "message": "Financial insights generated successfully",
    "insights": {
      "spendingPatterns": {
        "category1": "percentage",
        "category2": "percentage"
      },
      "trends": {
        "category1": "trend_percentage",
        "category2": "trend_percentage"
      },
      "recommendations": {
        "category1": {
          "recommended": "amount",
          "current": "amount",
          "trend": "percentage",
          "percentage": "percentage"
        }
      },
      "summary": {
        "totalExpenses": "amount",
        "totalIncome": "amount",
        "savingsRate": "percentage",
        "monthlyBudget": "amount"
      }
    }
  }
  ```
- **Description:** Provides AI-powered insights about spending patterns, trends, and recommendations based on the last 3 months of financial data.

### Expenses

#### Add Expense
- **POST** `http://localhost:5000/api/expenses`
- **Body:**
  ```json
  {
    "amount": 50.00,
    "category": "FOOD",
    "subcategory": "GROCERIES",
    "note": "Weekly groceries",
    "date": "2024-03-20"
  }
  ```
- **Response:** Created expense ID and success message

#### Get Expenses
- **GET** `http://localhost:5000/api/expenses`
- **Query Parameters:**
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
- **Response:** List of expenses with details

#### Delete Expense
- **DELETE** `http://localhost:5000/api/expenses/:id`
- **Response:** Success message and deleted expense ID

### Income

#### Add Income
- **POST** `http://localhost:5000/api/incomes`
- **Body:**
  ```json
  {
    "amount": 3000.00,
    "source": "Salary",
    "note": "Monthly salary",
    "date": "2024-03-01"
  }
  ```
- **Response:** Created income ID and success message

#### Get Incomes
- **GET** `http://localhost:5000/api/incomes`
- **Query Parameters:**
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
- **Response:** List of incomes with details

#### Delete Income
- **DELETE** `http://localhost:5000/api/incomes/:id`
- **Response:** Success message and deleted income ID

### Budget Management

#### Set Monthly Budget
- **POST** `http://localhost:5000/api/budget`
- **Body:**
  ```json
  {
    "amount": 2000.00
  }
  ```
- **Response:** Updated budget amount

#### Get Budget
- **GET** `http://localhost:5000/api/budget`
- **Response:** Current monthly budget

### Categories

#### Get All Categories
- **GET** `http://localhost:5000/api/categories`
- **Response:** List of all expense categories and subcategories

#### Validate Category
- **GET** `http://localhost:5000/api/categories/validate`
- **Query Parameters:**
  - `category`: Category to validate
  - `subcategory`: Subcategory to validate (optional)
- **Response:** Validation result

### Dashboard Summary

#### Get Dashboard Summary
- **GET** `http://localhost:5000/api/summary/dashboard`
- **Response:**
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
        "name": "Food & Dining",
        "amount": 500.00,
        "count": 10
      }
    ],
    "categoryBreakdown": [
      {
        "category": "FOOD",
        "name": "Food & Dining",
        "amount": 500.00,
        "count": 10,
        "percentage": 33.33
      }
    ]
  }
  ```

### AI Features

#### Get Budget Recommendations
- **GET** `http://localhost:5000/api/ai/budget-recommendation`
- **Response:**
  ```json
  {
    "monthlyBudget": 2000.00,
    "categoryBudgets": {
      "FOOD": {
        "name": "Food & Dining",
        "recommended": 400.00,
        "current": 500.00
      }
    },
    "recommendations": [
      {
        "category": "FOOD",
        "name": "Food & Dining",
        "suggestion": "Consider reducing food expenses by 20%"
      }
    ],
    "insights": [
      "Your food expenses are 25% higher than average"
    ],
    "historicalData": {
      "lastThreeMonths": [
        {
          "month": "2024-02",
          "totalExpenses": 1800.00
        }
      ]
    }
  }
  ```

### Notifications

#### Get Notifications
- **GET** `http://localhost:5000/api/notifications`
- **Query Parameters:**
  - `limit`: Number of notifications to return (default: 10)
  - `unreadOnly`: Return only unread notifications (default: false)
- **Response:** List of notifications

#### Mark Notification as Read
- **PUT** `http://localhost:5000/api/notifications/:id/read`
- **Response:** Success message

#### Mark All Notifications as Read
- **PUT** `http://localhost:5000/api/notifications/read-all`
- **Response:** Success message

#### Delete Old Notifications
- **DELETE** `http://localhost:5000/api/notifications/old`
- **Response:** Number of deleted notifications

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

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