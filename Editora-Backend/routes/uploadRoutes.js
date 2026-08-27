const express = require("express");

const upload =
    require("../middleware/upload");

const {
    uploadImport,
} = require("../controller/uploadController");

const {
    protect,
} = require("../middleware/auth");

const router = express.Router();

router.post(
    "/import",
    protect,
    upload.single("file"),
    uploadImport
);

module.exports = router;