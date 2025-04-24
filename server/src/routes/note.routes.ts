import { Router } from "express";
import {
  acceptShare,
  createNote,
  declineShare,
  deleteNote,
  getArchivedNotes,
  getNoteById,
  getNoteRevisions,
  getPendingShares,
  getSharedByMeNotes,
  getSharedNotes,
  getUserNotes,
  restoreRevision,
  revokeShare,
  searchNotes,
  shareNote,
  updateNote,
} from "../controllers/note.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { NoteService } from "../services/note.service";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate as any);

// CRUD operations
router.post("/", createNote as any);
router.get("/", getUserNotes as any);
router.get("/shared", getSharedNotes as any);
router.get("/search", searchNotes as any);

// Special note lists
router.get("/archived", getArchivedNotes as any);
router.get("/pending-shares", getPendingShares as any);
router.get("/shared-by-me", getSharedByMeNotes as any);

// Note ID-specific routes
router.get("/:id", getNoteById as any);
router.put("/:id", updateNote as any);
router.delete("/:id", deleteNote as any);

// Sharing routes
router.post("/:id/share", shareNote as any);
router.post("/share/accept/:token", acceptShare as any);
router.post("/share/decline/:token", declineShare as any);
router.post("/share/:shareId/revoke", revokeShare as any);

// Revision history routes
router.get("/:id/revisions", getNoteRevisions as any);
router.post("/:id/revisions/:revisionId/restore", restoreRevision as any);

export default router;
