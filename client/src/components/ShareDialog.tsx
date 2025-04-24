import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import SharesManager from "./SharesManager";
import { useNoteStore } from "../stores/noteStore";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  noteId: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ open, onClose, noteId }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("read");
  const [error, setError] = useState("");

  const { shareNote, fetchNoteById, currentNote } = useNoteStore();

  // Fetch note data when dialog opens
  useEffect(() => {
    if (open && noteId) {
      fetchNoteById(noteId);
    }
  }, [open, noteId, fetchNoteById]);

  const handleShare = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      await shareNote(noteId, email, permission);
      setEmail("");
      setError("");
      // Refresh note data
      fetchNoteById(noteId);
      onClose();
    } catch (err: any) {
      console.error("Error sharing note:", err);
      setError(err.response?.data?.message || "Failed to share note");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Note</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Enter the email address of the person you want to share this note
          with.
        </DialogContentText>
        <Box sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            id="email"
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            helperText={error}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="permission-label">Permission</InputLabel>
            <Select
              labelId="permission-label"
              id="permission"
              value={permission}
              label="Permission"
              onChange={(e) => setPermission(e.target.value)}
            >
              <MenuItem value="read">Read only</MenuItem>
              <MenuItem value="edit">Can edit</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mt: 3, mb: 1 }}>
          <SharesManager
            noteId={noteId}
            hideShareButton={true}
            shares={currentNote?.shares || []}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleShare} variant="contained" color="primary">
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
