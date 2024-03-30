
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const axios = require('axios');


const port = 8080;
// const mongo_url = "mongodb://localhost:27017/dbconnect";

const userSchema = new mongoose.Schema({
    id:{
        type:String,
        required:true
    },
    description:{
      type:String  
    }
})  
mongoose.connect('mongodb://127.0.0.1:27017/dbconnect').then(()=>{
    console.log("MongoDB connected");
}).catch((err)=>{
    console.log(err);
})
const User = mongoose.model("user",userSchema)

const transactionSchema = new mongoose.Schema({
    dateOfSale: Date,
    product: {
        title: String,
        description: String,
        price: Number
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// API to initialize the database with seed data
app.get('/initialize-database', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const seedData = response.data;

        // Insert seed data into the database
        await Transaction.insertMany(seedData);

        res.status(200).json({ message: 'Database initialized successfully with seed data.' });
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
app.get('/transactions', async (req, res) => {
    try {
        const { page = 1, perPage = 10, search } = req.query;

        // Construct query based on search parameter
        const query = search ? {
            $or: [
                { 'product.title': { $regex: search, $options: 'i' } },
                { 'product.description': { $regex: search, $options: 'i' } },
                { 'product.price': parseFloat(search) }
            ]
        } : {};

        // Paginate results
        const transactions = await Transaction.find(query)
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/barchart', async (req, res) => {
    try {
        const { month } = req.query;

        // Extract month from dateOfSale field
        const startOfMonth = new Date(`2000-${month}-01`);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        // Construct aggregation pipeline to group transactions by price range
        const aggregationPipeline = [
            {
                $match: {
                    dateOfSale: {
                        $gte: startOfMonth,
                        $lt: endOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$product.price", 100] }, then: "0 - 100" },
                                { case: { $lte: ["$product.price", 200] }, then: "101 - 200" },
                                { case: { $lte: ["$product.price", 300] }, then: "201 - 300" },
                                { case: { $lte: ["$product.price", 400] }, then: "301 - 400" },
                                { case: { $lte: ["$product.price", 500] }, then: "401 - 500" },
                                { case: { $lte: ["$product.price", 600] }, then: "501 - 600" },
                                { case: { $lte: ["$product.price", 700] }, then: "601 - 700" },
                                { case: { $lte: ["$product.price", 800] }, then: "701 - 800" },
                                { case: { $lte: ["$product.price", 900] }, then: "801 - 900" },
                                { case: { $gte: ["$product.price", 901] }, then: "901-above" }
                            ]
                        }
                    },
                    count: { $sum: 1 }
                }
            }
        ];

        // Execute aggregation pipeline
        const result = await Transaction.aggregate(aggregationPipeline);

        res.status(200).json(result);
        console.log("succes");
    } catch (error) {
        console.error('Error generating bar chart data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/piechart', async (req, res) => {
    try {
        const { month } = req.query;

        // Extract month from dateOfSale field
        const startOfMonth = new Date(`2000-${month}-01`);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        // Construct aggregation pipeline to group transactions by category
        const aggregationPipeline = [
            {
                $match: {
                    dateOfSale: {
                        $gte: startOfMonth,
                        $lt: endOfMonth
                    }
                }
            },
            {
                $group: {
                    _id: "$product.category",
                    count: { $sum: 1 }
                }
            }
        ];

        // Execute aggregation pipeline
        const result = await Transaction.aggregate(aggregationPipeline);
        console.log("Pie chart successful")
        res.status(200).json(result);
    } catch (error) {
        console.error('Error generating pie chart data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


const API_ENDPOINTS = [
    'http://localhost:8080/piechart',
    ,'http://localhost:8080/transactions',
    'http://localhost:8080/barchart'
    // Add other API endpoints here
];

// Function to fetch data from an API endpoint
async function fetchData(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return null;
    }
}

// API to fetch data from all APIs, combine responses, and send final response
app.get('/combined-data', async (req, res) => {
    try {
        const promises = API_ENDPOINTS.map(fetchData);
        const responses = await Promise.all(promises);
        
        // Combine responses into a single object
        const combinedData = {
            transactions: responses[0], // Data from transactions API
            barChart: responses[1], // Data from bar chart API
            pieChart: responses[2] // Data from pie chart API
        };

        res.status(200).json(combinedData);
    } catch (error) {
        console.error('Error fetching combined data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});