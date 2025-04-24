import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import NoteEditor from "../components/NoteEditor";

const Notes: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();

  const handleDeleteSuccess = () => {
    // Navigate back to the dashboard after a note is deleted
    navigate("/");
  };

  if (!noteId) {
    // If no noteId is provided, redirect to the dashboard
    navigate("/");
    return null;
  }

  return (
    <Box sx={{ height: "calc(100vh - 80px)" }}>
      <NoteEditor noteId={noteId} onDelete={handleDeleteSuccess} />
    </Box>
  );
};

export default Notes;
