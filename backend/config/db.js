const mongoose = require("mongoose");

const MongoDBConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.log("MongoDBConnection error: ", error);
    process.exit(1);
  }
};

module.exports = MongoDBConnection;
