const jwt = require("jsonwebtoken");
const User = require("../model/User");
const { verifyToken } = require("../utils/jwt");

const getTokenFromRequest = (req) => {
    const cookieName =
        process.env.COOKIE_NAME || "editora_token";

    if (req.cookies && req.cookies[cookieName]) {
        return req.cookies[cookieName];
    }

    const authorization = req.headers.authorization;

    if (
        authorization &&
        authorization.startsWith("Bearer ")
    ) {
        return authorization.substring(7);
    }

    return null;
};

const protect = async (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        let decoded;

        try {
            decoded = verifyToken(token);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication token expired",
                });
            }

            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }

        const user = await User.findById(decoded.sub).select(
            "-password"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    protect,
    getTokenFromRequest,
};