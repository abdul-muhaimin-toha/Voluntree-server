require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: ['https://voluntree-go.netlify.app'],
  credentials: true,
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }
    req.user = decoded;
    next();
  });
};

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

    // Auth Related API

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: '1h',
      });
      res.cookie('token', token, cookieOptions).send({ success: true });
    });

    app.post('/logout', async (req, res) => {
      res
        .clearCookie('token', { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });

    // Services Related API

    app.get('/volunteers-upcoming', async (req, res) => {
      const filter = { deadline: { $gt: new Date().toISOString() } };
      const result = await volunteerCollection
        .find(filter)
        .sort({ deadline: 1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get('/volunteers', async (req, res) => {
      const page = +req.query.page;
      const limit = +req.query.limit;
      const searchQuery = req.query.searchQuery;

      const query = {
        title: { $regex: searchQuery, $options: 'i' },
      };

      const result = await volunteerCollection
        .find(query)
        .skip(page * limit)
        .limit(limit)
        .toArray();
      res.send(result);
    });

    app.get('/number-of-post', async (req, res) => {
      const searchQuery = req.query.searchQuery;
      const query = {
        title: { $regex: searchQuery, $options: 'i' },
      };
      const result = await volunteerCollection.countDocuments(query);
      res.send({ totalPost: result });
    });

    app.get('/volunteers/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const cursor = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(cursor);
      res.send(result);
    });

    app.get('/my-volunteer-posts/:email', verifyToken, async (req, res) => {
      if (req.user.email !== req.params.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }
      const userEmail = req.params.email;
      const cursor = { organizer_email: userEmail };
      const result = await volunteerCollection.find(cursor).toArray();
      res.send(result);
    });

    app.get('/my-applied-posts/:email', verifyToken, async (req, res) => {
      if (req.user.email !== req.params.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }
      const userEmail = req.params.email;
      const cursor = { applicant_email: userEmail };
      const result = await AppliedCollection.find(cursor).toArray();
      res.send(result);
    });

    app.post('/volunteers', verifyToken, async (req, res) => {
      const doc = req.body;
      const result = await volunteerCollection.insertOne(doc);
      res.send(result);
    });

    app.post('/applied-as-a-volunteer', verifyToken, async (req, res) => {
      const applicationData = req.body;

      if (applicationData.volunteers_needed <= 1) {
        return res.send({ message: 'Not allowed' });
      }

      if (applicationData.organizer_email === applicationData.applicant_email) {
        return res.send({ message: 'Not allowed' });
      }

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

    app.put('/volunteers/:id', verifyToken, async (req, res) => {
      if (req.body.organizer_email !== req.user.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }
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

    app.delete('/volunteers/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const findThePost = await volunteerCollection.findOne(query);

      if (findThePost.organizer_email !== req.user.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }

      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });

    app.delete('/my-applied-posts/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const findThePost = await AppliedCollection.findOne(query);

      if (findThePost.applicant_email !== req.user.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }

      const result = await AppliedCollection.deleteOne(query);

      const updatedDoc = {
        $inc: { volunteers_needed: 1 },
      };
      const cursor = { _id: new ObjectId(findThePost.postId) };

      const updateVolunteersNeeded = await volunteerCollection.updateOne(
        cursor,
        updatedDoc
      );

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
