import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import debounce from "lodash/debounce";
import { useNoteStore } from "../stores/noteStore";

const SearchBar: React.FC = () => {
  const { searchNotes, clearSearch, isLoading, searchQuery } = useNoteStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce the search function to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchNotes(query);
    }, 300),
    [searchNotes]
  );

  // Update local query when store query changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setLocalQuery(query);

    if (query.trim()) {
      debouncedSearch(query);
    } else {
      clearSearch();
    }
  };

  const handleClearSearch = () => {
    setLocalQuery("");
    clearSearch();
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 600, mx: "auto", mb: 3 }}>
      <TextField
        fullWidth
        placeholder="Search notes..."
        value={localQuery}
        onChange={handleSearchChange}
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {isLoading ? (
                <CircularProgress size={20} />
              ) : localQuery ? (
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  aria-label="clear search"
                >
                  <ClearIcon />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;
