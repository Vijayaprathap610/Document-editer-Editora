import { Card, Badge, Button } from "react-bootstrap";

import { useNavigate } from "react-router-dom";

const formatDate = (value) => {
  if (!value) return "Unknown";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const DocumentCard = ({ document, type = "owned", onDelete }) => {
  const navigate = useNavigate();

  const isShared = type === "shared";

  const permission = document.permission;

  return (
    <Card className="document-card h-100 border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between gap-2">
          <div className="document-icon">📄</div>

          <Badge bg={isShared ? "info" : "primary"} className="document-badge">
            {isShared ? "SHARED" : "OWNED"}
          </Badge>
        </div>

        <h5 className="document-title mt-3" title={document.title}>
          {document.title}
        </h5>

        {isShared && (
          <div className="small text-muted mb-2">
            Owner:{" "}
            <strong>
              {document.owner?.name || document.owner?.email || "Unknown"}
            </strong>
          </div>
        )}

        {isShared && (
          <Badge
            bg={permission === "editor" ? "success" : "secondary"}
            className="me-2"
          >
            {permission === "editor" ? "CAN EDIT" : "VIEW ONLY"}
          </Badge>
        )}

        <div className="small text-muted mt-3">
          Updated {formatDate(document.updatedAt)}
        </div>

        <div className="d-flex gap-2 mt-4">
          <Button
            variant="primary"
            size="sm"
            className="flex-grow-1"
            onClick={() => navigate(`/documents/${document._id}`)}
          >
            Open
          </Button>

          {!isShared && onDelete && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onDelete(document)}
            >
              Delete
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default DocumentCard;
