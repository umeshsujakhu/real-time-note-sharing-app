import React, { useState, useEffect, useCallback } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import {
  Save as SaveIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  RemoveCircle as RemoveCircleIcon,
} from "@mui/icons-material";
import { useNoteStore } from "../stores/noteStore";
import { useAuthStore } from "../stores/authStore";
import SharesManager from "./SharesManager";
import ShareDialog from "./ShareDialog";

interface NoteEditorProps {
  noteId: string;
  onDelete?: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onDelete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    currentNote,
    fetchNoteById,
    updateNote,
    shareNote,
    revokeShare,
    archiveNote,
    unarchiveNote,
    deleteNote,
    isLoading,
    error,
  } = useNoteStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | "unsaved"
  >("saved");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Check if we're in the shared notes view based on URL path
  const isSharedView = location.pathname.includes("/shared");

  // Check if this is a new note (no owner set yet)
  const isNewNote = !currentNote?.owner;

  // Simple permission check: allow editing if it's a new note or user is owner
  const hasEditPermission = React.useMemo(() => {
    // Always allow editing for new notes
    if (isNewNote) return true;

    // If no note or no user, no permission
    if (!currentNote || !user) return false;

    // Allow editing if user is owner
    if (currentNote.owner?.id === user.id) return true;

    // For shared notes, check edit permission
    return currentNote.permission === "edit";
  }, [currentNote, user, isNewNote]);

  // Check if the user is not the owner of the note
  const isNotOwner = currentNote && currentNote.owner?.id !== user?.id;

  // Disable editing if user doesn't have edit permission
  const isReadOnly = !hasEditPermission;

  // Load the note on component mount or when noteId changes
  useEffect(() => {
    const loadNote = async () => {
      if (noteId) {
        setTitle(""); // Clear title while loading
        setContent(""); // Clear content while loading
        setSaveStatus("saved");
        setHasChanges(false);
        await fetchNoteById(noteId);
      }
    };
    loadNote();
  }, [noteId, fetchNoteById]);

  // Update local state when note changes
  useEffect(() => {
    if (currentNote) {
      setTitle(currentNote.title || "");
      setContent(currentNote.content || "");
      setSaveStatus("saved");
      setHasChanges(false);
    }
  }, [currentNote]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasEditPermission) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    setHasChanges(true);
    setSaveStatus("unsaved");
  };

  // Handle content change
  const handleContentChange = (value: string) => {
    if (!hasEditPermission) return;
    setContent(value);
    setHasChanges(true);
    setSaveStatus("unsaved");
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      setSaveStatus("saving");
      setIsSaving(true);

      await updateNote(noteId, {
        title,
        content,
      });

      setHasChanges(false);
      setSaveStatus("saved");
      setSnackbarMessage("Changes saved");
      setSnackbarOpen(true);

      // Navigate based on note type
      if (isNewNote) {
        navigate("/dashboard");
      } else if (currentNote) {
        const isSharedNote = currentNote.owner?.id !== user?.id;
        if (isSharedNote) {
          navigate("/shared");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Error saving note:", error);
      setSaveStatus("error");
      setSnackbarMessage(
        error.response?.data?.message || "Failed to save changes"
      );
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to get current user ID
  const getUserIdFromStorage = (): string | null => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        return state?.user?.id || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting user ID from storage:", error);
      return null;
    }
  };

  // Handle archiving/unarchiving
  const handleArchiveToggle = async () => {
    if (!currentNote) return;

    try {
      if (currentNote.isArchived) {
        await unarchiveNote(noteId);
        setSnackbarMessage("Note unarchived");
      } else {
        await archiveNote(noteId);
        setSnackbarMessage("Note archived");
      }
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error toggling archive status:", err);
      setSnackbarMessage("Failed to update archive status");
      setSnackbarOpen(true);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this note? This action cannot be undone."
      )
    ) {
      try {
        await deleteNote(noteId);

        const userId = getUserIdFromStorage();
        if (currentNote && currentNote.owner.id === userId) {
          navigate("/dashboard");
        } else {
          navigate("/shared");
        }

        if (onDelete) onDelete();
      } catch (err) {
        console.error("Error deleting note:", err);
        setSnackbarMessage("Failed to delete note");
        setSnackbarOpen(true);
      }
    }
  };

  // Handle note sharing
  const handleShare = async () => {
    if (!shareEmail.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shareEmail)) {
      setSnackbarMessage("Please enter a valid email address");
      setSnackbarOpen(true);
      return;
    }

    try {
      setIsSaving(true);
      await shareNote(noteId, shareEmail, "read"); // Default to read permission
      setSnackbarMessage(`Note shared with ${shareEmail}`);
      setSnackbarOpen(true);
      setShareEmail("");
      setShowShareDialog(false);
    } catch (err) {
      console.error("Error sharing note:", err);
      setSnackbarMessage("Failed to share note");
      setSnackbarOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle revoking share
  const handleRevokeShare = async (shareId: string) => {
    try {
      await revokeShare(shareId, noteId);
      setSnackbarMessage("Share access revoked");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error revoking share:", err);
      setSnackbarMessage("Failed to revoke share");
      setSnackbarOpen(true);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Loading state
  if (isLoading || (!currentNote && noteId)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading note...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error && !currentNote) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  // No note found
  if (!currentNote) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">Note not found</Typography>
      </Box>
    );
  }

  return (
    <Box
      component={Paper}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative", // Ensure proper stacking
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          borderBottom: "1px solid rgba(0,0,0,0.12)",
          zIndex: 2, // Ensure toolbar is above content
        }}
      >
        <Box display="flex" alignItems="center">
          {saveStatus === "saving" ? (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Saving...
            </Typography>
          ) : saveStatus === "saved" ? (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              All changes saved
            </Typography>
          ) : saveStatus === "unsaved" ? (
            <Typography variant="caption" color="warning.main" sx={{ mr: 1 }}>
              Unsaved changes
            </Typography>
          ) : (
            <Typography variant="caption" color="error" sx={{ mr: 1 }}>
              Error saving
            </Typography>
          )}

          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isSaving || !hasChanges || isReadOnly}
            sx={{ ml: 1 }}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </Box>

        <Box>
          <Tooltip title="Share">
            <IconButton onClick={() => setShowShareDialog(true)}>
              <ShareIcon />
            </IconButton>
          </Tooltip>

          {/* Only show archive/unarchive and delete if user is owner */}
          {!isNotOwner && (
            <>
              <Tooltip
                title={currentNote?.isArchived ? "Unarchive" : "Archive"}
              >
                <IconButton onClick={handleArchiveToggle}>
                  {currentNote?.isArchived ? (
                    <UnarchiveIcon />
                  ) : (
                    <ArchiveIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton onClick={handleDelete} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Title */}
        <TextField
          variant="standard"
          placeholder="Untitled Note"
          value={title}
          onChange={handleTitleChange}
          disabled={!hasEditPermission}
          InputProps={{
            readOnly: !hasEditPermission,
            disableUnderline: true,
            style: {
              fontSize: "1.5rem",
              fontWeight: 600,
              padding: "16px 16px 8px 16px",
            },
          }}
          sx={{
            "& .MuiInputBase-input": {
              cursor: hasEditPermission ? "text" : "default",
            },
          }}
        />

        <Divider />

        {/* Editor */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            position: "relative",
            "& .ql-editor": {
              minHeight: "200px",
              cursor: hasEditPermission ? "text" : "default",
              backgroundColor: hasEditPermission
                ? "inherit"
                : "rgba(0, 0, 0, 0.03)",
            },
            "& .ql-container": {
              fontSize: "16px",
              border: "none",
            },
            "& .ql-toolbar": {
              display: hasEditPermission ? "block" : "none",
              border: "none",
              borderBottom: "1px solid rgba(0,0,0,0.12)",
            },
          }}
        >
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing..."
            readOnly={!hasEditPermission}
            modules={{
              toolbar: hasEditPermission
                ? [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                  ]
                : false,
            }}
            preserveWhitespace={true}
          />
        </Box>
      </Box>

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        noteId={noteId}
      />

      {/* Status Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />

      {/* Debug info */}
      {process.env.NODE_ENV === "development" && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 1,
            zIndex: 1000,
            boxShadow: 1,
          }}
        >
          <Typography variant="caption" component="div">
            Debug Info:
          </Typography>
          <Typography variant="caption" component="div">
            isNewNote: {String(isNewNote)}
          </Typography>
          <Typography variant="caption" component="div">
            hasEditPermission: {String(hasEditPermission)}
          </Typography>
          <Typography variant="caption" component="div">
            isOwner: {currentNote?.owner?.id === user?.id ? "true" : "false"}
          </Typography>
          <Typography variant="caption" component="div">
            permission: {currentNote?.permission || "none"}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NoteEditor;
