import React from "react";
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Box,
  Chip,
  Avatar,
} from "@mui/material";
import { format } from "date-fns";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from "@mui/icons-material";

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
  shareToken?: string;
  shareId?: string;
}

interface PendingShareCardProps {
  note: Note;
  onAccept: (token: string) => Promise<void>;
  onReject?: (token: string) => Promise<void>;
}

const PendingShareCard: React.FC<PendingShareCardProps> = ({
  note,
  onAccept,
  onReject,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  // Handle accepting a share
  const handleAccept = async () => {
    if (!note.shareToken) return;

    setIsLoading(true);
    try {
      await onAccept(note.shareToken);
    } catch (error) {
      console.error("Error accepting share:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rejecting a share
  const handleReject = async () => {
    if (!note.shareToken) return;

    setIsLoading(true);
    try {
      if (onReject) {
        await onReject(note.shareToken);
      }
    } catch (error) {
      console.error("Error rejecting share:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert HTML content to plain text for preview
  const getContentPreview = (content: string): string => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // Limit to 100 characters for preview
    return textContent.length > 100
      ? `${textContent.substring(0, 100)}...`
      : textContent;
  };

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "transform 0.2s, box-shadow 0.2s",
        position: "relative",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
        }}
      >
        <Chip label="Pending" size="small" color="primary" variant="outlined" />
      </Box>

      <CardContent sx={{ width: "100%", flexGrow: 1, pt: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>
            <PersonIcon />
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            Shared by {note.owner.name}
          </Typography>
        </Box>

        <Typography
          gutterBottom
          variant="h6"
          component="div"
          noWrap
          sx={{
            fontWeight: 500,
            mb: 1,
          }}
        >
          {note.title || "Untitled Note"}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "-webkit-box",
            overflow: "hidden",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            mb: 2,
            height: "4.5em", // Approximately 3 lines
            lineHeight: "1.5em",
          }}
        >
          {getContentPreview(note.content)}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: "auto" }}
        >
          Shared on: {format(new Date(note.updatedAt), "MMM d, yyyy")}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", p: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={handleReject}
          disabled={isLoading || !onReject || !note.shareToken}
          color="error"
          size="small"
        >
          Decline
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckIcon />}
          onClick={handleAccept}
          disabled={isLoading || !note.shareToken}
          color="primary"
          size="small"
        >
          {isLoading ? "Processing..." : "Accept"}
        </Button>
      </CardActions>
    </Card>
  );
};

export default PendingShareCard;
