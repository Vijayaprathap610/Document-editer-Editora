const successResponse = (
    res,
    statusCode,
    message,
    data = undefined
) => {
    const response = {
        success: true,
        message,
    };

    if (data !== undefined) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

const errorResponse = (
    res,
    statusCode,
    message,
    errors = undefined
) => {
    const response = {
        success: false,
        message,
    };

    if (errors !== undefined) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

module.exports = {
    successResponse,
    errorResponse,
};