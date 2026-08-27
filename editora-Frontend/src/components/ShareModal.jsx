import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Form,
  ListGroup,
  Modal,
  Spinner,
} from "react-bootstrap";

import api, { getApiErrorMessage } from "../services/api";

const ShareModal = ({ show, documentId, onHide, onChanged }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadShares = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/documents/${documentId}/shares`);
      setShares(response.data?.data?.shares || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load sharing settings."));
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (show && documentId) {
      loadShares();
      setEmail("");
      setPermission("viewer");
    }
  }, [show, documentId, loadShares]);

  const handleShare = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter a user email.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post(`/documents/${documentId}/share`, {
        email: email.trim().toLowerCase(),
        permission,
      });

      setEmail("");
      await loadShares();
      onChanged?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to share the document."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this user's access?")) {
      return;
    }

    try {
      setError("");
      await api.delete(`/documents/${documentId}/share/${userId}`);
      await loadShares();
      onChanged?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to remove access."));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Share document</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleShare} className="share-form">
          <Form.Group className="mb-3">
            <Form.Label>User email</Form.Label>

            <Form.Control
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Permission</Form.Label>

            <Form.Select
              value={permission}
              onChange={(event) => setPermission(event.target.value)}
            >
              <option value="viewer">Viewer — read only</option>
              <option value="editor">Editor — can edit</option>
            </Form.Select>
          </Form.Group>

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" className="me-2" />
                Sharing...
              </>
            ) : (
              "Share document"
            )}
          </Button>
        </Form>

        <hr className="my-4" />

        <h6>People with access</h6>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : shares.length === 0 ? (
          <p className="text-muted">This document has not been shared yet.</p>
        ) : (
          <ListGroup>
            {shares.map((share) => (
              <ListGroup.Item
                key={share._id}
                className="d-flex justify-content-between align-items-center flex-wrap gap-2"
              >
                <div>
                  <strong>{share.sharedWith?.name}</strong>
                  <div className="small text-muted">
                    {share.sharedWith?.email}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Badge
                    bg={share.permission === "editor" ? "success" : "secondary"}
                  >
                    {share.permission}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleRemove(share.sharedWith?._id)}
                  >
                    Remove
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ShareModal;
