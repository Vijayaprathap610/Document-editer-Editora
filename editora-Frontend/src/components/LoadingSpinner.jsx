import { Spinner } from "react-bootstrap";

const LoadingSpinner = ({ message = "Loading...", fullScreen = false }) => {
  return (
    <div className={fullScreen ? "loading-screen" : "loading-container"}>
      <Spinner animation="border" variant="primary" />

      <span className="mt-3 text-muted">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
