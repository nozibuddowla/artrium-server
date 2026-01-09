const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const express = require("express");

const cors = require("cors");

require("dotenv").config();

const port = 3000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@simple-curd-cluster.oq47ln2.mongodb.net/?appName=simple-curd-cluster`;

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
    // await client.connect();

    const database = client.db("artrium_db");
    const artWorks = database.collection("artWorks");
    const favoritesCollection = database.collection("favorites");
    const usersCollection = database.collection("users");

    app.post("/artworks", async (req, res) => {
      const data = req.body;
      //   console.log(data);
      const result = await artWorks.insertOne(data);
      res.send(result);
    });

    //   get artworks from db
    app.get("/artworks", async (req, res) => {
      try {
        const { search, category } = req.query;

        let query = { visibility: "public" };

        if (category && category !== "All") {
          query.category = category;
        }

        if (search) {
          query.$and = [
            { visibility: "public" },
            ...(query.category ? [{ category: query.category }] : []),
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
      const { userEmail } = req.body;

      const artwork = await artWorks.findOne({ _id: new ObjectId(id) });
      // Check if user has already liked it
      const hasLiked = artwork.likedBy?.includes(userEmail);

      let updateDoc;
      if (hasLiked) {
        // UNLIKE logic
        updateDoc = {
          $pull: { likedBy: userEmail },
          $inc: { likes: -1 },
        };
      } else {
        // LIKE logic
        updateDoc = {
          $addToSet: { likedBy: userEmail },
          $inc: { likes: 1 },
        };
      }

      const result = await artWorks.updateOne(
        { _id: new ObjectId(id) },
        updateDoc
      );

      res.send({
        ...result,
        isLiked: !hasLiked,
      });
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

    // get favorites for a specific user via query email
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

    // remove a favorite by its ID
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

    // SAVE/UPDATE USER
    app.put("/users", async (req, res) => {
      const { email, displayName, photoURL, bio } = req.body;
      const filter = { email: email };
      const updatedDoc = {
        $set: {
          displayName,
          photoURL,
          bio,
        },
      };
      const userResult = await usersCollection.updateOne(filter, updatedDoc, {
        upsert: true,
      });
      await artWorks.updateMany(
        { userEmail: email },
        { $set: { userName: displayName, userPhoto: photoURL, userBio: bio } }
      );

      res.send(userResult);
    });

    // GET TOP ARTISTS
    app.get("/top-artists", async (req, res) => {
      const result = await artWorks
        .aggregate([
          { $match: { visibility: "public" } },
          {
            $group: {
              _id: "$userEmail",
              name: { $first: "$userName" },
              profileImage: { $first: "$userPhoto" },
              artworkCount: { $sum: 1 },
              totalLikes: { $sum: { $ifNull: ["$likes", 0] } },
            },
          },
          { $sort: { totalLikes: -1, artworkCount: -1 } },
          { $limit: 4 },
        ])
        .toArray();
      res.send(result);
    });

    // GET SINGLE ARTIST BY ID
    app.get("/artist-details/:email", async (req, res) => {
      try {
        const email = req.params.email;

        const user = await usersCollection.findOne({ email: email });

        const artworks = await artWorks
          .find({ userEmail: email, visibility: "public" })
          .toArray();

        const totalArtworks = await artWorks.countDocuments({
          userEmail: email,
        });

        if (!user) {
          if (artworks.length > 0) {
            const fallbackUser = {
              displayName: artworks[0].userName,
              photoURL: artworks[0].userPhoto,
              email: email,
              bio: artworks[0].userBio || "New Artist",
              followers: 0,
            };
            return res.send({
              user: fallbackUser,
              artworks,
              totalArtworks,
              followers: 0,
            });
          }
          return res
            .status(404)
            .send({ message: "Artist has no public profile or artworks" });
        }

        res.send({
          user,
          artworks,
          totalArtworks,
          followers: user.followers || 0,
        });
      } catch (error) {
        res.status(500).send({ message: "Server error fetching artist" });
      }
    });

    // --- FOLLOW/UNFOLLOW ARTIST ---
    app.patch("/users/follow/:email", async (req, res) => {
      try {
        const targetEmail = req.params.email;
        const { followerEmail } = req.body;

        if (targetEmail === followerEmail) {
          return res
            .status(400)
            .send({ message: "You cannot follow yourself" });
        }

        const artist = await usersCollection.findOne({ email: targetEmail });

        if (!artist) {
          await usersCollection.insertOne({
            email: targetEmail,
            followers: 0,
            followerList: [],
          });
        }

        const currentArtist = await usersCollection.findOne({
          email: targetEmail,
        });
        const isFollowing = currentArtist.followerList?.includes(followerEmail);

        let updateDoc;
        if (isFollowing) {
          updateDoc = {
            $pull: { followerList: followerEmail },
            $inc: { followers: -1 },
          };
        } else {
          updateDoc = {
            $addToSet: { followerList: followerEmail },
            $inc: { followers: 1 },
          };
        }

        const result = await usersCollection.updateOne(
          { email: targetEmail },
          updateDoc
        );
        res.send({ ...result, isFollowing: !isFollowing });
      } catch (error) {
        console.error("Follow error:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    // await client.db("admin").command({ ping: 1 });
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
