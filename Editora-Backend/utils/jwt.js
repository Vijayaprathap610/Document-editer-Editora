const jwt = require("jsonwebtoken");

const getJwtConfig = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    };
};

const signToken = (userId) => {
    const config = getJwtConfig();

    return jwt.sign(
        {
            sub: userId.toString(),
        },
        config.secret,
        {
            expiresIn: config.expiresIn,
        }
    );
};

const verifyToken = (token) => {
    const config = getJwtConfig();

    return jwt.verify(token, config.secret);
};

module.exports = {
    signToken,
    verifyToken,
};