const multer = require("multer");
const mongoose = require("mongoose");

const errorHandler = (error, req, res, next) => {
    console.error(
        `${req.method} ${req.originalUrl}`,
        error.message
    );

    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: Object.values(error.errors).map(
                (item) => ({
                    field: item.path,
                    message: item.message,
                })
            ),
        });
    }

    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            success: false,
            message: "Invalid resource identifier",
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "A resource with the same unique value already exists",
        });
    }

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                message: "Uploaded file exceeds the maximum allowed size",
            });
        }

        return res.status(400).json({
            success: false,
            message: "File upload failed",
        });
    }

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message:
            statusCode >= 500
                ? "Internal server error"
                : error.message,
    });
};

module.exports = errorHandler;