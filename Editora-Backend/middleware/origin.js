const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://editora-docediter.netlify.app",
];

const validateMutationOrigin = (req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return next();
    }

    const origin = req.get("origin");

    if (!origin) {
        return next();
    }

    const cleanOrigin = origin.trim().replace(/\/$/, "");

    const envOrigins = (process.env.CLIENT_URL || "")
        .split(",")
        .map((item) => item.trim().replace(/\/$/, ""))
        .filter(Boolean);

    const allowed = Array.from(new Set([...defaultOrigins, ...envOrigins]));

    if (
        allowed.includes(cleanOrigin) ||
        /^https:\/\/[a-zA-Z0-9-]+(\.netlify\.app)$/.test(cleanOrigin) ||
        /^https:\/\/[a-zA-Z0-9-]+(\.onrender\.com)$/.test(cleanOrigin)
    ) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "Request origin is not allowed",
    });
};

module.exports = validateMutationOrigin;