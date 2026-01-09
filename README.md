# Artrium Server | Node & MongoDB Backend 🛠️

This is the robust backend engine for the Artrium platform. It handles data persistence for artworks, user interactions (likes/favorites), and artist statistics using Node.js and MongoDB.

## 🌐 Live API Base URL
- **Vercel:** [https://artrium-server.vercel.app/](https://artrium-server.vercel.app/)

## 🚀 Backend Features & Functionality
- **Complex Aggregations:** Utilizes MongoDB's `$inc`, `$push`, and `$pull` operators to efficiently manage the "Like" system and artwork counts.
- **Optimized Queries:** Implements `sort()` and `limit()` to serve featured artworks and recent uploads.
- **Full CRUD API:** RESTful endpoints to manage Artworks and User Favorites with validation.
- **Search & Filter Engine:** Server-side regex search for titles/artists and category-based filtering.
- **Secure Middleware:** (If implemented) CORS configuration to ensure only authorized frontend domains can access the API.

## 📡 Key API Endpoints
- `GET /artworks` - Fetch all public artworks (supports search/filter query params).
- `POST /artworks` - Add new artwork to the database.
- `PATCH /artworks/:id/like` - Atomic increment/decrement for likes.
- `GET /favorites?email=user@example.com` - Fetch user-specific favorite items.
- `DELETE /favorites/:id` - Remove an item from the favorites collection.

## ⚙️ Tech Stack
- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Deployment:** Vercel

## 🛠️ Local Development
1. Clone the repo: `git clone https://github.com/nozibuddowla/artrium-server.git`
2. Install dependencies: `npm install`
3. Set your `DB_USER` and `DB_PASS` in a `.env` file.
4. Start the server: `node index.js` (or `nodemon index.js`)