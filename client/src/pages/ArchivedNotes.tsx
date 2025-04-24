import React, { useEffect } from "react";
import { Typography, Box, CircularProgress, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import NoteCard from "../components/NoteCard";
import { useNoteStore } from "../stores/noteStore";

const ArchivedNotes: React.FC = () => {
  const {
    archivedNotes,
    isLoading,
    error,
    fetchArchivedNotes,
    unarchiveNote,
    deleteNote,
    initializeSocket,
    disconnectSocket,
  } = useNoteStore();

  const navigate = useNavigate();

  useEffect(() => {
    // Initialize the socket connection for real-time updates
    initializeSocket();

    // Fetch archived notes when component mounts
    fetchArchivedNotes();

    // Cleanup function to disconnect socket when component unmounts
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, fetchArchivedNotes, disconnectSocket]);

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const handleUnarchive = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await unarchiveNote(noteId);
  };

  const handleDelete = async (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
    }
  };

  if (isLoading && archivedNotes.length === 0) {
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
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Archived Notes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {archivedNotes.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No archived notes
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Archived notes will appear here
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {archivedNotes.map((note) => (
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
                note={note}
                onClick={() => handleNoteClick(note.id)}
                onArchive={(e: React.MouseEvent) => handleUnarchive(note.id, e)}
                onDelete={(e: React.MouseEvent) => handleDelete(note.id, e)}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ArchivedNotes;
