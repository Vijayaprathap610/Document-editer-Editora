const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Document title is required"],
            trim: true,
            maxlength: 200,
        },

        content: {
            type: String,
            default: "",
            maxlength: 1000000,
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "documents",
    }
);

documentSchema.index({
    owner: 1,
    updatedAt: -1,
});

module.exports = mongoose.model("Document", documentSchema);