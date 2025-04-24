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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
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
} from "@mui/icons-material";
import { useAuthStore } from "../stores/authStore";
import { useNoteStore } from "../stores/noteStore";

const drawerWidth = 240;

const Layout: React.FC = () => {
  const theme = useTheme();
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
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Notes App
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          startIcon={<NoteAddIcon />}
          fullWidth
          onClick={handleCreateNote}
        >
          New Note
        </Button>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
            >
              <ListItemIcon>
                {item.count > 0 ? (
                  <Badge badgeContent={item.count} color="primary">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const profileMenu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleProfileMenuClose}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      <MenuItem
        onClick={() => {
          handleProfileMenuClose();
          /* Navigate to profile page */
        }}
      >
        <ListItemIcon>
          <PersonIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Profile</ListItemText>
      </MenuItem>
      <MenuItem onClick={handleLogout}>
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
          boxShadow: 1,
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

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {isMobile ? "Notes App" : ""}
          </Typography>

          {/* Search Bar */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SearchIcon />
          </IconButton>

          {/* Profile Avatar */}
          <IconButton
            edge="end"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar alt={user?.name || "User"} sx={{ width: 32, height: 32 }}>
              {user?.name?.charAt(0) || "U"}
            </Avatar>
          </IconButton>
          {profileMenu}
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
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
            keepMounted: true, // Better mobile performance
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
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          overflow: "auto",
          height: "100%",
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
