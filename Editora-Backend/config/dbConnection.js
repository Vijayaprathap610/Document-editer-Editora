const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error("MONGO_URI is not configured");
    }

    try {
        const connection = await mongoose.connect(mongoUri);

        console.log(
            `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
        );
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

const disconnectDB = async () => {
    await mongoose.connection.close();
};

module.exports = {
    connectDB,
    disconnectDB,
};