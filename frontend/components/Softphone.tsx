'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Phone,
  CallEnd,
  Mic,
  MicOff,
  Pause,
  PlayArrow,
  Dialpad,
  Minimize,
  DragIndicator,
} from '@mui/icons-material';
import { useSip } from '@/contexts/SipContext';

export default function Softphone() {
  const {
    devices,
    selectedDevice,
    selectDevice,
    registrationState,
    register,
    unregister,
    callState,
    makeCall,
    answerCall,
    hangupCall,
    toggleMute,
    toggleHold,
    sendDTMF,
  } = useSip();

  const [isExpanded, setIsExpanded] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDialpad, setShowDialpad] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get registration status color
  const getStatusColor = (): string => {
    switch (registrationState) {
      case 'registered':
        return '#4caf50';
      case 'registering':
      case 'unregistering':
        return '#ff9800';
      case 'failed':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle dial pad button click
  const handleDialpadClick = (digit: string) => {
    setPhoneNumber(prev => prev + digit);
    if (callState.state === 'connected') {
      sendDTMF(digit);
    }
  };

  // Handle call button
  const handleCallButton = () => {
    if (callState.state === 'idle' && phoneNumber) {
      makeCall(phoneNumber);
    } else if (callState.state === 'ringing' && callState.direction === 'inbound') {
      answerCall();
    } else if (callState.state !== 'idle') {
      hangupCall();
    }
  };

  // Auto-expand on incoming call
  useEffect(() => {
    if (callState.state === 'ringing' && callState.direction === 'inbound') {
      setIsExpanded(true);
    }
  }, [callState.state, callState.direction]);

  // Listen for dial number events
  useEffect(() => {
    const handleDialNumber = (event: CustomEvent<{ number: string }>) => {
      setPhoneNumber(event.detail.number);
      setIsExpanded(true);
    };

    window.addEventListener('sip-dial-number', handleDialNumber as EventListener);
    return () => {
      window.removeEventListener('sip-dial-number', handleDialNumber as EventListener);
    };
  }, []);

  const dialpadButtons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '*', '0', '#',
  ];

  return (
      <Paper
      ref={widgetRef}
      elevation={8}
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        width: isExpanded ? 320 : 100,
        transition: 'width 0.3s ease',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'grab',
        }}
        onMouseDown={handleMouseDown}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIndicator fontSize="small" />
          {isExpanded && (
            <Typography variant="subtitle2" fontWeight="bold">
              Softphone
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip 
            title={isExpanded ? 'Minimize' : 'Expand'}
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
          >
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ color: 'white' }}
            >
              {isExpanded ? <Minimize fontSize="small" /> : <Phone fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Minimized View */}
      {!isExpanded && (
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: getStatusColor(),
            }}
          />
          {callState.state !== 'idle' ? (
            <>
              <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, lineHeight: 1 }}>
                {callState.state === 'connected' ? 'In Call' : callState.state}
              </Typography>
              {callState.state === 'connected' && (
                <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1, color: 'text.secondary' }}>
                  {formatDuration(callState.duration)}
                </Typography>
              )}
            </>
          ) : (
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.65rem', 
                fontWeight: 500, 
                lineHeight: 1,
                color: registrationState === 'registered' ? 'success.main' : 'text.secondary',
              }}
            >
              {registrationState === 'registered' ? 'Ready' : 
               registrationState === 'registering' ? 'Connecting...' :
               registrationState === 'failed' ? 'Failed' : 'Offline'}
            </Typography>
          )}
        </Box>
      )}

      {/* Expanded View */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 2 }}>
          {/* Device Selection */}
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Device</InputLabel>
            <Select
              value={selectedDevice?.id || ''}
              label="Device"
              onChange={(e) => {
                const device = devices.find(d => d.id === e.target.value);
                if (device) selectDevice(device);
              }}
              disabled={registrationState === 'registered'}
              MenuProps={{
                disablePortal: false,
                sx: {
                  zIndex: 10000,
                },
              }}
            >
              {devices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Registration Status */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={registrationState}
              size="small"
              sx={{
                bgcolor: getStatusColor(),
                color: 'white',
                textTransform: 'capitalize',
              }}
            />
            {registrationState === 'registered' ? (
              <Button size="small" onClick={unregister} variant="outlined">
                Unregister
              </Button>
            ) : (
              <Button
                size="small"
                onClick={register}
                variant="contained"
                disabled={!selectedDevice || registrationState === 'registering'}
              >
                Register
              </Button>
            )}
          </Box>

          {/* Call Status */}
          {callState.state !== 'idle' && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
              <Typography variant="subtitle2" gutterBottom>
                {callState.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {callState.remoteIdentity}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {callState.state === 'connected'
                  ? formatDuration(callState.duration)
                  : callState.state}
              </Typography>
            </Paper>
          )}

          {/* Phone Number Input */}
          <TextField
            fullWidth
            size="small"
            label="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={callState.state !== 'idle'}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <IconButton
                  size="small"
                  onClick={() => setShowDialpad(!showDialpad)}
                >
                  <Dialpad fontSize="small" />
                </IconButton>
              ),
            }}
          />

          {/* Dialpad */}
          <Collapse in={showDialpad}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                mb: 2,
              }}
            >
              {dialpadButtons.map((digit) => (
                <Button
                  key={digit}
                  fullWidth
                  variant="outlined"
                  onClick={() => handleDialpadClick(digit)}
                >
                  {digit}
                </Button>
              ))}
            </Box>
          </Collapse>

          {/* Call Controls */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
            {callState.state === 'idle' ? (
              <Tooltip 
                title="Call"
                PopperProps={{
                  sx: {
                    zIndex: 10001,
                  },
                }}
              >
                <span>
                  <IconButton
                    color="primary"
                    onClick={handleCallButton}
                    disabled={!phoneNumber || registrationState !== 'registered'}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '&:disabled': { bgcolor: 'grey.300' },
                    }}
                  >
                    <Phone />
                  </IconButton>
                </span>
              </Tooltip>
            ) : callState.state === 'ringing' && callState.direction === 'inbound' ? (
              <>
                <Tooltip 
                  title="Answer"
                  PopperProps={{
                    sx: {
                      zIndex: 10001,
                    },
                  }}
                >
                  <IconButton
                    color="success"
                    onClick={answerCall}
                    sx={{
                      bgcolor: 'success.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'success.dark' },
                    }}
                  >
                    <Phone />
                  </IconButton>
                </Tooltip>
                <Tooltip 
                  title="Reject"
                  PopperProps={{
                    sx: {
                      zIndex: 10001,
                    },
                  }}
                >
                  <IconButton
                    color="error"
                    onClick={hangupCall}
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                  >
                    <CallEnd />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip 
                  title={callState.isMuted ? 'Unmute' : 'Mute'}
                  PopperProps={{
                    sx: {
                      zIndex: 10001,
                    },
                  }}
                >
                  <IconButton
                    onClick={toggleMute}
                    disabled={callState.state !== 'connected'}
                    color={callState.isMuted ? 'error' : 'default'}
                  >
                    {callState.isMuted ? <MicOff /> : <Mic />}
                  </IconButton>
                </Tooltip>
                <Tooltip 
                  title={callState.isOnHold ? 'Resume' : 'Hold'}
                  PopperProps={{
                    sx: {
                      zIndex: 10001,
                    },
                  }}
                >
                  <IconButton
                    onClick={toggleHold}
                    disabled={callState.state !== 'connected'}
                    color={callState.isOnHold ? 'warning' : 'default'}
                  >
                    {callState.isOnHold ? <PlayArrow /> : <Pause />}
                  </IconButton>
                </Tooltip>
                <Tooltip 
                  title="Hang Up"
                  PopperProps={{
                    sx: {
                      zIndex: 10001,
                    },
                  }}
                >
                  <IconButton
                    color="error"
                    onClick={hangupCall}
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                  >
                    <CallEnd />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
