import { useRef, useState } from "react";

import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";

import api, { getApiErrorMessage } from "../services/api";

const UploadDocumentModal = ({ show, onHide, onImported }) => {
  const fileInput = useRef(null);

  const [file, setFile] = useState(null);

  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];

    setError("");
    setFile(selected || null);

    if (selected && !/\.(txt|md)$/i.test(selected.name)) {
      setError("Only .txt and .md files are supported.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please select a file.");
      return;
    }

    if (!/\.(txt|md)$/i.test(file.name)) {
      setError("Only .txt and .md files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Maximum file size is 5 MB.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    try {
      setUploading(true);
      setError("");

      const response = await api.post("/uploads/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const document = response.data?.data?.document;

      setFile(null);

      if (fileInput.current) {
        fileInput.current.value = "";
      }

      onImported?.(document);
      onHide();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to import the file."));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;

    setFile(null);
    setError("");

    if (fileInput.current) {
      fileInput.current.value = "";
    }

    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Import document</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group>
            <Form.Label>Select file</Form.Label>

            <Form.Control
              ref={fileInput}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={handleFileChange}
            />

            <Form.Text className="text-muted">
              Supported formats: .txt and .md. Maximum size: 5 MB.
            </Form.Text>
          </Form.Group>

          {file && (
            <div className="mt-3 p-3 bg-light rounded">
              <strong>{file.name}</strong>

              <div className="small text-muted">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>

          <Button type="submit" variant="primary" disabled={uploading || !file}>
            {uploading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Importing...
              </>
            ) : (
              "Import file"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UploadDocumentModal;
