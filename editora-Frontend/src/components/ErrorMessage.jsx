import { Alert } from "react-bootstrap";

const ErrorMessage = ({ message, onRetry }) => {
  if (!message) {
    return null;
  }

  return (
    <Alert
      variant="danger"
      className="d-flex justify-content-between align-items-center"
    >
      <span>{message}</span>

      {onRetry && (
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </Alert>
  );
};

export default ErrorMessage;
