const express = require("express");
const { body, param } = require("express-validator");

const {
    listDocuments,
    create,
    getOne,
    update,
    rename,
    remove,
    share,
    listShares,
    removeShareAccess,
} = require("../controller/documentController");

const { protect } =
    require("../middleware/auth");

const validate =
    require("../middleware/validation");

const router = express.Router();

const documentIdValidation = [
    param("id")
        .isMongoId()
        .withMessage(
            "Invalid document identifier"
        ),
];

const userIdValidation = [
    param("userId")
        .isMongoId()
        .withMessage(
            "Invalid user identifier"
        ),
];

router.use(protect);

router.get(
    "/",
    listDocuments
);

router.post(
    "/",
    [
        body("title")
            .trim()
            .notEmpty()
            .withMessage(
                "Document title is required"
            )
            .isLength({
                max: 200,
            })
            .withMessage(
                "Document title cannot exceed 200 characters"
            ),

        body("content")
            .optional()
            .isString()
            .withMessage(
                "Document content must be a string"
            ),
    ],
    validate,
    create
);

router.get(
    "/:id",
    documentIdValidation,
    validate,
    getOne
);

router.put(
    "/:id",
    [
        ...documentIdValidation,

        body("title")
            .optional()
            .isString()
            .withMessage(
                "Title must be a string"
            ),

        body("content")
            .optional()
            .isString()
            .withMessage(
                "Content must be a string"
            ),
    ],
    validate,
    update
);

router.patch(
    "/:id/title",
    [
        ...documentIdValidation,

        body("title")
            .trim()
            .notEmpty()
            .withMessage(
                "Document title is required"
            )
            .isLength({
                max: 200,
            })
            .withMessage(
                "Document title cannot exceed 200 characters"
            ),
    ],
    validate,
    rename
);

router.delete(
    "/:id",
    documentIdValidation,
    validate,
    remove
);

router.post(
    "/:id/share",
    [
        ...documentIdValidation,

        body("email")
            .trim()
            .isEmail()
            .withMessage(
                "A valid email is required"
            )
            .normalizeEmail(),

        body("permission")
            .isIn([
                "viewer",
                "editor",
            ])
            .withMessage(
                "Permission must be viewer or editor"
            ),
    ],
    validate,
    share
);

router.get(
    "/:id/shares",
    documentIdValidation,
    validate,
    listShares
);

router.delete(
    "/:id/share/:userId",
    [
        ...documentIdValidation,
        ...userIdValidation,
    ],
    validate,
    removeShareAccess
);

module.exports = router;