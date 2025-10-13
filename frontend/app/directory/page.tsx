'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Search,
  Refresh,
  Logout,
  MailOutline,
  Person,
  Phone,
  CallMade,
  CallReceived,
  Download,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiClient } from '@/lib/api';
import { CacheManager } from '@/lib/cache';
import { Contact, CallStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function DirectoryPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'extension'>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cacheAge, setCacheAge] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCalls, setActiveCalls] = useState<CallStatus[]>([]);

  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const loadDirectory = async (forceRefresh = false) => {
    if (!user) return;

    setError('');
    
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Try to load from cache first
      if (!forceRefresh) {
        const cached = CacheManager.getFromCache(user.username);
        if (cached) {
          setContacts(cached);
          setFilteredContacts(cached);
          const age = CacheManager.getCacheAge(user.username);
          setCacheAge(age);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API
      const response = await apiClient.getDirectory();

      if (response.success && response.contacts) {
        setContacts(response.contacts);
        setFilteredContacts(response.contacts);
        CacheManager.saveToCache(response.contacts, user.username);
        setCacheAge(0);
      } else {
        setError(response.error || 'Failed to load directory');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDirectory();
    }
  }, [user]);

  // Fetch active calls
  const loadActiveCalls = async () => {
    try {
      const response = await apiClient.getActiveCalls();
      if (response.success && response.calls) {
        setActiveCalls(response.calls);
      }
    } catch (err) {
      // Silently fail - don't show error for call polling
      console.error('Failed to fetch active calls:', err);
    }
  };

  // Poll for active calls every 5 seconds, but pause when tab is hidden
  useEffect(() => {
    if (!isAuthenticated) return;

    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      // Initial load
      loadActiveCalls();
      // Set up polling
      interval = setInterval(loadActiveCalls, 5000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, stop polling
        stopPolling();
      } else {
        // Tab is visible, resume polling and fetch fresh data
        stopPolling(); // Clear any existing interval first
        startPolling();
      }
    };

    // Start polling initially
    startPolling();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Helper function to get call status for a contact
  const getCallStatus = (extension: string): CallStatus | undefined => {
    return activeCalls.find(call => call.presenceId === extension);
  };

  // Helper function to format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach((contact) => {
      contact.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [contacts]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = contacts;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(term) ||
          contact.extension.includes(term) ||
          contact.email.toLowerCase().includes(term)
      );
    }

    // Apply tag filter
    if (selectedTag !== 'all') {
      filtered = filtered.filter((contact) =>
        contact.tags.includes(selectedTag)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return a.extension.localeCompare(b.extension);
      }
    });

    setFilteredContacts(filtered);
  }, [searchTerm, selectedTag, sortBy, contacts]);

  const handleRefresh = () => {
    loadDirectory(true);
  };

  const handleDownloadContacts = () => {
    // Convert contacts to CSV format
    const headers = ['Name', 'Extension', 'Email', 'Tags'];
    const csvRows = [headers.join(',')];

    filteredContacts.forEach((contact) => {
      const row = [
        `"${contact.name.replace(/"/g, '""')}"`, // Escape quotes in name
        contact.extension,
        `"${contact.email.replace(/"/g, '""')}"`, // Escape quotes in email
        `"${contact.tags.join(';').replace(/"/g, '""')}"`, // Tags as semicolon-separated
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with current date
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts-${date}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            FOP<span style={{ color: '#10b981' }}>Panel</span>
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user.username}
          </Typography>
          <Tooltip title="Toggle theme">
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={logout}>
              <Logout />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 3 }}>
          Company Directory
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Search by name, extension, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Filter by tag:
              </Typography>
              <Chip
                label="All Tags"
                onClick={() => setSelectedTag('all')}
                color={selectedTag === 'all' ? 'primary' : 'default'}
                sx={{ fontWeight: 600 }}
              />
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => setSelectedTag(tag)}
                  color={selectedTag === tag ? 'primary' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Sort by:
              </Typography>
              <Chip
                label="Name"
                onClick={() => setSortBy('name')}
                color={sortBy === 'name' ? 'primary' : 'default'}
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label="Extension"
                onClick={() => setSortBy('extension')}
                color={sortBy === 'extension' ? 'primary' : 'default'}
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing <strong>{filteredContacts.length}</strong> of <strong>{contacts.length}</strong> contacts
              {cacheAge !== null && cacheAge > 0 && (
                <span> • Cached {formatDistanceToNow(Date.now() - cacheAge, { addSuffix: true })}</span>
              )}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadContacts}
                disabled={filteredContacts.length === 0}
              >
                Download
              </Button>
              <Button
                variant="outlined"
                startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                Refresh
              </Button>
            </Box>
          </CardContent>
        </Card>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredContacts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Search sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
              <Typography variant="h3" gutterBottom>
                No contacts found
              </Typography>
              <Typography color="text.secondary">
                Try adjusting your search or filter criteria
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {filteredContacts.map((contact, index) => {
              const callStatus = getCallStatus(contact.extension);
              
              return (
                <Box key={index}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    position: 'relative',
                    border: callStatus ? '2px solid #ef4444' : undefined,
                  }}>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                            {contact.name}
                          </Typography>
                          {callStatus && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#ef4444',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                '@keyframes pulse': {
                                  '0%, 100%': {
                                    opacity: 1,
                                  },
                                  '50%': {
                                    opacity: 0.5,
                                  },
                                },
                              }}
                            />
                          )}
                        </Box>
                        {contact.isAgent && (
                          <Tooltip title="Agent">
                            <Person color="primary" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <Phone sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography
                        variant="h5"
                        color="primary"
                        sx={{ fontSize: '1.1rem', fontWeight: 600 }}
                      >
                        {contact.extension}
                      </Typography>
                    </Box>

                      {contact.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <MailOutline sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography
                            variant="body2"
                            color="primary"
                            component="a"
                            href={`mailto:${contact.email}`}
                            sx={{
                              textDecoration: 'none',
                              fontSize: '0.8rem',
                              '&:hover': { textDecoration: 'underline' },
                            }}
                          >
                            {contact.email}
                          </Typography>
                        </Box>
                      )}

                      {callStatus && (
                        <Box
                          sx={{
                            mt: 1,
                            p: 1,
                            bgcolor: '#fef2f2',
                            borderRadius: 1,
                            border: '1px solid #fecaca',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            {callStatus.direction === 'outbound' ? (
                              <CallMade sx={{ fontSize: 14, color: '#ef4444' }} />
                            ) : (
                              <CallReceived sx={{ fontSize: 14, color: '#ef4444' }} />
                            )}
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#ef4444' }}>
                              {callStatus.direction === 'outbound' ? 'Calling' : 'Incoming'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ display: 'block', color: '#991b1b' }}>
                            {callStatus.otherParty}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: '#991b1b' }}>
                            Duration: {formatDuration(callStatus.duration)}
                          </Typography>
                        </Box>
                      )}

                      {contact.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {contact.tags.map((tag, tagIndex) => (
                            <Chip
                              key={tagIndex}
                              label={tag}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                bgcolor: 'secondary.light',
                                color: 'secondary.dark',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
}
