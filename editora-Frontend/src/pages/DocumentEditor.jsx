import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Container,
  Dropdown,
  Spinner,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAuth } from "../context/AuthContext";
import api, { getApiErrorMessage } from "../services/api";
import ShareModal from "../components/ShareModal";

const DocumentEditor = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const editorRef = useRef(null);

  const [document, setDocument] = useState(null);
  const [title, setTitle] = useState("");
  const [permission, setPermission] = useState("viewer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saveStatus, setSaveStatus] = useState("saved"); // 'saving' | 'saved' | 'unsaved'
  const [showShareModal, setShowShareModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const isOwner = permission === "owner";
  const canEdit = permission === "owner" || permission === "editor";

  // Calculate word and character count
  const updateCounts = (text) => {
    const plainText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    setCharCount(plainText ? plainText.length : 0);
    const words = plainText ? plainText.split(" ").filter(Boolean).length : 0;
    setWordCount(words);
  };

  // Fetch document details
  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/documents/${documentId}`);
      const doc = response.data?.data?.document;
      const userPerm = response.data?.data?.permission || "viewer";

      if (!doc) {
        setError("Document not found.");
        return;
      }

      setDocument(doc);
      setTitle(doc.title || "Untitled document");
      setPermission(userPerm);

      if (editorRef.current) {
        editorRef.current.innerHTML = doc.content || "<p><br></p>";
      }
      updateCounts(doc.content || "");
      setSaveStatus("saved");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load document."));
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Handle saving content & title
  const handleSave = useCallback(async (showToast = false) => {
    if (!canEdit || !editorRef.current) return;

    try {
      setSaveStatus("saving");
      const currentContent = editorRef.current.innerHTML;

      const response = await api.put(`/documents/${documentId}`, {
        title: title.trim() || "Untitled document",
        content: currentContent,
      });

      const updated = response.data?.data?.document;
      if (updated) {
        setDocument(updated);
      }
      setSaveStatus("saved");
      if (showToast) {
        toast.success("Document saved.");
      }
    } catch (err) {
      setSaveStatus("unsaved");
      toast.error(getApiErrorMessage(err, "Unable to save document."));
    }
  }, [canEdit, documentId, title]);

  // Auto-save debounce
  useEffect(() => {
    if (saveStatus !== "unsaved" || !canEdit) return;

    const timer = setTimeout(() => {
      handleSave(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [saveStatus, canEdit, handleSave]);

  // Handle content changes
  const handleContentInput = () => {
    if (!canEdit || !editorRef.current) return;
    setSaveStatus("unsaved");
    updateCounts(editorRef.current.innerHTML);
  };

  // Handle title rename
  const handleTitleBlur = async () => {
    if (!canEdit) return;
    const cleanTitle = title.trim() || "Untitled document";
    setTitle(cleanTitle);

    if (cleanTitle !== document?.title) {
      try {
        setSaveStatus("saving");
        if (isOwner) {
          await api.patch(`/documents/${documentId}/title`, {
            title: cleanTitle,
          });
        } else {
          await api.put(`/documents/${documentId}`, {
            title: cleanTitle,
            content: editorRef.current?.innerHTML || "",
          });
        }
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("unsaved");
        toast.error(getApiErrorMessage(err, "Failed to update title."));
      }
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  // Formatting commands for toolbar
  const formatDoc = (command, value = null) => {
    if (!canEdit) return;
    window.document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleContentInput();
    }
  };

  // Download document
  const handleDownload = (format = "html") => {
    const content = editorRef.current ? editorRef.current.innerHTML : "";
    let blob;
    let filename = `${title.replace(/[^a-z0-9_-]/gi, "_") || "document"}`;

    if (format === "html") {
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${content}
</body>
</html>`;
      blob = new Blob([fullHtml], { type: "text/html" });
      filename += ".html";
    } else {
      const tempEl = window.document.createElement("div");
      tempEl.innerHTML = content;
      const text = `${title}\n\n${tempEl.innerText || tempEl.textContent || ""}`;
      blob = new Blob([text], { type: "text/plain" });
      filename += ".txt";
    }

    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete document
  const handleDelete = async () => {
    if (!isOwner) return;
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/documents/${documentId}`);
      toast.success("Document deleted.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Unable to delete document."));
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-3">Loading document...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error loading document</Alert.Heading>
          <p>{error}</p>
          <hr />
          <Button variant="outline-danger" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="editor-page">
      <Container fluid="lg">
        <div className="editor-shell">
          {/* Header */}
          <div className="editor-header">
            <div className="editor-title-area">
              <Button
                variant="light"
                className="back-button rounded-circle"
                onClick={() => navigate("/dashboard")}
                title="Back to Dashboard"
              >
                ←
              </Button>

              <div className="flex-grow-1 min-w-0">
                <input
                  type="text"
                  className="form-control document-title-input"
                  value={title}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setSaveStatus("unsaved");
                  }}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  placeholder="Untitled document"
                />

                <div className="editor-meta">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} characters</span>
                  {document?.updatedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Last edited{" "}
                        {new Date(document.updatedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="editor-actions">
              {canEdit && (
                <div className="me-2">
                  {saveStatus === "saving" && (
                    <span className="saving-indicator">
                      <Spinner size="sm" className="me-1" /> Saving...
                    </span>
                  )}
                  {saveStatus === "saved" && (
                    <span className="saved-indicator">✓ Saved</span>
                  )}
                  {saveStatus === "unsaved" && (
                    <span className="text-warning small">● Unsaved</span>
                  )}
                </div>
              )}

              {canEdit && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={saveStatus === "saving"}
                >
                  Save
                </Button>
              )}

              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-secondary"
                  size="sm"
                  id="dropdown-download"
                >
                  Export
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleDownload("html")}>
                    Download as HTML (.html)
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleDownload("txt")}>
                    Download as Plain Text (.txt)
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {isOwner && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowShareModal(true)}
                >
                  Share
                </Button>
              )}

              {isOwner && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleDelete}
                  title="Delete Document"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Owner info / Permission bar */}
          <div className="editor-owner-bar d-flex justify-content-between align-items-center">
            <div>
              <span className="me-2">
                Owner:{" "}
                <strong>
                  {document?.owner?.name || document?.owner?.email || user?.name}
                </strong>
              </span>
              <Badge
                bg={
                  permission === "owner"
                    ? "primary"
                    : permission === "editor"
                    ? "success"
                    : "secondary"
                }
              >
                {permission.toUpperCase()}
              </Badge>
            </div>

            {!canEdit && (
              <span className="text-muted small">
                🔒 You have view-only access to this document.
              </span>
            )}
          </div>

          {/* Rich Editor Component */}
          <div className={`rich-editor ${!canEdit ? "readonly-editor" : ""}`}>
            {/* Toolbar */}
            {canEdit && (
              <div className="ql-toolbar p-2 d-flex flex-wrap gap-1 align-items-center border-bottom bg-light">
                <ButtonGroup size="sm" className="me-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("bold")}
                    title="Bold"
                    className="fw-bold px-2"
                  >
                    B
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("italic")}
                    title="Italic"
                    className="fst-italic px-2"
                  >
                    I
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("underline")}
                    title="Underline"
                    className="text-decoration-underline px-2"
                  >
                    U
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("strikeThrough")}
                    title="Strikethrough"
                    className="text-decoration-line-through px-2"
                  >
                    S
                  </Button>
                </ButtonGroup>

                <ButtonGroup size="sm" className="me-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("formatBlock", "<h1>")}
                    title="Heading 1"
                  >
                    H1
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("formatBlock", "<h2>")}
                    title="Heading 2"
                  >
                    H2
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("formatBlock", "<h3>")}
                    title="Heading 3"
                  >
                    H3
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("formatBlock", "<p>")}
                    title="Normal Paragraph"
                  >
                    P
                  </Button>
                </ButtonGroup>

                <ButtonGroup size="sm" className="me-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("insertUnorderedList")}
                    title="Bullet List"
                  >
                    • List
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("insertOrderedList")}
                    title="Numbered List"
                  >
                    1. List
                  </Button>
                </ButtonGroup>

                <ButtonGroup size="sm" className="me-2">
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("justifyLeft")}
                    title="Align Left"
                  >
                    ⇤
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("justifyCenter")}
                    title="Align Center"
                  >
                    ⇥⇤
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("justifyRight")}
                    title="Align Right"
                  >
                    ⇥
                  </Button>
                </ButtonGroup>

                <ButtonGroup size="sm">
                  <Button
                    variant="outline-secondary"
                    onClick={() => formatDoc("removeFormat")}
                    title="Clear Formatting"
                  >
                    Clear
                  </Button>
                </ButtonGroup>
              </div>
            )}

            {/* Editable Content */}
            <div className="ql-container">
              <div
                ref={editorRef}
                className="ql-editor"
                contentEditable={canEdit}
                suppressContentEditableWarning={true}
                onInput={handleContentInput}
                placeholder={canEdit ? "Type your content here..." : ""}
                style={{
                  outline: "none",
                  minHeight: "60vh",
                  cursor: canEdit ? "text" : "default",
                }}
              />
            </div>
          </div>
        </div>
      </Container>

      {/* Share modal */}
      {isOwner && (
        <ShareModal
          show={showShareModal}
          documentId={documentId}
          onHide={() => setShowShareModal(false)}
          onChanged={fetchDocument}
        />
      )}
    </div>
  );
};

export default DocumentEditor;

