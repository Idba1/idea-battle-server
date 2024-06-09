const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 9000
const app = express()

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        ' https://idea-battle.web.app',
        'https://idea-battle.firebaseapp.com',
        'https://harmonious-sopapillas-3257f9.netlify.app'
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
        const usersCollection = database.collection('users');

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


        // Add user to the database
        app.post('/users', async (req, res) => {
            const { uid, email, displayName } = req.body;
            try {
                const user = { uid, email, displayName };
                const result = await usersCollection.insertOne(user);
                res.status(201).send(result.ops[0]);
            } catch (error) {
                if (error.code === 11000) {
                    res.status(400).send({ error: 'User already exists' });
                } else {
                    res.status(400).send({ error: 'Invalid data' });
                }
            }
        });

        // Get all user data from mongo
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })
        // Get all Contest data from mongo
        app.get('/allcontest', async (req, res) => {
            const result = await allContest.find().toArray()
            res.send(result)
        })

        // Get a single contest data from db using contest id
        app.get('/allcontest/:id', async (req, res) => {
            const id = req.params.id

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid contest ID' });
            }

            const query = { _id: new ObjectId(id) }
            const result = await allContest.findOne(query)

            if (!result) {
                return res.status(404).json({ error: 'Contest not found' });
            }

            res.send(result)
        })

        // Register user for contest (dummy endpoint for now, you need to implement payment gateway)
        app.post('/register', async (req, res) => {
            const { contestId, userId } = req.body;

            if (!ObjectId.isValid(contestId)) {
                return res.status(400).json({ error: 'Invalid contest ID' });
            }

            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid user ID' });
            }

            // Check if user is already registered
            const existingRegistration = await userRegistrations.findOne({ contestId: new ObjectId(contestId), userId: new ObjectId(userId) });

            if (existingRegistration) {
                return res.status(400).json({ error: 'User already registered for this contest' });
            }

            // Register the user for the contest
            await userRegistrations.insertOne({ contestId: new ObjectId(contestId), userId: new ObjectId(userId), registeredAt: new Date() });

            // Increment participation count
            await allContest.updateOne({ _id: new ObjectId(contestId) }, { $inc: { participationCount: 1 } });

            res.status(200).json({ message: 'User registered successfully' });
        });



        // Connect the client to the server	(optional starting in v4.7)
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hey This is IdeaBattle Server!')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
