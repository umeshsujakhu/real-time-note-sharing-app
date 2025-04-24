import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Box,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { ArchiveOutlined, ArchiveRounded } from "@mui/icons-material";

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
  archived: boolean;
}

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onArchive?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  onShare?: (e: React.MouseEvent) => void;
  showControls?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onArchive,
  onDelete,
  onShare,
  showControls = true,
}) => {
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

  // Prevent action buttons from triggering card click
  const handleActionClick = (
    e: React.MouseEvent,
    callback?: (e: React.MouseEvent) => void
  ) => {
    e.stopPropagation();
    if (callback) {
      callback(e);
    }
  };

  // Prevent the card click when clicking archive button
  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onArchive) onArchive();
  };

  // Prevent the card click when clicking share button
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) onShare(e);
  };

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        opacity: note.archived ? 0.7 : 1,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          height: "100%",
        }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1 }}>
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
            Last updated: {format(new Date(note.updatedAt), "MMM d, yyyy")}
          </Typography>
        </CardContent>
      </CardActionArea>
      {showControls && (
        <Box
          sx={{
            position: "absolute",
            bottom: 4,
            right: 4,
            display: "flex",
            gap: 1,
          }}
        >
          {onShare && (
            <Tooltip title="Share">
              <IconButton
                size="small"
                onClick={handleShareClick}
                aria-label="share"
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onArchive && (
            <Tooltip title={note.archived ? "Unarchive" : "Archive"}>
              <IconButton
                size="small"
                onClick={handleArchiveClick}
                aria-label={note.archived ? "unarchive" : "archive"}
              >
                {note.archived ? (
                  <ArchiveRounded fontSize="small" />
                ) : (
                  <ArchiveOutlined fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => handleActionClick(e, onDelete)}
                aria-label="delete"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="More">
            <IconButton
              size="small"
              onClick={(e) => e.stopPropagation()}
              aria-label="more options"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Card>
  );
};

export default NoteCard;
