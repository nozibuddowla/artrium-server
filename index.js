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
    const favoritesCollection = database.collection("favorites");

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
          query.$and = [
            { visibility: "public" },
            {
              $or: [
                { title: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
              ],
            },
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
        const artwork = await artWorks.findOne(query);

        if (!artwork) {
          return res.status(404).send({ message: "Artwork not found" });
        }

        const totalArtworks = await artWorks.countDocuments({
          userEmail: artwork.userEmail,
        });

        res.send({ ...artwork, artistTotalCount: totalArtworks });
      } catch (error) {
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/my-gallery", async (req, res) => {
      const { email } = req.query;
      const query = { userEmail: email };
      const result = await artWorks.find(query).toArray();
      res.send(result);
    });

    // PUT: Update an artwork
    app.put("/artworks/:id", async (req, res) => {
      const myArtworksId = req.params.id;
      const filter = { _id: new ObjectId(myArtworksId) };
      const updatedDoc = {
        $set: req.body,
      };
      const result = await artWorks.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // DELETE: Remove an artwork
    app.delete("/artworks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await artWorks.deleteOne(query);
      res.send(result);
    });

    // --- FAVORITES ROUTES ---

    // POST: Save a new favorite item
    app.post("/favorites", async (req, res) => {
      try {
        const favoriteItem = req.body;
        const alreadyFavorites = await favoritesCollection.findOne({
          artworkId: favoriteItem.artworkId,
          userEmail: favoriteItem.userEmail,
        });

        if (alreadyFavorites) {
          return res.status(400).send({ message: "Already in favorites" });
        }

        const result = await favoritesCollection.insertOne(favoriteItem);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error saving favorite" });
      }
    });

    // GET: Get favorites for a specific user via query email
    app.get("/favorites", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }
        const query = { userEmail: email };

        const result = await favoritesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error fetching favorites" });
      }
    });

    // DELETE: Remove a favorite by its ID
    app.delete("/favorites/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await favoritesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error deleting favorite" });
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
