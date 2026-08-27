const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const maxFileSize =
    Number(process.env.MAX_FILE_SIZE_MB || 5) *
    1024 *
    1024;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "uploads"));
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const safeName =
            `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${extension}`;

        cb(null, safeName);
    },
});

const allowedTypes = {
    ".txt": [
        "text/plain",
    ],

    ".md": [
        "text/markdown",
        "text/plain",
        "application/octet-stream",
    ],
};

const fileFilter = (req, file, cb) => {
    const extension = path.extname(
        file.originalname
    ).toLowerCase();

    const allowedMimes = allowedTypes[extension];

    if (!allowedMimes) {
        return cb(
            new Error(
                "Unsupported file type. Only .txt and .md files are allowed"
            )
        );
    }

    if (!allowedMimes.includes(file.mimetype)) {
        return cb(
            new Error(
                "File MIME type does not match a supported file type"
            )
        );
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 1,
    },
});

module.exports = upload;