const fs = require("fs/promises");
const path = require("path");

const {
    createDocument,
} = require("../services/documentService");

const {
    successResponse,
} = require("../utils/apiResponse");

const uploadImport = async (
    req,
    res,
    next
) => {
    let uploadedPath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a .txt or .md file",
            });
        }

        uploadedPath = req.file.path;

        const extension = path
            .extname(req.file.originalname)
            .toLowerCase();

        if (![".txt", ".md"].includes(extension)) {
            return res.status(400).json({
                success: false,
                message:
                    "Only .txt and .md files are supported",
            });
        }

        const rawContent =
            await fs.readFile(
                req.file.path,
                "utf8"
            );

        const title = path
            .basename(
                req.file.originalname,
                extension
            )
            .trim()
            .slice(0, 200) || "Imported document";

        /*
         * Text and Markdown are intentionally imported
         * as escaped/plain text paragraphs rather than
         * interpreting arbitrary HTML.
         */
        const escapedContent =
            rawContent
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\r\n/g, "\n")
                .replace(/\n/g, "<br>");

        const document =
            await createDocument({
                userId: req.user._id,
                title,
                content: `<p>${escapedContent}</p>`,
            });

        return successResponse(
            res,
            201,
            "File imported successfully",
            {
                document,
            }
        );
    } catch (error) {
        next(error);
    } finally {
        if (uploadedPath) {
            try {
                await fs.unlink(
                    uploadedPath
                );
            } catch {
                // Temporary upload cleanup failure
                // must not replace the original response.
            }
        }
    }
};

module.exports = {
    uploadImport,
};