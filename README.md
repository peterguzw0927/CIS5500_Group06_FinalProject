# Flight & Business Analytics Platform

A full-stack web application combining flight delay analysis with local business insights. This project helps travelers make informed decisions by analyzing airport delays and recommending nearby dining options when flights are delayed.

Weblink: https://cis-5500-group06-final-project.vercel.app/


Video Demo Link: https://drive.google.com/file/d/1JpWiIwkyDl1r0EGsvgX4FByuHNiby3cn/view?usp=sharing

## Project Description

This application integrates two data domains:
- **Flight Services**: Query historical flight data to identify delays, cancellations, and reliability trends across airports and states
- **Business Services**: Discover and filter restaurants and coffee shops by rating, review count, and location

## Prerequisites

Before running the project locally, ensure you have:
- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **PostgreSQL** database instance running
- Database credentials (host, user, password, port, database name)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CIS5500_Group06_FinalProject
```

### 2. Backend Setup

Navigate to the server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Configure the database connection. Create or update `config.json`:
```json
{
  "rds_host": "your-db-host",
  "rds_user": "your-db-user",
  "rds_password": "your-db-password",
  "rds_port": 5432,
  "rds_db": "your-database-name"
}
```

Start the backend server:
```bash
npm start
```

The server will run on `http://localhost:8080` by default.

### 3. Frontend Setup

Open a new terminal and navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Update API configuration if needed in `src/config.json`:
```json
{
  "server_url": "http://localhost:8080"
}
```

Start the development server:
```bash
npm start
```

The application will automatically open in your browser at `http://localhost:3000`.

## Running the Application

### Development Mode
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

### Build for Production
```bash
# Frontend build
cd client
npm run build

# Compiled files will be in client/build/
```

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## Project Structure

```
CIS5500_Group06_FinalProject/
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   └── NavBar.js          # Navigation component
│   │   ├── pages/
│   │   │   ├── HomePage.js        # Main dashboard with flight and business queries
│   │   │   └── FlightsPage.js     # Advanced queries and traveler guide
│   │   ├── helpers/
│   │   │   └── formatter.js       # Data formatting utilities
│   │   ├── App.js                 # Main app component with routing
│   │   ├── config.json            # Frontend configuration
│   │   └── index.js               # Entry point
│   └── package.json
├── server/
│   ├── routes.js                  # All API endpoints and database queries
│   ├── server.js                  # Express server setup with caching middleware
│   ├── config.json                # Database configuration
│   └── package.json
└── README.md                       # This file
```

## Available Routes

### Flight Queries
- `GET /flights/most_delayed` - Get most delayed flights with optional `min_delay` filter
- `GET /airports/cancellations` - Get airport cancellation statistics
- `GET /flights/state_reliability` - Compare state-level delay stability

### Business Queries
- `GET /businesses/category_distribution` - Get distribution of business categories
- `GET /businesses/top_coffee_shops` - Get top-rated coffee shops with `min_reviews` filter
- `GET /businesses/weekend_24hr` - Get weekend 24-hour businesses
- `GET /businesses/top_places` - Get top businesses by category and state

### Complex / Insight Queries
- `GET /airports/stranded_guide` - Get stranded traveler restaurant recommendations
- `GET /states/regional_dominance` - Compare reliable states with coffee shop strength
- `GET /airports/no_hotels` - Identify delayed airports with limited lodging options
- `GET /airports/pa_restaurants` - Get top evening restaurants near delayed airports
