import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Share as ShareIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

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
  onDelete?: () => void;
  onShare?: () => void;
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
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    return textContent.length > 100
      ? `${textContent.substring(0, 100)}...`
      : textContent;
  };

  // Prevent action buttons from triggering card click
  const handleActionClick = (e: React.MouseEvent, callback?: () => void) => {
    e.stopPropagation();
    if (callback) {
      callback();
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        opacity: note.archived ? 0.7 : 1,
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) => theme.shadows[4],
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
        <CardContent
          sx={{
            width: "100%",
            flexGrow: 1,
            pb: 7,
            height: { xs: 200, sm: 220, md: 250 }, // Fixed height for different breakpoints
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 500,
              mb: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              minHeight: "3.6em", // Approximately 2 lines of text
            }}
          >
            {note.title || "Untitled Note"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              mb: 2,
              flexGrow: 1,
              lineHeight: "1.5em",
            }}
          >
            {getContentPreview(note.content)}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              position: "absolute",
              bottom: showControls ? "48px" : "16px",
              left: "16px",
            }}
          >
            Last updated: {format(new Date(note.updatedAt), "MMM d, yyyy")}
          </Typography>
        </CardContent>
      </CardActionArea>
      {showControls && (
        <Box
          sx={{
            position: "absolute",
            bottom: 8,
            right: 8,
            display: "flex",
            gap: 1,
          }}
        >
          {onShare && (
            <Tooltip title="Share">
              <IconButton
                size="small"
                onClick={(e) => handleActionClick(e, onShare)}
                color="primary"
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onArchive && (
            <Tooltip title={note.archived ? "Unarchive" : "Archive"}>
              <IconButton
                size="small"
                onClick={(e) => handleActionClick(e, onArchive)}
                color="default"
              >
                {note.archived ? (
                  <UnarchiveIcon fontSize="small" />
                ) : (
                  <ArchiveIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => handleActionClick(e, onDelete)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Card>
  );
};

export default NoteCard;
