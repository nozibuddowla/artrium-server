const { MongoClient, ServerApiVersion } = require("mongodb");

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
