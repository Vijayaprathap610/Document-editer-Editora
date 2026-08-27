const mongoose = require("mongoose");

const Document = require("../model/Document");
const DocumentShare = require("../model/DocumentShare");
const User = require("../model/User");

const sanitizeHtml = require("../utils/sanitizeHtml");

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const createHttpError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getDocumentById = async (documentId) => {
    if (!isValidObjectId(documentId)) {
        throw createHttpError(
            400,
            "Invalid document identifier"
        );
    }

    return Document.findById(documentId).populate(
        "owner",
        "name email"
    );
};

const getPermission = async (documentId, userId) => {
    if (!isValidObjectId(documentId)) {
        throw createHttpError(
            400,
            "Invalid document identifier"
        );
    }

    const document = await Document.findById(
        documentId
    ).select("owner");

    if (!document) {
        throw createHttpError(
            404,
            "Document not found"
        );
    }

    if (
        document.owner.toString() ===
        userId.toString()
    ) {
        return {
            role: "owner",
            document,
        };
    }

    const share = await DocumentShare.findOne({
        document: documentId,
        sharedWith: userId,
    });

    if (!share) {
        throw createHttpError(
            403,
            "You do not have access to this document"
        );
    }

    return {
        role: share.permission,
        document,
        share,
    };
};

const getUserDocuments = async (userId) => {
    const owned = await Document.find({
        owner: userId,
    })
        .sort({ updatedAt: -1 })
        .populate("owner", "name email")
        .lean();

    const shares = await DocumentShare.find({
        sharedWith: userId,
    })
        .sort({ updatedAt: -1 })
        .populate({
            path: "document",
            populate: {
                path: "owner",
                select: "name email",
            },
        })
        .lean();

    const shared = shares
        .filter((share) => share.document)
        .map((share) => ({
            ...share.document,
            permission: share.permission,
            sharedAt: share.createdAt,
        }));

    return {
        owned,
        shared,
    };
};

const createDocument = async ({
    userId,
    title,
    content = "",
}) => {
    const document = await Document.create({
        title: title.trim(),
        content: sanitizeHtml(content),
        owner: userId,
    });

    return Document.findById(document._id)
        .populate("owner", "name email")
        .lean();
};

const updateDocument = async ({
    documentId,
    userId,
    title,
    content,
}) => {
    const permission = await getPermission(
        documentId,
        userId
    );

    if (
        permission.role !== "owner" &&
        permission.role !== "editor"
    ) {
        throw createHttpError(
            403,
            "You do not have permission to edit this document"
        );
    }

    const updates = {};

    if (typeof title === "string") {
        const cleanTitle = title.trim();

        if (!cleanTitle) {
            throw createHttpError(
                422,
                "Document title is required"
            );
        }

        if (cleanTitle.length > 200) {
            throw createHttpError(
                422,
                "Document title cannot exceed 200 characters"
            );
        }

        updates.title = cleanTitle;
    }

    if (typeof content === "string") {
        updates.content = sanitizeHtml(content);
    }

    const document = await Document.findByIdAndUpdate(
        documentId,
        updates,
        {
            new: true,
            runValidators: true,
        }
    )
        .populate("owner", "name email")
        .lean();

    return document;
};

const renameDocument = async ({
    documentId,
    userId,
    title,
}) => {
    const permission = await getPermission(
        documentId,
        userId
    );

    if (permission.role !== "owner") {
        throw createHttpError(
            403,
            "Only the document owner can rename this document"
        );
    }

    const cleanTitle = String(title || "").trim();

    if (!cleanTitle) {
        throw createHttpError(
            422,
            "Document title is required"
        );
    }

    if (cleanTitle.length > 200) {
        throw createHttpError(
            422,
            "Document title cannot exceed 200 characters"
        );
    }

    return Document.findByIdAndUpdate(
        documentId,
        {
            title: cleanTitle,
        },
        {
            new: true,
            runValidators: true,
        }
    )
        .populate("owner", "name email")
        .lean();
};

const deleteDocument = async ({
    documentId,
    userId,
}) => {
    const permission = await getPermission(
        documentId,
        userId
    );

    if (permission.role !== "owner") {
        throw createHttpError(
            403,
            "Only the document owner can delete this document"
        );
    }

    await DocumentShare.deleteMany({
        document: documentId,
    });

    await Document.findByIdAndDelete(documentId);
};

const shareDocument = async ({
    documentId,
    userId,
    email,
    permission,
}) => {
    const documentPermission =
        await getPermission(
            documentId,
            userId
        );

    if (documentPermission.role !== "owner") {
        throw createHttpError(
            403,
            "Only the document owner can share this document"
        );
    }

    const normalizedEmail =
        String(email).trim().toLowerCase();

    const targetUser = await User.findOne({
        email: normalizedEmail,
    }).select("_id name email");

    if (!targetUser) {
        throw createHttpError(
            404,
            "No registered user exists with that email"
        );
    }

    if (
        targetUser._id.toString() ===
        userId.toString()
    ) {
        throw createHttpError(
            400,
            "You cannot share a document with yourself"
        );
    }

    const existingShare =
        await DocumentShare.findOne({
            document: documentId,
            sharedWith: targetUser._id,
        });

    if (existingShare) {
        throw createHttpError(
            409,
            "This document is already shared with that user"
        );
    }

    const share = await DocumentShare.create({
        document: documentId,
        sharedWith: targetUser._id,
        permission,
    });

    return DocumentShare.findById(share._id)
        .populate(
            "sharedWith",
            "name email"
        )
        .lean();
};

const getShares = async ({
    documentId,
    userId,
}) => {
    const documentPermission =
        await getPermission(
            documentId,
            userId
        );

    if (documentPermission.role !== "owner") {
        throw createHttpError(
            403,
            "Only the document owner can view sharing settings"
        );
    }

    return DocumentShare.find({
        document: documentId,
    })
        .populate(
            "sharedWith",
            "name email"
        )
        .sort({ createdAt: -1 })
        .lean();
};

const removeShare = async ({
    documentId,
    userId,
    targetUserId,
}) => {
    const documentPermission =
        await getPermission(
            documentId,
            userId
        );

    if (documentPermission.role !== "owner") {
        throw createHttpError(
            403,
            "Only the document owner can remove access"
        );
    }

    if (!isValidObjectId(targetUserId)) {
        throw createHttpError(
            400,
            "Invalid user identifier"
        );
    }

    const deleted =
        await DocumentShare.findOneAndDelete({
            document: documentId,
            sharedWith: targetUserId,
        });

    if (!deleted) {
        throw createHttpError(
            404,
            "Share access not found"
        );
    }
};

module.exports = {
    getPermission,
    getUserDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    renameDocument,
    deleteDocument,
    shareDocument,
    getShares,
    removeShare,
};