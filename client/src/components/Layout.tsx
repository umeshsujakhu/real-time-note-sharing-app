import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Stack,
  useTheme,
  Tooltip,
  Fade,
} from "@mui/material";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import {
  Menu as MenuIcon,
  NoteAdd as NoteAddIcon,
  Dashboard as DashboardIcon,
  Archive as ArchiveIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  CheckBox as TaskIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useAuthStore } from "../stores/authStore";
import { useNoteStore } from "../stores/noteStore";

const drawerWidth = 280;

const Layout: React.FC = () => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  // Get note data from store
  const {
    notes,
    sharedNotes,
    archivedNotes,
    createNote,
    initializeSocket,
    disconnectSocket,
    fetchNotes,
    fetchSharedNotes,
    fetchArchivedNotes,
  } = useNoteStore();

  // Initialize socket and fetch user's notes data
  useEffect(() => {
    initializeSocket();
    fetchNotes();
    fetchSharedNotes();
    fetchArchivedNotes();

    return () => {
      disconnectSocket();
    };
  }, [
    initializeSocket,
    fetchNotes,
    fetchSharedNotes,
    fetchArchivedNotes,
    disconnectSocket,
  ]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleProfileMenuClose();
  };

  const handleCreateNote = async () => {
    try {
      const newNoteId = await createNote({
        title: "Untitled Note",
        content: "",
      });

      if (newNoteId) {
        navigate("/dashboard");
      }

      if (isMobile) {
        setMobileOpen(false);
      }
    } catch (error) {
      console.error("Error creating new note:", error);
    }
  };

  const menuItems = [
    {
      text: "All Notes",
      icon: <DashboardIcon />,
      path: "/",
      count: notes.length,
    },
    {
      text: "Shared with Me",
      icon: <ShareIcon />,
      path: "/shared",
      count: sharedNotes.length,
    },
    {
      text: "Archived",
      icon: <ArchiveIcon />,
      path: "/archived",
      count: archivedNotes.length,
    },
    {
      text: "Todo List",
      icon: <TaskIcon />,
      path: "/todos",
      count: 0,
    },
  ];

  const drawer = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          gap: 1,
        }}
      >
        <Box
          component="img"
          src="/logo-small.svg"
          alt="Notes App Logo"
          sx={{ width: 32, height: 32 }}
        />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          Notes App
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          startIcon={<NoteAddIcon />}
          fullWidth
          onClick={handleCreateNote}
          sx={{
            py: 1.5,
            borderRadius: 2,
            fontSize: "1rem",
            fontWeight: 600,
            background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)",
            boxShadow:
              "0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)",
            "&:hover": {
              background: "linear-gradient(90deg, #4338ca 0%, #4f46e5 100%)",
            },
          }}
        >
          New Note
        </Button>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                "&.Mui-selected": {
                  backgroundColor: "rgba(79, 70, 229, 0.1)",
                  "&:hover": {
                    backgroundColor: "rgba(79, 70, 229, 0.15)",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "primary.main",
                  },
                  "& .MuiListItemText-primary": {
                    color: "primary.main",
                    fontWeight: 600,
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color:
                    location.pathname === item.path
                      ? "primary.main"
                      : "text.secondary",
                }}
              >
                {item.count > 0 ? (
                  <Badge badgeContent={item.count} color="primary">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  "& .MuiListItemText-primary": {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          fullWidth
          sx={{
            py: 1.2,
            borderRadius: 2,
            borderColor: "rgba(0,0,0,0.1)",
            color: "text.primary",
            "&:hover": {
              borderColor: "rgba(0,0,0,0.2)",
              backgroundColor: "rgba(0,0,0,0.02)",
            },
          }}
        >
          Settings
        </Button>
      </Box>
    </Box>
  );

  const profileMenu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleProfileMenuClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      PaperProps={{
        sx: {
          mt: 1.5,
          borderRadius: 2,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        },
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {user?.name || "User"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>
      </Box>
      <Divider />
      <MenuItem
        onClick={() => {
          handleProfileMenuClose();
          /* Navigate to profile page */
        }}
        sx={{ py: 1.5 }}
      >
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          background: "linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexGrow: 1,
            }}
          >
            <Box
              component="img"
              src="/logo-small.svg"
              alt="Notes App Logo"
              sx={{
                width: 32,
                height: 32,
                display: { xs: "none", md: "block" },
              }}
            />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ fontWeight: 700, display: { xs: "none", md: "block" } }}
            >
              Notes App
            </Typography>
          </Box>

          {/* Search Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: 2,
              px: 2,
              py: 0.5,
              mr: 2,
              width: { xs: "auto", sm: 300 },
            }}
          >
            <SearchIcon sx={{ color: "rgba(255, 255, 255, 0.7)", mr: 1 }} />
            <input
              type="text"
              placeholder="Search notes..."
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                outline: "none",
                width: "100%",
              }}
            />
          </Box>

          {/* User Profile */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "secondary.main",
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0) || "U"}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
        }}
      >
        <Fade in timeout={500}>
          <Box sx={{ maxWidth: 1400, mx: "auto" }}>
            <Outlet />
          </Box>
        </Fade>
      </Box>

      {/* Profile Menu */}
      {profileMenu}
    </Box>
  );
};

export default Layout;
