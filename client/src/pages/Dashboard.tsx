import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Fab,
  Snackbar,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import NoteCard from "../components/NoteCard";
import ShareDialog from "../components/ShareDialog";
import SearchBar from "../components/SearchBar";
import { useNoteStore } from "../stores/noteStore";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
  };
  version: number;
  isArchived: boolean;
}

const Dashboard: React.FC = () => {
  const {
    notes,
    searchResults,
    searchQuery,
    isLoading,
    error,
    fetchNotes,
    createNote,
    deleteNote,
    archiveNote,
    initializeSocket,
    disconnectSocket,
    set,
  } = useNoteStore();

  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the socket connection for real-time updates
    initializeSocket();

    // Fetch notes when component mounts
    fetchNotes();

    // Cleanup function to disconnect socket when component unmounts
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, fetchNotes, disconnectSocket]);

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const handleCreateNewNote = async () => {
    try {
      const newNoteId = await createNote({
        title: "Untitled Note",
        content: "",
      });

      if (newNoteId) {
        // Wait a brief moment to ensure the note is fully created
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Navigate to the new note
        navigate(`/notes/${newNoteId}`);
      } else {
        setNotification("Failed to create new note");
      }
    } catch (error) {
      console.error("Error creating new note:", error);
      setNotification("Failed to create new note");
    }
  };

  const handleDeleteNote = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
    }
  };

  const handleArchiveNote = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await archiveNote(noteId);
  };

  const handleShareNote = (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNoteId(noteId);
    setShareDialogOpen(true);
  };

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false);
    setSelectedNoteId(null);
    // Refresh notes to show any new sharing status
    fetchNotes();
    setNotification("Share settings updated");
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Determine which notes to display based on search state
  const displayedNotes = searchQuery ? searchResults : notes;

  if (isLoading && notes.length === 0 && searchResults.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="relative">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          My Notes
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNewNote}
        >
          New Note
        </Button>
      </Box>

      <SearchBar />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {displayedNotes.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          {searchQuery ? (
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No notes found matching "{searchQuery}"
            </Typography>
          ) : (
            <>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                You don't have any notes yet
              </Typography>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                Create your first note to get started
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateNewNote}
                sx={{ mt: 2 }}
              >
                Create Note
              </Button>
            </>
          )}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {displayedNotes.map((note) => (
            <Box
              key={note.id}
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc(50% - 12px)",
                  md: "calc(33.33% - 16px)",
                  lg: "calc(25% - 18px)",
                },
                mb: 2,
              }}
            >
              <NoteCard
                note={{
                  ...note,
                  archived: note.isArchived,
                }}
                onClick={() => handleNoteClick(note.id)}
                onDelete={(e: React.MouseEvent) => handleDeleteNote(note.id, e)}
                onArchive={() =>
                  handleArchiveNote(note.id, {} as React.MouseEvent)
                }
                onShare={(e: React.MouseEvent) => handleShareNote(note.id, e)}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Share Dialog */}
      {selectedNoteId && (
        <ShareDialog
          open={shareDialogOpen}
          onClose={handleCloseShareDialog}
          noteId={selectedNoteId}
        />
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification !== null}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        message={notification}
      />

      {/* Mobile floating action button for creating new notes */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleCreateNewNote}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: { xs: "flex", sm: "none" },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Dashboard;
