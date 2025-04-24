import { create } from "zustand";
import api from "../services/api";
import io, { Socket } from "socket.io-client";

// Global socket instance to ensure we maintain a single connection
let globalSocket: Socket | null = null;

// Define a user interface
interface User {
  id: string;
  email: string;
  name?: string;
}

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

export interface NoteInput {
  title: string;
  content: string;
}

export interface NoteUpdateInput {
  title?: string;
  content?: string;
  isArchived?: boolean;
}

interface NoteState {
  notes: Note[];
  sharedNotes: Note[];
  archivedNotes: Note[];
  pendingShares: Note[];
  sharedByMeNotes: Note[];
  currentNote: Note | null;
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
  isSocketConnected: boolean;
  user: User | null;
  searchResults: Note[];
  searchQuery: string;

  // Actions
  initializeSocket: () => void;
  disconnectSocket: () => void;
  fetchNotes: () => Promise<void>;
  fetchSharedNotes: () => Promise<void>;
  fetchArchivedNotes: () => Promise<void>;
  fetchSharedByMeNotes: () => Promise<void>;
  fetchNoteById: (id: string) => Promise<void>;
  createNote: (data: NoteInput) => Promise<string | null>;
  updateNote: (id: string, data: NoteUpdateInput) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  unarchiveNote: (id: string) => Promise<void>;
  shareNote: (
    noteId: string,
    email: string,
    permission: string
  ) => Promise<void>;
  clearError: () => void;
  acceptShare: (shareToken: string) => Promise<void>;
  declineShare: (shareToken: string) => Promise<void>;
  revokeShare: (shareId: string, noteId: string) => Promise<void>;
  fetchPendingShares: () => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useNoteStore = create<NoteState>()((set, get) => ({
  notes: [],
  sharedNotes: [],
  archivedNotes: [],
  pendingShares: [],
  sharedByMeNotes: [],
  currentNote: null,
  isLoading: false,
  error: null,
  socket: null,
  isSocketConnected: false,
  user: null,
  searchResults: [],
  searchQuery: "",

  initializeSocket: () => {
    try {
      // If we already have a global socket, use it
      if (globalSocket && globalSocket.connected) {
        console.log("Using existing socket connection:", globalSocket.id);
        set({ socket: globalSocket, isSocketConnected: true });
        return;
      }

      // Get token for authentication
      const authStorage = localStorage.getItem("auth-storage");
      const authData = authStorage ? JSON.parse(authStorage).state : null;
      const token = authData?.token;
      const user = authData?.user;

      // Set the user in state
      if (user) {
        set({ user });
      }

      if (!token) {
        console.warn("No auth token found for socket.io connection");
        return;
      }

      console.log("Initializing socket connection with token");

      // Create a new socket connection
      globalSocket = io("/", {
        path: "/socket.io",
        autoConnect: true,
        withCredentials: true,
        auth: {
          token, // Send token for authentication
        },
      });

      globalSocket.on("connect", () => {
        console.log("Socket connected:", globalSocket?.id);
        set({ isSocketConnected: true });

        // When connected, immediately fetch the shared notes to ensure we have the latest data
        get().fetchSharedNotes();
        get().fetchPendingShares();
      });

      globalSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        set({ isSocketConnected: false });
      });

      globalSocket.on("disconnect", () => {
        console.log("Socket disconnected");
        set({ isSocketConnected: false });
      });

      globalSocket.on("note:update", (updatedNote: Note) => {
        const { notes, sharedNotes, archivedNotes, currentNote } = get();

        // Update notes array if the note exists there
        if (notes.some((note) => note.id === updatedNote.id)) {
          set({
            notes: notes.map((note) =>
              note.id === updatedNote.id ? updatedNote : note
            ),
          });
        }

        // Update shared notes array if the note exists there
        if (sharedNotes.some((note) => note.id === updatedNote.id)) {
          set({
            sharedNotes: sharedNotes.map((note) =>
              note.id === updatedNote.id ? updatedNote : note
            ),
          });
        }

        // Update archived notes array if the note exists there
        if (archivedNotes.some((note) => note.id === updatedNote.id)) {
          set({
            archivedNotes: archivedNotes.map((note) =>
              note.id === updatedNote.id ? updatedNote : note
            ),
          });
        }

        // Update current note if it's the one that was updated
        if (currentNote && currentNote.id === updatedNote.id) {
          set({ currentNote: updatedNote });
        }
      });

      // Listen for note deletion events
      globalSocket.on("note:delete", (deletedNoteId: string) => {
        const { notes, sharedNotes, archivedNotes, currentNote } = get();

        set({
          notes: notes.filter((note) => note.id !== deletedNoteId),
          sharedNotes: sharedNotes.filter((note) => note.id !== deletedNoteId),
          archivedNotes: archivedNotes.filter(
            (note) => note.id !== deletedNoteId
          ),
          // If the current note is deleted, set it to null
          currentNote:
            currentNote && currentNote.id === deletedNoteId
              ? null
              : currentNote,
        });
      });

      // Listen for new note events
      globalSocket.on("note:create", (newNote: Note) => {
        const { notes } = get();
        set({ notes: [...notes, newNote] });
      });

      // Add new socket events for note sharing
      globalSocket.on("note:shared", (sharedNote: Note) => {
        console.log("Received note:shared event", sharedNote);
        // Add to sharedNotes if not already there
        const { sharedNotes } = get();
        if (!sharedNotes.some((note) => note.id === sharedNote.id)) {
          set({ sharedNotes: [...sharedNotes, sharedNote] });
        }
      });

      // Listen for when shares are accepted or revoked
      globalSocket.on(
        "share:updated",
        (data: {
          noteId: string;
          shareId: string;
          accepted?: boolean;
          revoked?: boolean;
          share?: any;
        }) => {
          console.log("Received share:updated event", data);

          // IMPORTANT: Immediately refresh all affected lists to ensure UI is up-to-date
          get().fetchSharedNotes();
          get().fetchPendingShares();
          get().fetchSharedByMeNotes();

          const { currentNote, sharedNotes, sharedByMeNotes } = get();

          // If shares were revoked
          if (data.revoked) {
            // For the recipient: Remove from sharedNotes if this user lost access
            set({
              sharedNotes: sharedNotes.filter(
                (note) => note.id !== data.noteId
              ),
            });

            // For the sharer: Update sharedByMeNotes
            if (sharedByMeNotes.some((note) => note.id === data.noteId)) {
              // Update sharedByMeNotes to remove the revoked share
              const updatedSharedByMeNotes = sharedByMeNotes.map((note) => {
                if (note.id === data.noteId && note.shares && data.shareId) {
                  // Remove the specific revoked share
                  const updatedShares = note.shares.filter(
                    (share) => share.id !== data.shareId
                  );

                  return {
                    ...note,
                    shares: updatedShares,
                  };
                }
                return note;
              });

              // Remove notes with no active shares from the list
              const filteredSharedByMeNotes = updatedSharedByMeNotes.filter(
                (note) => note.shares && note.shares.length > 0
              );

              set({ sharedByMeNotes: filteredSharedByMeNotes });
            }

            // If viewing the note that was revoked, redirect if needed
            if (currentNote && currentNote.id === data.noteId) {
              // Check if we still have access to this note
              const isMine = currentNote.owner?.id === get().user?.id;
              if (!isMine) {
                // This is a shared note that was revoked, redirect
                window.location.href = "/dashboard";
              } else {
                // We're the owner, just update the shares list
                if (currentNote.shares) {
                  set({
                    currentNote: {
                      ...currentNote,
                      shares: currentNote.shares.filter(
                        (s) => s.id !== data.shareId
                      ),
                    },
                  });
                }
              }
            }
          }

          // If shares were accepted, update relevant state
          if (data.accepted) {
            // Update share status in currentNote if we're viewing it
            if (
              currentNote &&
              currentNote.id === data.noteId &&
              currentNote.shares
            ) {
              const updatedShares = currentNote.shares.map((share) => {
                if (share.id === data.shareId) {
                  return { ...share, isAccepted: true };
                }
                return share;
              });

              set({
                currentNote: {
                  ...currentNote,
                  shares: updatedShares,
                },
              });
            }

            // Update sharedByMeNotes when a share is accepted
            if (sharedByMeNotes.some((note) => note.id === data.noteId)) {
              get().fetchSharedByMeNotes();
            }
          }
        }
      );

      // Listen for note-shared events sent directly to a user
      globalSocket.on(
        "note-shared",
        async (data: { noteId: string; sharedBy: string }) => {
          console.log("Received note-shared event:", data);

          // Immediately refresh all lists for real-time updates
          await Promise.all([
            get().fetchSharedNotes(),
            get().fetchPendingShares(),
            get().fetchSharedByMeNotes(),
          ]);

          // Show a notification (you could integrate with a UI notification system)
          console.log(`Note was shared with you by ${data.sharedBy}`);

          // You could use the browser's notification API for a native notification
          if (Notification.permission === "granted") {
            new Notification("New Note Shared", {
              body: `${data.sharedBy} shared a note with you`,
            });
          }
        }
      );

      // Listen for general user notifications
      globalSocket.on(
        "notification",
        (data: {
          message: string;
          noteId?: string;
          action?: string;
          sharedWith?: string;
          shareId?: string;
        }) => {
          console.log("Received notification:", data);

          // For ALL share-related notifications, immediately refresh lists
          if (data.action && data.action.startsWith("share-")) {
            get().fetchSharedNotes();
            get().fetchPendingShares();
            get().fetchSharedByMeNotes();
          }

          // Handle different types of notifications based on action
          if (data.action === "share-accepted") {
            // If a share was accepted, update the note's shares if we're viewing it
            const { currentNote } = get();
            if (
              currentNote &&
              currentNote.id === data.noteId &&
              currentNote.shares
            ) {
              // Refresh the current note to get updated share info
              get().fetchNoteById(data.noteId);
            }

            // Update shared-by-me notes
            get().fetchSharedByMeNotes();
          } else if (data.action === "share-revoked") {
            // If a share was revoked, immediately remove it from sharedNotes
            const { sharedNotes, currentNote, user } = get();
            if (data.noteId) {
              // For recipient: Immediately update UI to remove revoked note
              set({
                sharedNotes: sharedNotes.filter(
                  (note) => note.id !== data.noteId
                ),
              });

              // If we're viewing the note that was revoked, redirect
              if (currentNote && currentNote.id === data.noteId) {
                // Check if we're the owner of the note
                const isMine = currentNote.owner?.id === user?.id;
                if (!isMine) {
                  // We're not the owner, we lost access - redirect
                  window.location.href = "/dashboard";
                }
              }

              // Show browser notification about the revoked access
              if (Notification.permission === "granted") {
                new Notification("Access Revoked", {
                  body: "Your access to a shared note has been revoked",
                });
              }
            }
          } else if (data.action === "share-revoked-by-owner") {
            // For owner: Update the UI after revoking a share
            const { currentNote, sharedByMeNotes } = get();
            if (data.noteId && data.shareId) {
              // If viewing the note, update shares list
              if (
                currentNote &&
                currentNote.id === data.noteId &&
                currentNote.shares
              ) {
                set({
                  currentNote: {
                    ...currentNote,
                    shares: currentNote.shares.filter(
                      (s) => s.id !== data.shareId
                    ),
                  },
                });
              }

              // Also update sharedByMeNotes
              const updatedSharedByMeNotes = sharedByMeNotes.map((note) => {
                if (note.id === data.noteId && note.shares) {
                  return {
                    ...note,
                    shares: note.shares.filter((s) => s.id !== data.shareId),
                  };
                }
                return note;
              });

              // Remove notes with no active shares
              const filteredNotes = updatedSharedByMeNotes.filter(
                (note) => note.shares && note.shares.length > 0
              );

              set({ sharedByMeNotes: filteredNotes });
            }
          } else if (data.action === "share-declined") {
            // If a share was declined, update the shared-by-me list
            get().fetchSharedByMeNotes();

            // Show a native notification if available
            if (Notification.permission === "granted" && data.sharedWith) {
              new Notification("Share Declined", {
                body: `${data.sharedWith} declined your shared note`,
              });
            }
          }
        }
      );

      set({ socket: globalSocket });
    } catch (error) {
      console.error("Failed to initialize socket:", error);
    }
  },

  disconnectSocket: () => {
    // Don't actually disconnect the socket, just remove it from the state
    // This allows the socket to stay connected between page navigations
    set({ socket: null });
  },

  fetchNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log("Headers before fetchNotes:", api.defaults.headers.common);
      const response = await api.get("/notes");
      set({ notes: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch notes:", error);
      set({
        error: error.response?.data?.message || "Failed to load notes",
        isLoading: false,
      });
    }
  },

  fetchSharedNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get("/notes/shared");
      set({ sharedNotes: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch shared notes:", error);
      set({
        error: error.response?.data?.message || "Failed to load shared notes",
        isLoading: false,
      });
    }
  },

  fetchArchivedNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log("Fetching archived notes...");
      const response = await api.get("/notes/archived");
      console.log("Archived notes response:", response.data);

      // Make sure we handle the data correctly
      const archivedNotes = response.data?.data || [];
      set({ archivedNotes, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch archived notes:", error);
      set({
        error: error.response?.data?.message || "Failed to load archived notes",
        isLoading: false,
        // Set empty array to prevent undefined errors
        archivedNotes: [],
      });
    }
  },

  fetchSharedByMeNotes: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log("Fetching notes shared by me...");

      // Use the dedicated endpoint
      const response = await api.get("/notes/shared-by-me");
      const sharedByMeNotes = response.data.data;

      console.log(`Found ${sharedByMeNotes.length} notes shared by me`);
      set({ sharedByMeNotes, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch notes shared by me:", error);
      set({
        error:
          error.response?.data?.message || "Failed to load notes shared by you",
        isLoading: false,
        sharedByMeNotes: [],
      });
    }
  },

  fetchNoteById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get(`/notes/${id}`);
      console.log("Note response:", response.data.data);
      set({ currentNote: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error(`Failed to fetch note ${id}:`, error);
      set({
        error: error.response?.data?.message || "Failed to load note",
        isLoading: false,
      });
    }
  },

  createNote: async (data: NoteInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{ data: Note }>("/notes", data);
      const newNote = response.data.data;

      // Update the notes array and set the current note
      set((state) => ({
        notes: [...state.notes, newNote],
        currentNote: newNote,
        isLoading: false,
      }));

      return newNote.id;
    } catch (error: any) {
      console.error("Error creating note:", error);
      set({
        error: error.response?.data?.message || "Failed to create note",
        isLoading: false,
      });
      return null;
    }
  },

