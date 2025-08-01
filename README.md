
# Expense-Tracker

A full-featured expense tracking application for managing your personal finances, analyzing spending habits, and optimizing budgets.

[View on GitHub](https://github.com/varunkm11/Expense-Tracker)

## Live Demo

**Primary Deployment (Render):** [https://expense-tracker-rk26.onrender.com/auth](https://expense-trackebhai sun project mein sbse pehle dark mode daalde or kisi bhi tab pr naviagte hoou app ke logo pr clcik krke honme pr aa jaye jes ebudget vale section mein se vapas aane ke liye back krna pdta h or jo amount hum split krte h jiske saath krte h us user ke dashboard pr automatically visible yho jayte ki itna amount dena h jisne payment kri h is project ko fully functional or daily use ke liye expoense tracker bnade faang comapnies mein shortlisted hone ke liye apne dimag se bhi features daalde ache ache tujhe kuch chciaye ho toh bta sb de diya h vese mongo db gemini and other things
r-rk26.onrender.com/auth)

**Secondary Deployment (Vercel):** [https://expense-tracker-self-mu.vercel.app/auth](https://expense-tracker-self-mu.vercel.app/auth)

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
   http://localhost:3000
   ```

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
