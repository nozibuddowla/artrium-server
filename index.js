const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const express = require("express");

const cors = require("cors");

require("dotenv").config();

const port = 3000;

const app = express();

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://artrium:rrA3yKJgAzVN3kcd@simple-curd-cluster.oq47ln2.mongodb.net/?appName=simple-curd-cluster";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("artrium_db");
    const artWorks = database.collection("artWorks");

    app.post("/artworks", async (req, res) => {
      const data = req.body;
      //   console.log(data);
      const result = await artWorks.insertOne(data);
      res.send(result);
    });

    //   get artworks from db
    app.get("/artworks", async (req, res) => {
      try {
        const { search } = req.query;
        let query = { visibility: "public" };

        if (search) {
          query.$or = [
            { title: { $regex: search, $options: "i" } },
            { userName: { $regex: search, $options: "i" } },
          ];
        }

        const result = await artWorks.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    app.patch("/artworks/:id/like", async (req, res) => {
      const id = req.params.id;
      const result = await artWorks.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { likes: 1 } }
      );
      res.send(result);
    });

    app.get("/artworks/featured", async (req, res) => {
      try {
        const result = await artWorks
          .find({ visibility: "public" })
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching featured artworks:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/artworks/:id", async (req, res) => {
      try {
        const artWorkId = req.params.id;
        // console.log(artWorkId);
        const query = { _id: new ObjectId(artWorkId) };
        const result = await artWorks.findOne(query);

        if (!result) {
          return res.status(404).send({ message: "Artwork not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching artwork:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("F society!");
});

app.listen(port, () => {
  console.log(`F society server is running on port ${port}`);
});
