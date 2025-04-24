import { Repository } from "typeorm";
import { Note } from "../models/Note";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { NoteShare } from "../models/NoteShare";
import { NoteRevision } from "../models/NoteRevision";
import { v4 as uuidv4 } from "uuid";
import { SocketService } from "./socket.service";

// Define SharePermission enum if it doesn't exist in a separate file
export enum SharePermission {
  READ = "read",
  EDIT = "edit",
}

export interface NoteInput {
  title: string;
  content: string;
}

export interface NoteUpdateInput {
  title?: string;
  content?: string;
  isArchived?: boolean;
}

export interface ShareNoteInput {
  noteId: string;
  email: string;
  permission: SharePermission;
}

export class NoteService {
  private noteRepository: Repository<Note>;
  private userRepository: Repository<User>;
  private noteShareRepository: Repository<NoteShare>;
  private revisionRepository: Repository<NoteRevision>;
  private socketService: SocketService | null = null;

  constructor(socketService?: SocketService) {
    this.noteRepository = AppDataSource.getRepository(Note);
    this.userRepository = AppDataSource.getRepository(User);
    this.noteShareRepository = AppDataSource.getRepository(NoteShare);
    this.revisionRepository = AppDataSource.getRepository(NoteRevision);
    this.socketService = socketService || null;
  }

  /**
   * Create a new note
   */
  async createNote(userId: string, noteData: NoteInput): Promise<Note> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    const note = this.noteRepository.create({
      ...noteData,
      owner: user,
      ownerId: userId,
      version: 1,
    });

    await this.noteRepository.save(note);

    // Create initial revision
    const revision = this.revisionRepository.create({
      content: noteData.content,
      version: 1,
      note,
      noteId: note.id,
      user,
      userId,
    });

    await this.revisionRepository.save(revision);

