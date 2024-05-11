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
    const AppliedCollection = database.collection('AppliedCollection');

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

    app.get('/my-volunteer-posts/:email', async (req, res) => {
      const userEmail = req.params.email;
      const cursor = { organizer_email: userEmail };
      const result = await volunteerCollection.find(cursor).toArray();
      res.send(result);
    });

    app.get('/my-applied-posts/:email', async (req, res) => {
      const userEmail = req.params.email;
      const cursor = { applicant_email: userEmail };
      const result = await AppliedCollection.find(cursor).toArray();
      res.send(result);
    });

    app.post('/volunteers', async (req, res) => {
      const doc = req.body;
      const result = await volunteerCollection.insertOne(doc);
      res.send(result);
    });

    app.post('/applied-as-a-volunteer', async (req, res) => {
      const applicationData = req.body;

      const query = {
        applicant_email: applicationData.applicant_email,
        postId: applicationData.postId,
      };
      const alreadyApply = await AppliedCollection.findOne(query);
      if (alreadyApply) {
        return res
          .status(400)
          .send('You have already applied on this opportunity.');
      }
      const result = await AppliedCollection.insertOne(applicationData);
      const updatedDoc = {
        $inc: { volunteers_needed: -1 },
      };
      const cursor = { _id: new ObjectId(applicationData.postId) };
      const updateVolunteersNeeded = await volunteerCollection.updateOne(
        cursor,
        updatedDoc
      );
      res.send(result);
    });

    app.put('/volunteers/:id', async (req, res) => {
      const id = req.params.id;
      const updatedInfo = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updateDoc = {
        $set: {
          title: updatedInfo.title,
          category: updatedInfo.category,
          description: updatedInfo.description,
          location: updatedInfo.location,
          volunteers_needed: updatedInfo.volunteers_needed,
          deadline: updatedInfo.deadline,
          thumbnail_URL: updatedInfo.thumbnail_URL,
          organizer_name: updatedInfo.organizer_name,
          organizer_email: updatedInfo.organizer_email,
        },
      };

      const result = await volunteerCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete('/volunteers/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
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
