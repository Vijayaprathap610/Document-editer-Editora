const {
    registerUser,
    loginUser,
} = require("../services/authService");

const {
    successResponse,
} = require("../utils/apiResponse");

const getCookieOptions = () => {
    const isProduction =
        process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
    };
};

const getClearCookieOptions = () => {
    const isProduction =
        process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
    };
};

const setAuthCookie = (res, token) => {
    const cookieName =
        process.env.COOKIE_NAME ||
        "editora_token";

    res.cookie(
        cookieName,
        token,
        getCookieOptions()
    );
};

const register = async (req, res, next) => {
    try {
        const result = await registerUser({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });

        setAuthCookie(res, result.token);

        return successResponse(
            res,
            201,
            "Registration successful",
            {
                user: result.user,
            }
        );
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await loginUser({
            email: req.body.email,
            password: req.body.password,
        });

        setAuthCookie(res, result.token);

        return successResponse(
            res,
            200,
            "Login successful",
            {
                user: result.user,
            }
        );
    } catch (error) {
        next(error);
    }
};

const me = async (req, res) => {
    return successResponse(
        res,
        200,
        "Current user retrieved",
        {
            user: req.user.toSafeObject
                ? req.user.toSafeObject()
                : {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    createdAt: req.user.createdAt,
                    updatedAt: req.user.updatedAt,
                },
        }
    );
};

const logout = async (req, res) => {
    const cookieName =
        process.env.COOKIE_NAME ||
        "editora_token";

    res.clearCookie(
        cookieName,
        getClearCookieOptions()
    );

    return successResponse(
        res,
        200,
        "Logged out successfully"
    );
};

module.exports = {
    register,
    login,
    me,
    logout,
    getCookieOptions,
};