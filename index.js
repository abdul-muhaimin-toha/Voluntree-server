require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5chsr9x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get('/', (req, res) => {
  res.send('Voluntree server is running!');
});

async function run() {
  try {
    const database = client.db('volunteerDB');
    const volunteerCollection = database.collection('volunteerCollection');

    app.get('/volunteers-upcoming', async (req, res) => {
      const result = await volunteerCollection.find().limit(6).toArray();
      res.send(result);
    });

    app.get('/volunteers/:id', async (req, res) => {
      const id = req.params.id;

      const cursor = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(cursor);
      res.send(result);
    });

    app.post('/volunteers', async (req, res) => {
      const doc = req.body;
      const result = await volunteerCollection.insertOne(doc);
      res.send(result);
    });

    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Voluntree server is running on port ${port}`);
});
