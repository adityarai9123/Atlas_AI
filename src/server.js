require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");
const startTelegramBot = require("./bot/telegramBot");

const financeTestRoutes = require("./routes/financeTest");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/finance", financeTestRoutes);

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.json({
    name: "Atlas AI Financial Assistant",
    status: "online",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Atlas server running on port http://localhost:${PORT}`);
});

startTelegramBot();