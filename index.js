const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 9000
const app = express()

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174', 
    ],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wwse58h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {



        const database = client.db('ideabattle');
        const allContest = database.collection('allcontest');
        const popularContest = database.collection('populer_contest');

        //update popular contests
        async function updatePopularContests() {
            try {
                const popularContests = await allContest.find().sort({ participationCount: -1 }).limit(6).toArray();
                await popularContest.deleteMany({});
                await popularContest.insertMany(popularContests);
                console.log("Popular contests updated successfully.");
            } catch (error) {
                console.error('Failed to update popular contests', error);
            }
        }

        // Initial update of popular contests
        updatePopularContests();

        // Schedule regular updates (e.g., every hour)
        setInterval(updatePopularContests, 60 * 60 * 1000);

        // Endpoint to fetch popular contests
        app.get('/contests/popular', async (req, res) => {
            try {
                const popularContests = await popularContest.find().toArray();
                res.json(popularContests);
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch popular contests' });
            }
        });


         // Get all Contest data from mongo
         app.get('/allcontest', async (req, res) => {
            const result = await allContest.find().toArray()
            res.send(result)
        })


        // Connect the client to the server	(optional starting in v4.7)
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hey This is IdeaBattle Server!')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
