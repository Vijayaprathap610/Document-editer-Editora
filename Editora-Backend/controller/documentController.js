const {
    getUserDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    renameDocument,
    deleteDocument,
    shareDocument,
    getShares,
    removeShare,
    getPermission,
} = require("../services/documentService");

const {
    successResponse,
} = require("../utils/apiResponse");

const listDocuments = async (
    req,
    res,
    next
) => {
    try {
        const documents =
            await getUserDocuments(
                req.user._id
            );

        return successResponse(
            res,
            200,
            "Documents retrieved successfully",
            documents
        );
    } catch (error) {
        next(error);
    }
};

const create = async (
    req,
    res,
    next
) => {
    try {
        const document =
            await createDocument({
                userId: req.user._id,
                title: req.body.title,
                content: req.body.content || "",
            });

        return successResponse(
            res,
            201,
            "Document created successfully",
            {
                document,
            }
        );
    } catch (error) {
        next(error);
    }
};

const getOne = async (
    req,
    res,
    next
) => {
    try {
        const permission =
            await getPermission(
                req.params.id,
                req.user._id
            );

        const document =
            await getDocumentById(
                req.params.id
            );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        return successResponse(
            res,
            200,
            "Document retrieved successfully",
            {
                document,
                permission: permission.role,
            }
        );
    } catch (error) {
        next(error);
    }
};

const update = async (
    req,
    res,
    next
) => {
    try {
        const document =
            await updateDocument({
                documentId: req.params.id,
                userId: req.user._id,
                title: req.body.title,
                content: req.body.content,
            });

        return successResponse(
            res,
            200,
            "Document saved successfully",
            {
                document,
            }
        );
    } catch (error) {
        next(error);
    }
};

const rename = async (
    req,
    res,
    next
) => {
    try {
        const document =
            await renameDocument({
                documentId: req.params.id,
                userId: req.user._id,
                title: req.body.title,
            });

        return successResponse(
            res,
            200,
            "Document renamed successfully",
            {
                document,
            }
        );
    } catch (error) {
        next(error);
    }
};

const remove = async (
    req,
    res,
    next
) => {
    try {
        await deleteDocument({
            documentId: req.params.id,
            userId: req.user._id,
        });

        return successResponse(
            res,
            200,
            "Document deleted successfully"
        );
    } catch (error) {
        next(error);
    }
};

const share = async (
    req,
    res,
    next
) => {
    try {
        const shareResult =
            await shareDocument({
                documentId: req.params.id,
                userId: req.user._id,
                email: req.body.email,
                permission:
                    req.body.permission,
            });

        return successResponse(
            res,
            201,
            "Document shared successfully",
            {
                share: shareResult,
            }
        );
    } catch (error) {
        next(error);
    }
};

const listShares = async (
    req,
    res,
    next
) => {
    try {
        const shares =
            await getShares({
                documentId: req.params.id,
                userId: req.user._id,
            });

        return successResponse(
            res,
            200,
            "Document shares retrieved successfully",
            {
                shares,
            }
        );
    } catch (error) {
        next(error);
    }
};

const removeShareAccess = async (
    req,
    res,
    next
) => {
    try {
        await removeShare({
            documentId: req.params.id,
            userId: req.user._id,
            targetUserId:
                req.params.userId,
        });

        return successResponse(
            res,
            200,
            "Document access removed successfully"
        );
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listDocuments,
    create,
    getOne,
    update,
    rename,
    remove,
    share,
    listShares,
    removeShareAccess,
};