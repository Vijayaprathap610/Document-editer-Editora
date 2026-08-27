const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");

const {
    register,
    login,
    me,
    logout,
} = require("../controller/authController");

const { protect } = require("../middleware/auth");

const validate = require("../middleware/validation");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication rate limiter
|--------------------------------------------------------------------------
*/

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max: 30,

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many authentication requests. Please try again later.",
    },
});

/*
|--------------------------------------------------------------------------
| Register validation
|--------------------------------------------------------------------------
*/

const registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({
            min: 2,
            max: 80,
        })
        .withMessage(
            "Name must contain between 2 and 80 characters"
        ),

    body("email")
        .trim()
        .isEmail()
        .withMessage("A valid email is required")
        .normalizeEmail(),

    body("password")
        .isString()
        .withMessage("Password must be a string")
        .isLength({
            min: 8,
            max: 128,
        })
        .withMessage(
            "Password must contain between 8 and 128 characters"
        ),
];

/*
|--------------------------------------------------------------------------
| Login validation
|--------------------------------------------------------------------------
*/

const loginValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("A valid email is required")
        .normalizeEmail(),

    body("password")
        .isString()
        .withMessage("Password must be a string")
        .notEmpty()
        .withMessage("Password is required"),
];

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

router.post(
    "/register",
    authLimiter,
    registerValidation,
    validate,
    register
);

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

router.post(
    "/login",
    authLimiter,
    loginValidation,
    validate,
    login
);

/*
|--------------------------------------------------------------------------
| Current user
|--------------------------------------------------------------------------
*/

router.get(
    "/me",
    protect,
    me
);

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

router.post(
    "/logout",
    logout
);

module.exports = router;