    return note;
  }

  /**
   * Get all notes for a user
   */
  async getUserNotes(userId: string, includeArchived = false): Promise<Note[]> {
    const query = this.noteRepository
      .createQueryBuilder("note")
      .leftJoinAndSelect("note.owner", "owner")
      .where("note.ownerId = :userId", { userId });

    if (!includeArchived) {
      query.andWhere("note.isArchived = :isArchived", { isArchived: false });
    }

    return query.getMany();
  }

  /**
   * Get shared notes for a user
   */
  async getSharedNotes(userId: string): Promise<Note[]> {
    const shares = await this.noteShareRepository.find({
      where: {
        sharedWithId: userId,
        isAccepted: true,
        isRevoked: false,
      },
      relations: ["note", "note.owner"],
    });

    // Map the shares to notes and include permission at root level
    return shares.map((share) => {
      const note = share.note;
      // Add permission to root level and remove shares
      (note as any).permission = share.permission;
      return note;
    });
  }

  /**
   * Get a note by ID
   */
  async getNoteById(noteId: string, userId: string): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ["owner", "shares", "shares.sharedWith"],
    });

    if (!note) {
      throw new Error("Note not found");
    }

    // Check if user is owner or has access
    if (note.ownerId !== userId) {
      const share = note.shares.find(
        (s) => s.sharedWithId === userId && !s.isRevoked && s.isAccepted
      );

      if (!share) {
        throw new Error("You do not have permission to access this note");
      }

      console.log("Setting non-owner permission:", {
        noteId,
        userId,
        permission: share.permission,
      });

      // Add permission to root level and remove shares
      (note as any).permission = share.permission;
    } else {
      console.log("Setting owner permission:", {
        noteId,
        userId,
        permission: "edit",
      });
      // Owner has full edit permission
      (note as any).permission = "edit";
    }

    // Clear shares array
    note.shares = [];
    return note;
  }

  /**
   * Update a note
   */
  async updateNote(
    noteId: string,
    userId: string,
    updateData: NoteUpdateInput
  ): Promise<Note> {
    // Get the note with shares
    const note = await this.noteRepository.findOne({
      where: { id: noteId },
      relations: ["owner", "shares", "shares.sharedWith"],
    });

    if (!note) {
      throw new Error("Note not found");
    }

    // Check permissions
    const isOwner = note.ownerId === userId;
    const share = note.shares?.find(
      (s) => s.sharedWithId === userId && !s.isRevoked && s.isAccepted
    );

    // Allow update if user is owner or has edit permission
    if (!isOwner && (!share || share.permission !== SharePermission.EDIT)) {
      throw new Error("You do not have permission to edit this note");
    }

    // Create a revision if content changed
    if (updateData.content && updateData.content !== note.content) {
      const newVersion = note.incrementVersion();

      const revision = this.revisionRepository.create({
        content: note.content, // Save previous content
        version: newVersion - 1,
        note,
        noteId,
        userId,
      });

      await this.revisionRepository.save(revision);
    }

    // Update note
    Object.assign(note, updateData);
    const updatedNote = await this.noteRepository.save(note);

    // Add permission info for response
    if (!isOwner && share) {
      (updatedNote as any).permission = share.permission;
    } else {
      (updatedNote as any).permission = SharePermission.EDIT;
    }

    return updatedNote;
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, userId: string): Promise<void> {
    const note = await this.getNoteById(noteId, userId);

    // Only owner can delete
    if (note.ownerId !== userId) {
      throw new Error("Only the owner can delete this note");
    }

    try {
      // First delete all revisions to avoid foreign key constraint errors
      await this.revisionRepository
        .createQueryBuilder()
        .delete()
        .from(NoteRevision)
        .where("noteId = :noteId", { noteId })
        .execute();

      // Then delete any shares
      await this.noteShareRepository
        .createQueryBuilder()
        .delete()
        .from(NoteShare)
        .where("noteId = :noteId", { noteId })
        .execute();

      // Finally delete the note itself
      await this.noteRepository.remove(note);
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error(
        "Failed to delete note: " + (error.message || "Database error")
      );
    }
  }

  /**
   * Share a note with another user
   */
  async shareNote(
    userId: string,
    shareData: ShareNoteInput
  ): Promise<NoteShare> {
    const { noteId, email, permission = SharePermission.READ } = shareData;

    // Check if user is the owner of the note
    const note = await this.getNoteById(noteId, userId);

    if (note.owner.id !== userId) {
      throw new Error("Only the owner can share this note");
    }

    // Check if user exists with this email
    const targetUser = await this.userRepository.findOne({ where: { email } });

    // Create share
    const share = this.noteShareRepository.create({
      noteId,
      email,
      permission,
      shareToken: uuidv4(),
      isAccepted: false,
      isRevoked: false,
    });

    // Set relationships separately
    share.note = note;

    // If user exists, also save their ID
    if (targetUser) {
      share.sharedWithId = targetUser.id;
      share.sharedWith = targetUser;
    }

    await this.noteShareRepository.save(share);

    // Send socket notification if the socket service is available
    // and the target user exists
    if (this.socketService && targetUser) {
      const ownerUser = await this.userRepository.findOne({
        where: { id: userId },
      });
      const sharerName = ownerUser
        ? ownerUser.name || ownerUser.email
        : "Someone";

      this.socketService.notifyNoteShared(targetUser.id, noteId, sharerName);
    }

    return share;
  }

  /**
   * Accept a shared note
   */
  async acceptSharedNote(token: string, userId: string): Promise<Note> {
    const share = await this.noteShareRepository.findOne({
      where: { shareToken: token },
      relations: ["note", "note.owner"],
    });

    if (!share) {
      throw new Error("Invalid share token");
    }

    if (share.isRevoked) {
      throw new Error("This share has been revoked");
    }

    if (share.isAccepted) {
      throw new Error("This share has already been accepted");
    }

    // If share has a specific user ID, check it
    if (share.sharedWithId && share.sharedWithId !== userId) {
      throw new Error("This share was not intended for you");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify email matches if it was shared by email
    if (share.email && share.email !== user.email) {
      throw new Error("This share was intended for a different email address");
    }

    // Link share to user if not already
    share.sharedWithId = userId;
    share.sharedWith = user;
    share.isAccepted = true;
    await this.noteShareRepository.save(share);

    // Notify the note owner that the share was accepted via socket
    if (this.socketService && share.note.owner) {
      this.socketService.sendUserNotification(
        share.note.owner.id,
        `${user.name || user.email} accepted your shared note`,
        {
          noteId: share.note.id,
          action: "share-accepted",
          acceptedBy: {
            id: user.id,
            name: user.name || user.email,
          },
        }
      );
    }

    return share.note;
  }

  /**
   * Revoke a note share
   */
  async revokeShare(shareId: string, userId: string): Promise<void> {
    const share = await this.noteShareRepository.findOne({
      where: { id: shareId },
      relations: ["note", "note.owner", "sharedWith"],
    });

    if (!share) {
      throw new Error("Share not found");
    }

    // Verify user is the note owner
    const note = await this.getNoteById(share.noteId, userId);
    if (note.owner.id !== userId) {
      throw new Error("Only the owner can revoke shares");
    }

    share.isRevoked = true;
    await this.noteShareRepository.save(share);

    // Notify the user whose access was revoked
    if (this.socketService && share.sharedWithId) {
      // Send a notification to the user whose access was revoked
      this.socketService.sendUserNotification(
        share.sharedWithId,
        `Access to a shared note has been revoked`,
        {
          noteId: share.noteId,
          action: "share-revoked",
          noteTitle: note.title,
          shareId: share.id, // Include the shareId for more targeted updates
        }
      );

      // Emit a share-updated event to all clients for real-time updates
      this.socketService.broadcastShareUpdate({
        noteId: share.noteId,
        shareId: share.id,
        revoked: true,
        share: {
          ...share,
          note: { id: share.noteId, title: note.title }, // Include minimal note info
        },
      });
    }

    // Also notify the owner about the successful revocation
    if (this.socketService) {
      this.socketService.sendUserNotification(
        userId,
        `Share with ${share.email || share.sharedWith?.email} was revoked`,
        {
          noteId: share.noteId,
          action: "share-revoked-by-owner",
          shareId: share.id,
        }
      );
    }
  }

  /**
   * Get note revision history
   */
  async getNoteRevisions(
    noteId: string,
    userId: string
  ): Promise<NoteRevision[]> {
    // Verify access
    await this.getNoteById(noteId, userId);

    return this.revisionRepository.find({
      where: { noteId },
      order: { version: "DESC" },
      relations: ["user"],
    });
  }

  /**
   * Restore a previous revision
   */
  async restoreRevision(
    noteId: string,
    revisionId: string,
    userId: string
  ): Promise<Note> {
    const note = await this.getNoteById(noteId, userId);

    // Check edit permission if not owner
    if (note.ownerId !== userId) {
      const share = note.shares.find(
        (s) => s.sharedWithId === userId && !s.isRevoked && s.isAccepted
      );

      if (!share || share.permission !== SharePermission.EDIT) {
        throw new Error("You do not have permission to edit this note");
      }
    }

    const revision = await this.revisionRepository.findOne({
      where: { id: revisionId, noteId },
    });

    if (!revision) {
      throw new Error("Revision not found");
    }

    // Save current content as a revision
    const newVersion = note.incrementVersion();

    const newRevision = this.revisionRepository.create({
      content: note.content,
      version: newVersion - 1,
      note,
      noteId,
      userId,
    });

    await this.revisionRepository.save(newRevision);

    // Update note with revision content
    note.content = revision.content;
    await this.noteRepository.save(note);

    return note;
  }

  /**
   * Search notes
   */
  async searchNotes(userId: string, query: string): Promise<Note[]> {
    // Search owned notes
    const ownedNotes = await this.noteRepository
      .createQueryBuilder("note")
      .leftJoinAndSelect("note.owner", "owner")
      .where("note.ownerId = :userId", { userId })
      .andWhere("(note.title ILIKE :query OR note.content ILIKE :query)", {
        query: `%${query}%`,
      })
      .andWhere("note.isArchived = :isArchived", { isArchived: false })
      .getMany();

    // Search shared notes
    const sharedNoteIds = await this.noteShareRepository
      .createQueryBuilder("share")
      .select("share.noteId")
      .where("share.sharedWithId = :userId", { userId })
      .andWhere("share.isAccepted = :isAccepted", { isAccepted: true })
      .andWhere("share.isRevoked = :isRevoked", { isRevoked: false })
      .getMany();

    if (sharedNoteIds.length === 0) {
      return ownedNotes;
    }

    const sharedNotes = await this.noteRepository
      .createQueryBuilder("note")
      .leftJoinAndSelect("note.owner", "owner")
      .where("note.id IN (:...ids)", {
        ids: sharedNoteIds.map((n) => n.noteId),
      })
      .andWhere("(note.title ILIKE :query OR note.content ILIKE :query)", {
        query: `%${query}%`,
      })
      .andWhere("note.isArchived = :isArchived", { isArchived: false })
      .getMany();

    return [...ownedNotes, ...sharedNotes];
  }

  /**
   * Get pending shared notes for a user
   */
  async getPendingShares(userId: string): Promise<any[]> {
    console.log(`Getting pending shares for user: ${userId}`);

    // First try to get shares by user ID
    const sharesByUserId = await this.noteShareRepository.find({
      where: {
        sharedWithId: userId,
        isAccepted: false,
        isRevoked: false,
      },
      relations: ["note", "note.owner"],
    });
    console.log(`Found ${sharesByUserId.length} shares by user ID`);
    sharesByUserId.forEach((share) => {
      console.log(
        `Share by ID: noteId=${share.note.id} shareId=${share.id} token=${share.shareToken}`
      );
    });

    // Then get the user email to find shares by email
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    // Get shares by email that aren't already accepted
    const sharesByEmail = await this.noteShareRepository.find({
      where: {
        email: user.email,
        sharedWithId: null, // Not yet linked to a user
        isAccepted: false,
        isRevoked: false,
      },
      relations: ["note", "note.owner"],
    });
    console.log(
      `Found ${sharesByEmail.length} shares by email (${user.email})`
    );
    sharesByEmail.forEach((share) => {
      console.log(
        `Share by email: noteId=${share.note.id} shareId=${share.id} token=${share.shareToken}`
      );
    });

    // Use a Map to ensure each note is only included once
    // If a note has multiple shares, keep the one that has a token
    const sharesMap = new Map();

    // Process all shares and keep track of them by noteId
    [...sharesByUserId, ...sharesByEmail].forEach((share) => {
      const noteId = share.note.id;

      // Only add if we don't already have this note or if this share has a token
      // and the existing one doesn't
      if (
        !sharesMap.has(noteId) ||
        (share.shareToken && !sharesMap.get(noteId).shareToken)
      ) {
        sharesMap.set(noteId, {
          ...share.note,
          shareToken: share.shareToken,
          shareId: share.id,
        });
      }
    });

    const result = Array.from(sharesMap.values());
    console.log(`Returning ${result.length} unique pending shares`);

    // Convert Map to array
    return result;
  }

  /**
   * Decline a shared note
   */
  async declineSharedNote(token: string, userId: string): Promise<void> {
    const share = await this.noteShareRepository.findOne({
      where: { shareToken: token },
      relations: ["note", "note.owner"],
    });

    if (!share) {
      throw new Error("Invalid share token");
    }

    if (share.isRevoked) {
      throw new Error("This share has been revoked");
    }

    if (share.isAccepted) {
      throw new Error(
        "This share has already been accepted and cannot be declined"
      );
    }

    // If share has a specific user ID, check it
    if (share.sharedWithId && share.sharedWithId !== userId) {
      throw new Error("This share was not intended for you");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify email matches if it was shared by email
    if (share.email && share.email !== user.email) {
      throw new Error("This share was intended for a different email address");
    }

    // Mark the share as declined
    share.isRevoked = true; // Using isRevoked to indicate the share is no longer valid
    share.sharedWithId = userId;
    share.sharedWith = user;
    await this.noteShareRepository.save(share);

    // Notify the note owner that the share was declined via socket
    if (this.socketService && share.note.owner) {
      this.socketService.sendUserNotification(
        share.note.owner.id,
        `${user.name || user.email} declined your shared note`,
        {
          noteId: share.note.id,
          action: "share-declined",
          declinedBy: {
            id: user.id,
            name: user.name || user.email,
          },
        }
      );
    }
  }

  /**
   * Get notes shared by a user
   */
  async getSharedByMeNotes(userId: string): Promise<Note[]> {
    // Get all notes owned by the user
    const userNotes = await this.noteRepository.find({
      where: { ownerId: userId },
      relations: ["owner", "shares", "shares.sharedWith"],
    });

    // Filter notes that have active shares
    return userNotes.filter(
      (note) => note.shares && note.shares.some((share) => !share.isRevoked)
    );
  }
}
