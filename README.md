# Sales-Dashboard-React-Frontend-with-Node.js-Backend
Backend
The backend is built using Node.js, with Express.js as the framework. It interacts with a relational database to store transactional data. Data initialization is performed by fetching JSON data from a third-party API and seeding the database with the obtained data.

APIs
Initialize Database API: Fetches JSON data from a third-party API and initializes the database with seed data.
List Transactions API: Lists all transactions with support for search and pagination based on product attributes such as title, description, and price.
Statistics API: Provides statistics such as total sale amount, total sold items, and total not-sold items for a selected month.
Bar Chart API: Generates data for a bar chart displaying price ranges and the number of items falling into each range for a selected month.
Pie Chart API: Generates data for a pie chart displaying unique categories and the number of items in each category for a selected month.

Getting Started
To run the project locally, follow these steps:

Clone this repository.
Navigate to the backend directory and install dependencies using npm install.
Start the backend server by running npm start.
Navigate to the frontend directory and install dependencies using npm install.
Start the frontend development server by running npm start.
Access the application in your browser at http://localhost:3000.
