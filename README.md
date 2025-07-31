
# Expense-Tracker

A full-featured expense tracking application for managing your personal finances, analyzing spending habits, and optimizing budgets.

[View on GitHub](https://github.com/varunkm11/Expense-Tracker)

## Live Demo

[https://expense-tracker.onrender.com/auth](https://expense-tracker.onrender.com/auth)

## Features

- **Expense Tracking:** Add, update, and delete expenses with detailed information like amount, category, subcategory, description, date, tags, receipts, and location.
- **Income Tracking:** Record incomes including source, amount, description, recurring details, and tags.
- **Recurring Transactions:** Automatic handling of recurring expenses and incomes with flexible frequency (daily, weekly, monthly, yearly).
- **Splitting & Sharing:** Track expenses split with others and who paid.
- **Budget Management:** Set and monitor budgets per category and period (weekly, monthly, yearly), with notifications for thresholds.
- **Analytics & Insights:**
  - Category-wise spending breakdown
  - Daily trend analytics
  - Month-to-month comparison and savings rate
  - Automatic insights (e.g., top category, monthly trends)
- **Reporting:** Generate reports for custom periods, including savings and budget adherence.
- **Location & Receipts:** Optionally save expense locations and upload receipt images.
- **Search & Filtering:** Filter and search by category, tags, date range, or keywords.

## Tech Stack

- **Backend:** Node.js, Express.js, TypeScript, Mongoose (MongoDB)
- **Frontend:** React (TypeScript)
- **APIs & Validation:** RESTful APIs, Zod for schema validation
- **Other:** Date-fns for date handling

## Usage

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB

### Setup

1. **Clone the repository**
   ```sh
   git clone https://github.com/varunkm11/Expense-Tracker.git
   cd Expense-Tracker
   ```

2. **Install dependencies**
   ```sh
   npm install
   cd client
   npm install
   cd ..
   ```

3. **Configure environment variables**

   Create a `.env` file in the root and set necessary variables for MongoDB connection, JWT secret, etc.

4. **Start the backend server**
   ```sh
   npm run dev
   ```

5. **Start the frontend**
   ```sh
   cd client
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:8080
   ```

## Deployment

The application is deployed on [Render](https://render.com). See `RENDER_SETUP.md` for deployment instructions.

For deployment:
1. Fork this repository
2. Connect your GitHub repository to Render
3. Create a new Web Service
4. Use the configuration from `render.yaml` or `RENDER_SETUP.md`
5. Add environment variables (MONGODB_URI, JWT_SECRET)

## API Overview

- Create, update, delete, and fetch expenses and incomes
- Get analytics for month/week/year
- Manage budgets per category
- Generate custom reports

## Example Expense Object

```json
{
  "amount": 1200,
  "category": "Food & Dining",
  "description": "Lunch at Cafe",
  "date": "2025-07-26",
  "splitWith": ["friend@example.com"],
  "paidBy": "You",
  "tags": ["lunch", "work"],
  "isRecurring": false,
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "Connaught Place, New Delhi"
  },
  "receiptUrl": "https://example.com/receipt.jpg"
}
```

## License

This project is licensed under the MIT License.

---

[Visit the repository on GitHub](https://github.com/varunkm11/Expense-Tracker)

---

## Collaboration

This is a collaboration project by:

- [Varun Kumar Singh](https://github.com/varunkm11)
- [Pushkar Kumar Saini](https://github.com/pushkarkumarsaini2006)
