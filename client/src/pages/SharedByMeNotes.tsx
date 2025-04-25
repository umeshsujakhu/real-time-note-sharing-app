import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  TextField,
  Stack,
  InputAdornment,
  ListItemIcon,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  PersonRemove as PersonRemoveIcon,
  Add as AddIcon,
  AddCircle as AddIconCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useNoteStore } from "../stores/noteStore";
import { formatDistanceToNow } from "date-fns";
import ShareDialog from "../components/ShareDialog";
import NoteEditor from "../components/NoteEditor";
import { useSnackbar } from "notistack";

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

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  noteId: string;
}

interface MenuState {
  anchorEl: null | HTMLElement;
  noteId: string | null;
}

const SharedByMeNotes: React.FC = () => {
  const {
    sharedByMeNotes,
    isLoading,
    error,
    fetchSharedByMeNotes,
    revokeShare,
    isSocketConnected,
    deleteNote,
    shareNote,
    unarchiveNote,
  } = useNoteStore();

  const navigate = useNavigate();
  const [notification, setNotification] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuState, setMenuState] = useState<MenuState>({
    anchorEl: null,
    noteId: null,
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchSharedByMeNotes();

    // Listen for socket updates that affect the UI
    const unsubscribeFromStore = useNoteStore.subscribe((state, prevState) => {
      // React to changes in sharedByMeNotes
      if (prevState.sharedByMeNotes.length !== state.sharedByMeNotes.length) {
        console.log("sharedByMeNotes list updated");
      }

      // We don't need to manually update anything here since we're using the store's state directly
    });

    return () => {
      if (unsubscribeFromStore) unsubscribeFromStore();
    };
  }, [fetchSharedByMeNotes]);

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const handleRevokeShare = async (
    shareId: string,
    noteId: string,
    email: string
  ) => {
    try {
      await revokeShare(shareId, noteId);

      // Show notification
      setNotification({
        message: `Sharing revoked for ${email}`,
        severity: "success",
      });

      // We don't need to refresh here as the noteStore now directly updates the sharedByMeNotes list
    } catch (error) {
      console.error("Error revoking share:", error);
      setNotification({ message: "Error revoking share", severity: "error" });

      // Only refresh in case of error to ensure data consistency
      fetchSharedByMeNotes();
    }
  };

  const handleRefresh = () => {
    fetchSharedByMeNotes();
    setNotification({ message: "Refreshed shared notes", severity: "success" });
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleCreateNewNote = () => {
    navigate("/notes/new");
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    noteId: string
  ) => {
    event.stopPropagation();
    const note = groupedNotes.find((n) => n.note.id === noteId)?.note;
    if (note) {
      setSelectedNote(note);
      setMenuState({ anchorEl: event.currentTarget, noteId });
    }
  };

  const handleMenuClose = () => {
    setMenuState({ anchorEl: null, noteId: null });
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleUnarchive = async (noteId: string) => {
    try {
      await unarchiveNote(noteId);
      enqueueSnackbar("Note unarchived successfully", { variant: "success" });
      fetchSharedByMeNotes();
    } catch (error) {
      console.error("Error unarchiving note:", error);
      enqueueSnackbar("Failed to unarchive note", { variant: "error" });
    }
    handleMenuClose();
  };

  const handleShareSubmit = async (email: string, permission: string) => {
    try {
      await shareNote(selectedNote?.id || "", email, permission);
      enqueueSnackbar("Note shared successfully", { variant: "success" });
      fetchSharedByMeNotes();
    } catch (error) {
      console.error("Error sharing note:", error);
      enqueueSnackbar("Failed to share note", { variant: "error" });
    }
  };

  if (isLoading && sharedByMeNotes.length === 0) {
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

  // Group shares by note - filter out notes with no non-revoked shares
  const groupedNotes = sharedByMeNotes
    .filter(
      (note) => note.shares && note.shares.some((share) => !share.isRevoked)
    )
    .reduce((acc, note) => {
      if (!note.shares) return acc;

      acc.push({
        note,
        shares: note.shares.filter((share) => !share.isRevoked),
      });

      return acc;
    }, [] as { note: any; shares: any[] }[]);

  const filteredNotes = useMemo(() => {
    return groupedNotes.filter(({ note }) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    });
  }, [groupedNotes, searchQuery]);

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: { sm: "300px" } }}
        />
        <Button
          variant="contained"
          startIcon={<AddIconCircle />}
          onClick={handleCreateNewNote}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          New Note
        </Button>
      </Box>

      <Grid
        container
        spacing={3}
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 3,
          mt: 3,
        }}
      >
        {filteredNotes.map(({ note, shares }) => (
          <Grid
            key={note.id}
            component="div"
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: {
                xs: "100%",
                sm: "calc(50% - 24px)",
                md: "calc(33.333% - 24px)",
              },
              minWidth: 0,
            }}
          >
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                }}
                onClick={() => handleNoteClick(note.id)}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">
                    {note.title || "Untitled Note"}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, note.id)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="textSecondary" noWrap>
                  Shared with {shares.length}{" "}
                  {shares.length === 1 ? "person" : "people"}
                </Typography>
              </CardContent>

              <Divider />

              <List dense>
                {shares.map((share) => (
                  <ListItem key={share.id}>
                    <ListItemText
                      primary={share.email}
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <Chip
                            label={share.isAccepted ? "Accepted" : "Pending"}
                            size="small"
                            color={share.isAccepted ? "success" : "warning"}
                            variant="outlined"
                          />
                          <Chip
                            label={share.permission || "READ"}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Revoke sharing">
                        <IconButton
                          edge="end"
                          aria-label="revoke"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevokeShare(
                              share.id,
                              note.id,
                              share.email || ""
                            );
                          }}
                          color="error"
                          size="small"
                        >
                          <PersonRemoveIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Menu */}
      <Menu
        anchorEl={menuState.anchorEl}
        open={Boolean(menuState.anchorEl)}
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
        <MenuItem onClick={handleShare} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        {groupedNotes.find((n) => n.note.id === menuState.noteId)?.note
          .isArchived && (
          <MenuItem
            onClick={() =>
              menuState.noteId && handleUnarchive(menuState.noteId)
            }
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Unarchive</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <Snackbar
        open={notification !== null}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        message={notification?.message}
      />

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

export default SharedByMeNotes;