  updateNote: async (id: string, data: NoteUpdateInput) => {
    try {
      set({ isLoading: true, error: null });
      console.log("Updating note with data:", {
        id,
        ...data,
      });

      // Make sure content and title are not undefined
      const updateData: NoteUpdateInput = {
        ...data,
        title: data.title || "",
        content: data.content || "",
      };

      const response = await api.put(`/notes/${id}`, updateData);
      const updatedNote = response.data.data;

      // Update all relevant note lists
      const { notes, sharedNotes, currentNote } = get();

      // Preserve permission from current note if it exists
      const permission = currentNote?.permission;
      if (permission) {
        (updatedNote as any).permission = permission;
      }

      // Update notes array if the note exists there
      if (notes.some((note) => note.id === id)) {
        set({
          notes: notes.map((note) => (note.id === id ? updatedNote : note)),
        });
      }

      // Update shared notes array if the note exists there
      if (sharedNotes.some((note) => note.id === id)) {
        set({
          sharedNotes: sharedNotes.map((note) =>
            note.id === id ? updatedNote : note
          ),
        });
      }

      // Update current note if it's the one being edited
      if (currentNote && currentNote.id === id) {
        set({ currentNote: updatedNote });
      }

      set({ isLoading: false });
    } catch (error: any) {
      console.error(`Failed to update note ${id}:`, error);
      set({
        error: error.response?.data?.message || "Failed to update note",
        isLoading: false,
      });
      throw error; // Re-throw to handle in component
    }
  },

