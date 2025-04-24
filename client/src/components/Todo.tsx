import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
} from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useTodoStore, TodoItem } from "../stores/todoStore";

const Todo: React.FC = () => {
  const {
    todos,
    isLoading,
    error,
    fetchTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearError,
  } = useTodoStore();
  const [newTodo, setNewTodo] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogTaskText, setDialogTaskText] = useState("");

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    await addTodo(newTodo);
    setNewTodo("");
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setDialogTaskText("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddTaskFromDialog = async () => {
    if (dialogTaskText.trim()) {
      await addTodo(dialogTaskText);
      handleCloseDialog();
    }
  };

  if (isLoading && todos.length === 0) {
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

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", px: 2, py: 3, position: "relative" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Task Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="New Task"
            variant="outlined"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddTodo}
            disabled={!newTodo.trim()}
          >
            Add
          </Button>
        </Box>
      </Paper>

      <Paper elevation={2}>
        <List sx={{ width: "100%" }}>
          {todos.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No tasks yet"
                secondary="Add a new task to get started"
                sx={{ textAlign: "center", py: 3 }}
              />
            </ListItem>
          ) : (
            todos.map((todo, index) => (
              <React.Fragment key={todo.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <IconButton edge="end" onClick={() => deleteTodo(todo.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <Checkbox
                    edge="start"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    sx={{ mr: 2 }}
                  />
                  <ListItemText
                    primary={todo.text}
                    sx={{
                      textDecoration: todo.completed ? "line-through" : "none",
                      color: todo.completed ? "text.secondary" : "text.primary",
                    }}
                    secondary={new Date(todo.createdAt).toLocaleDateString()}
                  />
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={handleOpenDialog}
      >
        <AddIcon />
      </Fab>

      {/* New Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Description"
            type="text"
            fullWidth
            variant="outlined"
            value={dialogTaskText}
            onChange={(e) => setDialogTaskText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTaskFromDialog()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleAddTaskFromDialog}
            variant="contained"
            disabled={!dialogTaskText.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Todo;
