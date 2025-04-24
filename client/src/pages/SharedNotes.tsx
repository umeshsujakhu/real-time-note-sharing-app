import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Divider,
  Button,
  Snackbar,
  Paper,
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
import NoteCard from "../components/NoteCard";
import PendingShareCard from "../components/PendingShareCard";
import { useNoteStore } from "../stores/noteStore";

const SharedNotes: React.FC = () => {
  const {
    sharedNotes,
    pendingShares,
    sharedByMeNotes,
    isLoading,
    error,
    fetchSharedNotes,
    fetchPendingShares,
    fetchSharedByMeNotes,
    acceptShare,
    declineShare,
    revokeShare,
    isSocketConnected,
  } = useNoteStore();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "byMe">(
    "active"
  );
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    // Fetch shared notes when component mounts
    fetchSharedNotes();
    fetchPendingShares();
    fetchSharedByMeNotes();

    // Subscribe to store changes to react immediately to share updates
    const unsubscribeFromStore = useNoteStore.subscribe((state, prevState) => {
      // Check if sharedNotes array has changed (like when a note is revoked)
      if (state.sharedNotes.length !== prevState.sharedNotes.length) {
        console.log("Shared notes list updated");
      }

      // Check if pendingShares has changed
      if (state.pendingShares.length !== prevState.pendingShares.length) {
        console.log("Pending shares list updated");
      }
    });

    // Set up a refresh interval if socket is not connected
    const intervalId = setInterval(() => {
      if (!isSocketConnected) {
        console.log("Socket not connected, fetching shares manually");
        fetchPendingShares();
        fetchSharedByMeNotes();
      }
    }, 30000); // Check every 30 seconds if socket is not connected

    return () => {
      clearInterval(intervalId);
      if (unsubscribeFromStore) unsubscribeFromStore();
    };
  }, [
    fetchSharedNotes,
    fetchPendingShares,
    fetchSharedByMeNotes,
    isSocketConnected,
  ]);

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const handleAcceptShare = async (token: string) => {
    try {
      await acceptShare(token);
      // Refresh both lists after accepting
      fetchSharedNotes();
      fetchPendingShares();
      setNotification("Share accepted successfully");
    } catch (error) {
      console.error("Error accepting share:", error);
      setNotification("Error accepting share");
    }
  };

  const handleDeclineShare = async (token: string) => {
    try {
      await declineShare(token);
      setNotification("Share declined successfully");
    } catch (error) {
      console.error("Error declining share:", error);
      setNotification("Error declining share");
    }
  };

  const handleRevokeShare = async (
    shareId: string,
    noteId: string,
    email: string
  ) => {
    try {
      await revokeShare(shareId, noteId);
      setNotification(`Sharing revoked for ${email}`);
    } catch (error) {
      console.error("Error revoking share:", error);
      setNotification("Error revoking share");
    }
  };

  const handleRefresh = () => {
    fetchSharedNotes();
    fetchPendingShares();
    fetchSharedByMeNotes();
    setNotification("Refreshed shared notes");
  };

  const handleTabChange = (
    _: React.SyntheticEvent,
    newValue: "active" | "pending" | "byMe"
  ) => {
    setActiveTab(newValue);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  if (
    isLoading &&
    sharedNotes.length === 0 &&
    pendingShares.length === 0 &&
    sharedByMeNotes.length === 0
  ) {
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

  // Group shares by note for the "Shared by Me" tab
  const groupedSharedByMeNotes = sharedByMeNotes.reduce((acc, note) => {
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
          Shared Notes
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

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab
          value="active"
          label={`Shared with Me (${sharedNotes.length})`}
          id="shared-tab-active"
        />
        <Tab
          value="pending"
          label={`Pending (${pendingShares.length})`}
          id="shared-tab-pending"
          sx={{
            position: "relative",
            "&::after":
              pendingShares.length > 0
                ? {
                    content: '""',
                    position: "absolute",
                    width: 8,
                    height: 8,
                    bgcolor: "error.main",
                    borderRadius: "50%",
                    top: 12,
                    right: 12,
                  }
                : {},
          }}
        />
        <Tab
          value="byMe"
          label={`Shared by Me (${sharedByMeNotes.length})`}
          id="shared-tab-by-me"
        />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {activeTab === "active" && (
        <>
          {sharedNotes.length === 0 ? (
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
                Notes shared with you will appear here once accepted
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {sharedNotes.map((note) => (
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
                  />
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {activeTab === "pending" && (
        <>
          {pendingShares.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
            >
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No pending shares
              </Typography>
              <Typography variant="body1" color="textSecondary">
                When someone shares a note with you, you'll see it here
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {pendingShares.map((note) => (
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
                  <PendingShareCard
                    note={note}
                    onAccept={handleAcceptShare}
                    onReject={
                      "shareToken" in note ? handleDeclineShare : undefined
                    }
                  />
                </Box>
              ))}
            </Box>
          )}
        </>
      )}

      {activeTab === "byMe" && (
        <>
          {groupedSharedByMeNotes.length === 0 ? (
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
              {groupedSharedByMeNotes.map(({ note, shares }) => (
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
                                label={
                                  share.isAccepted ? "Accepted" : "Pending"
                                }
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
        </>
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

export default SharedNotes;
