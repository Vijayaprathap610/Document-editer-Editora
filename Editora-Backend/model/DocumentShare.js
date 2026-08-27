const mongoose = require("mongoose");

const documentShareSchema = new mongoose.Schema(
    {
        document: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Document",
            required: true,
            index: true,
        },

        sharedWith: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        permission: {
            type: String,
            enum: ["viewer", "editor"],
            required: true,
            default: "viewer",
        },
    },
    {
        timestamps: true,
        collection: "document_shares",
    }
);

documentShareSchema.index(
    {
        document: 1,
        sharedWith: 1,
    },
    {
        unique: true,
    }
);

documentShareSchema.index({
    sharedWith: 1,
    updatedAt: -1,
});

module.exports = mongoose.model(
    "DocumentShare",
    documentShareSchema
);