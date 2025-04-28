import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  CardContent,
  Typography,
  IconButton,
  Card,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useNoteStore } from "../stores/noteStore";
import { useNavigate } from "react-router-dom";
import NoteCard from "../components/NoteCard";
import ShareDialog from "../components/ShareDialog";
import { useSnackbar } from "notistack";

interface ShareInfo {
  id: string;
  email?: string;
  isAccepted: boolean;
  isRevoked?: boolean;
  permission?: string;
  sharedWith?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface Note {
  id: string;
  title: string;
  content: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
  };
  version: number;
  shares?: ShareInfo[];
  permission?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const {
    notes,
    deleteNote,
    archiveNote,
    shareNote,
    fetchNotes,
    createNote,
    unarchiveNote,
  } = useNoteStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNewNote = async () => {
    try {
      const noteId = await createNote({
        title: "Untitled Note",
        content: "",
      });
      if (noteId) {
        navigate(`/notes/${noteId}`);
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const handleDelete = async (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete);
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleArchive = async (noteId: string, isArchived: boolean) => {
    if (isArchived) {
      await unarchiveNote(noteId);
    } else {
      await archiveNote(noteId);
    }
  };

  const handleMenuOpen = (e: React.MouseEvent, note: Note) => {
    // Implement menu open logic
  };

  const filteredNotes = notes.filter(
    (note) =>
      !note.isArchived &&
      (note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Search and New Note Bar */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <TextField
          fullWidth
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flexGrow: 1,
            maxWidth: { sm: "300px" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          onClick={handleCreateNewNote}
          startIcon={<AddIcon />}
          sx={{
            whiteSpace: "nowrap",
            minWidth: "fit-content",
          }}
        >
          New Note
        </Button>
      </Box>

      {/* Notes Grid */}
      <Grid container spacing={3} sx={{ minHeight: 0 }}>
        {filteredNotes.map((note) => (
          <Grid key={note.id} item xs={12} sm={6} md={4}>
            <NoteCard
              note={{
                ...note,
                archived: note.isArchived,
              }}
              onClick={() => handleNoteClick(note.id)}
              onShare={() => {
                setSelectedNote(note);
                setShareDialogOpen(true);
              }}
              onDelete={() => handleDelete(note.id)}
              onArchive={() => handleArchive(note.id, note.isArchived)}
            />
          </Grid>
        ))}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Note</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this note? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setSelectedNote(null);
        }}
        noteId={selectedNote?.id || ""}
      />
    </Box>
  );
};

export default Dashboard;
