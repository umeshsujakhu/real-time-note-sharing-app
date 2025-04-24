import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  PersonRemove as PersonRemoveIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useNoteStore } from "../stores/noteStore";

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

interface SharesManagerProps {
  noteId: string;
  shares?: ShareInfo[];
  hideShareButton?: boolean;
}

const SharesManager: React.FC<SharesManagerProps> = ({
  noteId,
  shares = [],
  hideShareButton = false,
}) => {
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("read");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [confirmRevokeDialogOpen, setConfirmRevokeDialogOpen] = useState(false);
  const [shareToRevoke, setShareToRevoke] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [error, setError] = useState("");

  const { shareNote, revokeShare, fetchNoteById } = useNoteStore();

  const activeShares = shares.filter((share) => !share.isRevoked);

  const handleShareNote = async () => {
    if (!shareEmail.trim()) {
      setError("Email is required");
      return;
    }

    try {
      await shareNote(noteId, shareEmail, sharePermission);
      setShareEmail("");
      setShareDialogOpen(false);
      // Refresh note to get updated shares
      fetchNoteById(noteId);
    } catch (error: any) {
      console.error("Error sharing note:", error);
      setError(error.response?.data?.message || "Failed to share note");
    }
  };

  const handleRevokeShare = async () => {
    if (!shareToRevoke) return;

    try {
      await revokeShare(shareToRevoke.id, noteId);
      setConfirmRevokeDialogOpen(false);
      setShareToRevoke(null);
      // Refresh note to get updated shares
      fetchNoteById(noteId);
    } catch (error: any) {
      console.error("Error revoking share:", error);
      setError(error.response?.data?.message || "Failed to revoke share");
    }
  };

  const openRevokeConfirmDialog = (shareId: string, email: string) => {
    setShareToRevoke({ id: shareId, email });
    setConfirmRevokeDialogOpen(true);
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">Sharing</Typography>
        {!hideShareButton && (
          <Button
            startIcon={<ShareIcon />}
            onClick={() => setShareDialogOpen(true)}
            variant="outlined"
            size="small"
          >
            Share Note
          </Button>
        )}
      </Box>

      {activeShares.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          This note is not shared with anyone.
        </Typography>
      ) : (
        <List dense>
          {activeShares.map((share) => (
            <ListItem key={share.id}>
              <ListItemText
                primary={share.email || share.sharedWith?.email}
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
                      openRevokeConfirmDialog(
                        share.id,
                        share.email || share.sharedWith?.email || ""
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
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
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
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              error={!!error}
              helperText={error}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="permission-label">Permission</InputLabel>
              <Select
                labelId="permission-label"
                id="permission"
                value={sharePermission}
                label="Permission"
                onChange={(e) => setSharePermission(e.target.value)}
              >
                <MenuItem value="read">Read only</MenuItem>
                <MenuItem value="edit">Can edit</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleShareNote} variant="contained">
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Revoke Dialog */}
      <Dialog
        open={confirmRevokeDialogOpen}
        onClose={() => setConfirmRevokeDialogOpen(false)}
      >
        <DialogTitle>Confirm Revoke</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to revoke sharing with {shareToRevoke?.email}?
            They will no longer have access to this note.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRevokeDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRevokeShare} color="error" variant="contained">
            Revoke Access
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SharesManager;
