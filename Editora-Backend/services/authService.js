const User = require("../model/User");
const { signToken } = require("../utils/jwt");

const normalizeEmail = (email) => {
    return String(email || "").trim().toLowerCase();
};

const registerUser = async ({ name, email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
        email: normalizedEmail,
    });

    if (existingUser) {
        const error = new Error(
            "An account with this email already exists"
        );
        error.statusCode = 409;
        throw error;
    }

    const user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password,
    });

    const token = signToken(user._id);

    return {
        token,
        user: user.toSafeObject(),
    };
};

const loginUser = async ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({
        email: normalizedEmail,
    }).select("+password");

    if (!user) {
        const error = new Error(
            "Invalid email or password"
        );
        error.statusCode = 401;
        throw error;
    }

    const passwordMatches =
        await user.comparePassword(password);

    if (!passwordMatches) {
        const error = new Error(
            "Invalid email or password"
        );
        error.statusCode = 401;
        throw error;
    }

    const token = signToken(user._id);

    return {
        token,
        user: user.toSafeObject(),
    };
};

module.exports = {
    registerUser,
    loginUser,
};