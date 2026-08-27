import { Button, Container } from "react-bootstrap";

import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <Container className="py-5 text-center">
      <div className="not-found">
        <div className="display-1 fw-bold">404</div>

        <h1>Page not found</h1>

        <p className="text-muted">The page you're looking for doesn't exist.</p>

        <Button as={Link} to="/dashboard" variant="primary">
          Back to Dashboard
        </Button>
      </div>
    </Container>
  );
};

export default NotFound;
