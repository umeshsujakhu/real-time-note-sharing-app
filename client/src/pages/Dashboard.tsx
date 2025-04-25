import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  Fade,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { useNoteStore } from "../stores/noteStore";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import ShareDialog from "../components/ShareDialog";
import { GridProps } from "@mui/material/Grid";

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
  sharedWith?: Array<{
    id: string;
    email: string;
  }>;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    notes,
    deleteNote,
    archiveNote,
    updateNote,
    shareNote,
    fetchNotes,
    createNote,
  } = useNoteStore();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, note: Note) => {
    setAnchorEl(event.currentTarget);
    setSelectedNote(note);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNote(null);
  };

  const handleDelete = async () => {
    if (selectedNote) {
      await deleteNote(selectedNote.id);
      handleMenuClose();
    }
  };

  const handleArchive = async () => {
    if (selectedNote) {
      await archiveNote(selectedNote.id);
      handleMenuClose();
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditDialogOpen(true);
      handleMenuClose();
    }
  };

  const handleEditSave = async () => {
    if (selectedNote) {
      await updateNote(selectedNote.id, {
        title: editTitle,
        content: editContent,
      });
      setEditDialogOpen(false);
    }
  };

  const handleShareSubmit = async (email: string) => {
    if (selectedNote) {
      await shareNote(selectedNote.id, email, "read");
      setShareDialogOpen(false);
    }
  };

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

  const filteredNotes = notes.filter((note) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Box sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            My Notes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your notes
          </Typography>
        </Box>
        <Box
          sx={{ display: "flex", gap: 2, width: { xs: "100%", sm: "auto" } }}
        >
          <TextField
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: { xs: "100%", sm: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleCreateNewNote}
            sx={{
              py: 1.5,
              px: 3,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: 600,
              background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)",
              boxShadow:
                "0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)",
              "&:hover": {
                background: "linear-gradient(90deg, #4338ca 0%, #4f46e5 100%)",
              },
            }}
          >
            New Note
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredNotes.map((note) => (
          <Grid
            key={note.id}
            size={{ xs: 12, sm: 6, md: 4 }}
            sx={{ display: "flex", width: "100%" }}
          >
            <Card
              sx={{ width: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2">
                  {note.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Last updated: {new Date(note.updatedAt).toLocaleDateString()}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/notes/${note.id}`)}
                >
                  Open Note
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Note Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          },
        }}
      >
        <MenuItem onClick={handleEdit} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShare} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleArchive} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ py: 1.5, color: "error.main" }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Note
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            sx={{
              background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)",
              "&:hover": {
                background: "linear-gradient(90deg, #4338ca 0%, #4f46e5 100%)",
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        noteId={selectedNote?.id || ""}
      />
    </Box>
  );
};

export default Dashboard;
