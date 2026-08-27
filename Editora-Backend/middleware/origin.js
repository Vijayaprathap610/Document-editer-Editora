const validateMutationOrigin = (req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return next();
    }

    const allowedOrigins = (process.env.CLIENT_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    const origin = req.get("origin");

    if (!origin) {
        return next();
    }

    if (!allowedOrigins.includes(origin)) {
        return res.status(403).json({
            success: false,
            message: "Request origin is not allowed",
        });
    }

    next();
};

module.exports = validateMutationOrigin;