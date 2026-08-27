import { Card, Button } from "react-bootstrap";

const EmptyState = ({ icon = "📄", title, message, actionLabel, onAction }) => {
  return (
    <Card className="border-0 shadow-sm empty-state-card">
      <Card.Body className="text-center py-5">
        <div className="empty-state-icon">{icon}</div>

        <h5 className="mt-3">{title}</h5>

        <p className="text-muted mb-4">{message}</p>

        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default EmptyState;
