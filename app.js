require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const NodeCache = require("node-cache");

const app = express();
const myCache = new NodeCache(); 

const uri = process.env.MONGODB_URI;
console.log("MongoDB URI:", uri); 

const client = new MongoClient(uri);
const port = process.env.PORT || 8080;

function logger(req, res, next) {
    console.log(`${req.method} ${req.url}`);
    next();
}

app.use(logger);

async function main() {
    try {
     
        await client.connect();
        console.log("Connected to MongoDB Atlas");

        const database = client.db("olx");
        const collection = database.collection("olx");

        app.get('/api/olx', async (req, res) => {
            try {
                console.time('fetchData');

                const cachedData = myCache.get("olxData");

                if (cachedData) {
                    console.log('Serving from cache');
                    console.timeEnd('fetchData');
                    return res.json(cachedData);
                }

                console.log('Fetching data from MongoDB');
                const documents = await collection.find({}).toArray();

                myCache.set("olxData", documents, 60); 

                console.timeEnd('fetchData');

                res.json(documents);
            } catch (error) {
                console.error("Error fetching data from MongoDB:", error);
                res.status(500).json({ message: "Error fetching data from MongoDB", error: error });
            }
        });

    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
    }
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json('Hello from Express');
});

app.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    await main(); 
});
