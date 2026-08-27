import { useCallback, useEffect, useState } from "react";

import { Alert, Button, Col, Container, Row, Spinner } from "react-bootstrap";

import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";

import api, { getApiErrorMessage } from "../services/api";

import DocumentCard from "../components/DocumentCard";

import EmptyState from "../components/EmptyState";

import UploadDocumentModal from "../components/UploadDocumentModal";

const Dashboard = () => {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [documents, setDocuments] = useState({
    owned: [],
    shared: [],
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showUpload, setShowUpload] = useState(false);

  const [creating, setCreating] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/documents");

      const data = response.data?.data || {};

      setDocuments({
        owned: data.owned || [],
        shared: data.shared || [],
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load your documents."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const createDocument = async () => {
    try {
      setCreating(true);

      const response = await api.post("/documents", {
        title: "Untitled document",
        content: "<p></p>",
      });

      const document = response.data?.data?.document;

      if (document?._id) {
        toast.success("Document created.");

        navigate(`/documents/${document._id}`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to create document."));
    } finally {
      setCreating(false);
    }
  };

  const deleteDocument = async (document) => {
    const confirmed = window.confirm(
      `Delete "${document.title}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/documents/${document._id}`);

      toast.success("Document deleted.");

      await loadDocuments();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to delete document."));
    }
  };

  const handleImported = (document) => {
    if (document?._id) {
      toast.success("File imported successfully.");

      navigate(`/documents/${document._id}`);
    }
  };

  return (
    <Container fluid="lg" className="py-4 py-lg-5">
      <div className="dashboard-hero mb-5">
        <div>
          <div className="eyebrow">YOUR WORKSPACE</div>

          <h1 className="display-6 fw-bold">
            Welcome, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>

          <p className="text-muted mb-0">
            Create, edit and securely share your documents.
          </p>
        </div>

        <div className="dashboard-actions mt-4 mt-md-0">
          <Button variant="outline-primary" onClick={() => setShowUpload(true)}>
            <span className="me-2">↑</span>
            Import File
          </Button>

          <Button
            variant="primary"
            onClick={createDocument}
            disabled={creating}
          >
            {creating ? (
              <>
                <Spinner size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              <>
                <span className="me-2">+</span>
                New Document
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}

          <div className="mt-2">
            <Button size="sm" variant="outline-danger" onClick={loadDocuments}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {loading ? (
        <div className="py-5 text-center">
          <Spinner animation="border" variant="primary" />

          <p className="text-muted mt-3">Loading documents...</p>
        </div>
      ) : (
        <>
          <section className="mb-5">
            <div className="section-heading">
              <div>
                <h2>My Documents</h2>

                <p>Documents you own and control.</p>
              </div>

              <span className="section-count">{documents.owned.length}</span>
            </div>

            {documents.owned.length === 0 ? (
              <EmptyState
                icon="✨"
                title="Your workspace is empty"
                message="Create your first document and start writing."
                actionLabel="Create document"
                onAction={createDocument}
              />
            ) : (
              <Row className="g-4">
                {documents.owned.map((document) => (
                  <Col key={document._id} xs={12} sm={6} lg={4}>
                    <DocumentCard
                      document={document}
                      type="owned"
                      onDelete={deleteDocument}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </section>

          <section>
            <div className="section-heading">
              <div>
                <h2>Shared With Me</h2>

                <p>Documents other users shared with you.</p>
              </div>

              <span className="section-count">{documents.shared.length}</span>
            </div>

            {documents.shared.length === 0 ? (
              <EmptyState
                icon="🤝"
                title="No shared documents"
                message="Documents shared with you will appear here."
              />
            ) : (
              <Row className="g-4">
                {documents.shared.map((document) => (
                  <Col key={document._id} xs={12} sm={6} lg={4}>
                    <DocumentCard document={document} type="shared" />
                  </Col>
                ))}
              </Row>
            )}
          </section>
        </>
      )}

      <UploadDocumentModal
        show={showUpload}
        onHide={() => setShowUpload(false)}
        onImported={handleImported}
      />
    </Container>
  );
};

export default Dashboard;
