import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import { useNavigate } from "react-router-dom";
import { useNoteStore } from "../stores/noteStore";

const SharedByMeNotes: React.FC = () => {
  const {
    sharedByMeNotes,
    isLoading,
    error,
    fetchSharedByMeNotes,
    revokeShare,
    isSocketConnected,
  } = useNoteStore();

  const navigate = useNavigate();
  const [notification, setNotification] = useState<string | null>(null);

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
      setNotification(`Sharing revoked for ${email}`);

      // We don't need to refresh here as the noteStore now directly updates the sharedByMeNotes list
    } catch (error) {
      console.error("Error revoking share:", error);
      setNotification("Error revoking share");

      // Only refresh in case of error to ensure data consistency
      fetchSharedByMeNotes();
    }
  };

  const handleRefresh = () => {
    fetchSharedByMeNotes();
    setNotification("Refreshed shared notes");
  };

  const handleCloseNotification = () => {
    setNotification(null);
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

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4" component="h1">
          Shared by Me
        </Typography>

        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {!isSocketConnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Real-time updates not available. Manual refresh may be needed.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {groupedNotes.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No shared notes
          </Typography>
          <Typography variant="body1" color="textSecondary">
            You haven't shared any notes with others yet
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {groupedNotes.map(({ note, shares }) => (
            <Paper key={note.id} elevation={2} sx={{ overflow: "hidden" }}>
              <Box
                p={2}
                sx={{
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                }}
                onClick={() => handleNoteClick(note.id)}
              >
                <Typography variant="h6">
                  {note.title || "Untitled Note"}
                </Typography>
                <Typography variant="body2" color="textSecondary" noWrap>
                  Shared with {shares.length}{" "}
                  {shares.length === 1 ? "person" : "people"}
                </Typography>
              </Box>

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
                          onClick={() =>
                            handleRevokeShare(
                              share.id,
                              note.id,
                              share.email || ""
                            )
                          }
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
            </Paper>
          ))}
        </Box>
      )}

      <Snackbar
        open={notification !== null}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        message={notification}
      />
    </Box>
  );
};

export default SharedByMeNotes;
