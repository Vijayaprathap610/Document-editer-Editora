const sanitizeHtml = require("sanitize-html");

const sanitizeDocumentHtml = (html = "") => {
    return sanitizeHtml(html, {
        allowedTags: [
            "p",
            "br",
            "strong",
            "b",
            "em",
            "i",
            "u",
            "h1",
            "h2",
            "h3",
            "ol",
            "ul",
            "li",
            "span",
        ],

        allowedAttributes: {
            span: ["style"],
        },

        allowedStyles: {
            span: {
                "font-size": [
                    /^small$/,
                    /^normal$/,
                    /^large$/,
                    /^huge$/,
                ],
            },
        },

        disallowedTagsMode: "discard",

        parser: {
            lowerCaseTags: true,
        },
    });
};

module.exports = sanitizeDocumentHtml;