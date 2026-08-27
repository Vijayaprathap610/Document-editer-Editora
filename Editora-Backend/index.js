require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const { connectDB } = require("./config/dbConnection");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const validateMutationOrigin = require("./middleware/origin");

const app = express();

const PORT = Number(process.env.PORT) || 5000;

/*
|--------------------------------------------------------------------------
| Allowed CORS origins
|--------------------------------------------------------------------------
*/

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin",
        },
    })
);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without Origin header
            // such as health checks/server-to-server requests.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`Origin ${origin} is not allowed by CORS`)
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        optionsSuccessStatus: 204,
    })
);

/*
|--------------------------------------------------------------------------
| Request middleware
|--------------------------------------------------------------------------
*/

app.use(cookieParser());

app.use(
    express.json({
        limit: "2mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "2mb",
    })
);

app.use(hpp());

app.use(compression());

app.use(
    morgan(
        process.env.NODE_ENV === "production"
            ? "combined"
            : "dev"
    )
);

/*
|--------------------------------------------------------------------------
| Mutation origin protection
|--------------------------------------------------------------------------
|
| Keep this AFTER CORS and before routes.
|
*/

app.use(validateMutationOrigin);

/*
|--------------------------------------------------------------------------
| Global API rate limiter
|--------------------------------------------------------------------------
*/

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max:
        process.env.NODE_ENV === "production"
            ? 300
            : 1000,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

app.use("/api", apiLimiter);

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Editora API is healthy",
        environment: process.env.NODE_ENV || "development",
    });
});

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/uploads", uploadRoutes);

/*
|--------------------------------------------------------------------------
| 404 handler
|--------------------------------------------------------------------------
*/

app.use(notFound);

/*
|--------------------------------------------------------------------------
| Global error handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/

let server = null;

const startServer = async () => {
    try {
        await connectDB();

        server = app.listen(PORT, () => {
            console.log("----------------------------------------");
            console.log("Editora API Server");
            console.log("----------------------------------------");
            console.log(`Environment : ${process.env.NODE_ENV || "development"}`);
            console.log(`Port        : ${PORT}`);
            console.log(`URL         : http://localhost:${PORT}`);
            console.log("----------------------------------------");
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

/*
|--------------------------------------------------------------------------
| Graceful shutdown
|--------------------------------------------------------------------------
*/

const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down...`);

    if (!server) {
        process.exit(0);
    }

    server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
    });

    setTimeout(() => {
        console.error("Forced shutdown after 10 seconds.");
        process.exit(1);
    }, 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/*
|--------------------------------------------------------------------------
| Process error handling
|--------------------------------------------------------------------------
*/

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);

    process.exit(1);
});

/*
|--------------------------------------------------------------------------
| Start application
|--------------------------------------------------------------------------
*/

if (require.main === module) {
    startServer();
}

module.exports = app;