  deleteNote: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log("Deleting note:", id);

      await api.delete(`/notes/${id}`);

      // Since socket might not be working, update the local state directly
      const { notes, sharedNotes, archivedNotes, currentNote } = get();

      set({
        notes: notes.filter((note) => note.id !== id),
        sharedNotes: sharedNotes.filter((note) => note.id !== id),
        archivedNotes: archivedNotes.filter((note) => note.id !== id),
        currentNote: currentNote && currentNote.id === id ? null : currentNote,
        isLoading: false,
      });
    } catch (error: any) {
      console.error(`Failed to delete note ${id}:`, error);
      set({
        error: error.response?.data?.message || "Failed to delete note",
        isLoading: false,
      });
    }
  },

  archiveNote: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log("Archiving note:", id);

      await api.put(`/notes/${id}`, { isArchived: true });

      // Since socket might not be working, update state directly
      const { notes, currentNote } = get();

      // Move note from notes to archivedNotes
      const noteToArchive = notes.find((note) => note.id === id);
      if (noteToArchive) {
        const updatedNote = { ...noteToArchive, isArchived: true };

        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          archivedNotes: [...state.archivedNotes, updatedNote],
          currentNote:
            currentNote && currentNote.id === id
              ? { ...currentNote, isArchived: true }
              : currentNote,
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error(`Failed to archive note ${id}:`, error);
      set({
        error: error.response?.data?.message || "Failed to archive note",
        isLoading: false,
      });
    }
  },

  unarchiveNote: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log("Unarchiving note:", id);

      await api.put(`/notes/${id}`, { isArchived: false });

      // Since socket might not be working, update state directly
      const { archivedNotes, currentNote } = get();

      // Move note from archivedNotes to notes
      const noteToUnarchive = archivedNotes.find((note) => note.id === id);
      if (noteToUnarchive) {
        const updatedNote = { ...noteToUnarchive, isArchived: false };

        set((state) => ({
          archivedNotes: state.archivedNotes.filter((note) => note.id !== id),
          notes: [...state.notes, updatedNote],
          currentNote:
            currentNote && currentNote.id === id
              ? { ...currentNote, isArchived: false }
              : currentNote,
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.error(`Failed to unarchive note ${id}:`, error);
      set({
        error: error.response?.data?.message || "Failed to unarchive note",
        isLoading: false,
      });
    }
  },

  shareNote: async (
    noteId: string,
    email: string,
    permission: string = "read"
  ) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post(`/notes/${noteId}/share`, {
        email,
        permission,
      });

      // Update the current note with new share info if available
      const { currentNote } = get();
      if (currentNote && currentNote.id === noteId && response.data?.share) {
        const newShare = response.data.share;
        const updatedNote = {
          ...currentNote,
          shares: currentNote.shares
            ? [...currentNote.shares, newShare]
            : [newShare],
        };
        set({ currentNote: updatedNote });
      }

      set({ isLoading: false });
    } catch (error: any) {
      console.error(`Failed to share note ${noteId}:`, error);
      set({
        error: error.response?.data?.message || "Failed to share note",
        isLoading: false,
      });
      throw error; // Re-throw to handle in component
    }
  },

  clearError: () => {
    set({ error: null });
  },

  acceptShare: async (shareToken: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post(`/notes/share/accept/${shareToken}`);

      // Refresh shared notes
      const responseShared = await api.get("/notes/shared");
      set({ sharedNotes: responseShared.data.data, isLoading: false });

      return response.data.data;
    } catch (error: any) {
      console.error(`Failed to accept share:`, error);
      set({
        error: error.response?.data?.message || "Failed to accept shared note",
        isLoading: false,
      });
      throw error;
    }
  },

  declineShare: async (shareToken: string) => {
    try {
      set({ isLoading: true, error: null });
      await api.post(`/notes/share/decline/${shareToken}`);

      // Refresh pending shares list after declining
      await get().fetchPendingShares();

      set({ isLoading: false });
    } catch (error: any) {
      console.error(`Failed to decline share:`, error);
      set({
        error: error.response?.data?.message || "Failed to decline shared note",
        isLoading: false,
      });
      throw error;
    }
  },

  revokeShare: async (shareId: string, noteId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Get current state
      const { currentNote, sharedByMeNotes } = get();

      // Update sharedByMeNotes to immediately reflect the revoked share
      const updatedSharedByMeNotes = sharedByMeNotes.map((note) => {
        if (note.id === noteId && note.shares) {
          // Filter out the revoked share
          const updatedShares = note.shares.filter(
            (share) => share.id !== shareId
          );

          // Return note with updated shares
          return {
            ...note,
            shares: updatedShares,
          };
        }
        return note;
      });

      // If all shares for a note are revoked, remove the note from sharedByMeNotes
      const filteredSharedByMeNotes = updatedSharedByMeNotes.filter(
        (note) => note.shares && note.shares.length > 0
      );

      // Update local state to reflect the revoked share
      if (currentNote && currentNote.id === noteId && currentNote.shares) {
        const updatedShares = currentNote.shares.filter(
          (share) => share.id !== shareId
        );

        set({
          currentNote: {
            ...currentNote,
            shares: updatedShares,
          },
          sharedByMeNotes: filteredSharedByMeNotes,
        });
      } else {
        set({
          sharedByMeNotes: filteredSharedByMeNotes,
        });
      }

      // Make the API call to revoke the share
      await api.post(`/notes/share/${shareId}/revoke`);

      // After API call succeeds, refresh all lists to ensure complete synchronization
      await Promise.all([
        get().fetchSharedNotes(),
        get().fetchPendingShares(),
        get().fetchSharedByMeNotes(),
      ]);

      set({ isLoading: false });
    } catch (error: any) {
      console.error(`Failed to revoke share:`, error);
      set({
        error: error.response?.data?.message || "Failed to revoke share",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchPendingShares: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.get("/notes/pending-shares");
      set({ pendingShares: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error("Failed to fetch pending shares:", error);
      set({
        error: error.response?.data?.message || "Failed to load pending shares",
        isLoading: false,
        pendingShares: [],
      });
    }
  },

  searchNotes: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: "", error: null });
      return;
    }

    try {
      set({ isLoading: true, error: null, searchQuery: query });
      const response = await api.get(
        `/notes/search?q=${encodeURIComponent(query)}`
      );
      set({ searchResults: response.data.data, isLoading: false });
    } catch (error: any) {
      console.error("Failed to search notes:", error);
      set({
        error: error.response?.data?.message || "Failed to search notes",
        isLoading: false,
        searchResults: [],
      });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchQuery: "", error: null });
  },
}));
