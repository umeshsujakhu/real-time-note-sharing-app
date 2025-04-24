import { Request, Response } from "express";
import {
  NoteService,
  NoteInput,
  NoteUpdateInput,
  ShareNoteInput,
  SharePermission,
} from "../services/note.service";

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Note title
 *               content:
 *                 type: string
 *                 description: Note content (can be rich text)
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
export const createNote = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const noteData: NoteInput = req.body;
    const note = await noteService.createNote(req.currentUser.userId, noteData);

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create note";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes for the current user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeArchived
 *         schema:
 *           type: boolean
 *         description: Include archived notes
 *     responses:
 *       200:
 *         description: List of notes
 *       401:
 *         description: Unauthorized
 */
export const getUserNotes = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const includeArchived = req.query.includeArchived === "true";
    const notes = await noteService.getUserNotes(
      req.currentUser.userId,
      includeArchived
    );

    return res.status(200).json({
      success: true,
      message: "Notes retrieved successfully",
      data: notes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve notes";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/shared:
 *   get:
 *     summary: Get all notes shared with the current user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shared notes
 *       401:
 *         description: Unauthorized
 */
export const getSharedNotes = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const notes = await noteService.getSharedNotes(req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Shared notes retrieved successfully",
      data: notes,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve shared notes";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note retrieved successfully
 *       404:
 *         description: Note not found
 *       401:
 *         description: Unauthorized
 */
export const getNoteById = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const { id } = req.params;
    const note = await noteService.getNoteById(id, req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Note retrieved successfully",
      data: note,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve note";

    if (message.includes("not found") || message.includes("permission")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Note title
 *               content:
 *                 type: string
 *                 description: Note content
 *               isArchived:
 *                 type: boolean
 *                 description: Archive status
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       404:
 *         description: Note not found
 *       401:
 *         description: Unauthorized
 */
export const updateNote = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const { id } = req.params;
    const updateData: NoteUpdateInput = req.body;
    const note = await noteService.updateNote(
      id,
      req.currentUser.userId,
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update note";

    if (message.includes("not found") || message.includes("permission")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       404:
 *         description: Note not found
 *       401:
 *         description: Unauthorized
 */
export const deleteNote = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const { id } = req.params;
    await noteService.deleteNote(id, req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete note";

    if (message.includes("not found") || message.includes("permission")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/{id}/share:
 *   post:
 *     summary: Share a note with another user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - permission
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user to share with
 *               permission:
 *                 type: string
 *                 enum: [read, edit]
 *                 description: Permission level
 *     responses:
 *       200:
 *         description: Note shared successfully
 *       404:
 *         description: Note not found
 *       401:
 *         description: Unauthorized
 */
export const shareNote = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const { email, permission } = req.body;

    const shareData: ShareNoteInput = {
      noteId: id,
      email,
      permission: permission as SharePermission,
    };

    // Create noteService with socketService if available
    const noteService = new NoteService(req.socketService);

    const share = await noteService.shareNote(
      req.currentUser.userId,
      shareData
    );

    return res.status(200).json({
      success: true,
      message: "Note shared successfully",
      data: {
        shareId: share.id,
        shareToken: share.shareToken,
      },
      share: share, // Include full share data
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to share note";

    if (message.includes("not found") || message.includes("permission")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/share/accept/{token}:
 *   post:
 *     summary: Accept a note share invitation
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Share token
 *     responses:
 *       200:
 *         description: Share accepted successfully
 *       404:
 *         description: Invalid share token
 *       401:
 *         description: Unauthorized
 */
export const acceptShare = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { token } = req.params;
    // Create noteService with socketService if available
    const noteService = new NoteService(req.socketService);

    const note = await noteService.acceptSharedNote(
      token,
      req.currentUser.userId
    );

    return res.status(200).json({
      success: true,
      message: "Note share accepted successfully",
      data: note,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to accept note share";

    if (
      message.includes("Invalid") ||
      message.includes("not found") ||
      message.includes("not intended")
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/share/decline/{token}:
 *   post:
 *     summary: Decline a note share
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Share token
 *     responses:
 *       200:
 *         description: Note share declined successfully
 *       404:
 *         description: Invalid share token
 *       401:
 *         description: Unauthorized
 */
export const declineShare = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { token } = req.params;
    // Create noteService with socketService if available
    const noteService = new NoteService(req.socketService);

    await noteService.declineSharedNote(token, req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Note share declined successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to decline note share";

    if (
      message.includes("Invalid") ||
      message.includes("not found") ||
      message.includes("not intended")
    ) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/share/{shareId}/revoke:
 *   post:
 *     summary: Revoke a note share
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         schema:
 *           type: string
 *         required: true
 *         description: Share ID
 *     responses:
 *       200:
 *         description: Share revoked successfully
 *       404:
 *         description: Share not found
 *       401:
 *         description: Unauthorized
 */
export const revokeShare = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { shareId } = req.params;
    // Create noteService with socketService if available
    const noteService = new NoteService(req.socketService);

    await noteService.revokeShare(shareId, req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Note share revoked successfully",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revoke note share";

    if (message.includes("not found") || message.includes("Only the owner")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/{id}/revisions:
 *   get:
 *     summary: Get revision history for a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Revisions retrieved successfully
 *       404:
 *         description: Note not found
 *       401:
 *         description: Unauthorized
 */
export const getNoteRevisions = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const { id } = req.params;
    const revisions = await noteService.getNoteRevisions(
      id,
      req.currentUser.userId
    );

    return res.status(200).json({
      success: true,
      message: "Note revisions retrieved successfully",
      data: revisions,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve note revisions";

    if (message.includes("not found") || message.includes("permission")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/{id}/revisions/{revisionId}/restore:
 *   post:
 *     summary: Restore a note to a previous revision
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Note ID
 *       - in: path
 *         name: revisionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Revision ID
 *     responses:
 *       200:
 *         description: Note restored successfully
 *       404:
 *         description: Note or revision not found
 *       401:
 *         description: Unauthorized
 */
export const restoreRevision = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const { id, revisionId } = req.params;
    const note = await noteService.restoreRevision(
      id,
      revisionId,
      req.currentUser.userId
    );

    return res.status(200).json({
      success: true,
      message: "Note restored to previous revision successfully",
      data: note,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to restore note revision";

    if (message.includes("not found") || message.includes("permission")) {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/search:
 *   get:
 *     summary: Search notes
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *       401:
 *         description: Unauthorized
 */
export const searchNotes = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const notes = await noteService.searchNotes(req.currentUser.userId, q);

    return res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: notes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search notes";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/archived:
 *   get:
 *     summary: Get all archived notes for the current user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archived notes
 *       401:
 *         description: Unauthorized
 */
export const getArchivedNotes = async (req: Request, res: Response) => {
  try {
    // Check authentication
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    // Get user notes with includeArchived flag
    const userId = req.currentUser.userId;
    const allNotes = await noteService.getUserNotes(userId, true);

    // Filter only archived notes
    const archivedNotes = allNotes.filter((note) => note.isArchived);

    return res.status(200).json({
      success: true,
      message: "Archived notes retrieved successfully",
      data: archivedNotes,
    });
  } catch (error: any) {
    const message = error.message || "Failed to retrieve archived notes";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/pending-shares:
 *   get:
 *     summary: Get pending note shares for the current user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending note shares
 *       401:
 *         description: Unauthorized
 */
export const getPendingShares = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    console.log(
      `Controller: Getting pending shares for user ${req.currentUser.userId}`
    );

    // Get pending shares for the current user
    const pendingShares = await noteService.getPendingShares(
      req.currentUser.userId
    );

    console.log(
      `Controller: Returning ${pendingShares.length} pending shares to client`
    );

    return res.status(200).json({
      success: true,
      message: "Pending shares retrieved successfully",
      count: pendingShares.length,
      data: pendingShares,
    });
  } catch (error: any) {
    console.error("Error in pending shares controller:", error);
    const message = error.message || "Failed to retrieve pending shares";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};

/**
 * @swagger
 * /api/notes/shared-by-me:
 *   get:
 *     summary: Get all notes that the current user has shared with others
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notes shared by the current user
 *       401:
 *         description: Unauthorized
 */
export const getSharedByMeNotes = async (req: Request, res: Response) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const noteService = new NoteService(req.socketService);
    const notes = await noteService.getSharedByMeNotes(req.currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Notes shared by you retrieved successfully",
      data: notes,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to retrieve notes shared by you";
    return res.status(400).json({
      success: false,
      message,
    });
  }
};
