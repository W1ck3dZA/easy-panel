'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  UserAgent, 
  Registerer, 
  Inviter, 
  Invitation,
  Session, 
  SessionState,
  SessionDescriptionHandler
} from 'sip.js';
import { SipDevice } from '@/lib/types';
import { apiClient } from '@/lib/api';

interface CallState {
  session: Session | null;
  state: 'idle' | 'ringing' | 'connecting' | 'connected' | 'disconnecting';
  direction: 'inbound' | 'outbound' | null;
  remoteIdentity: string | null;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
}

interface SipContextType {
  // Device management
  devices: SipDevice[];
  selectedDevice: SipDevice | null;
  selectDevice: (device: SipDevice) => void;
  
  // Registration
  registrationState: 'unregistered' | 'registering' | 'registered' | 'unregistering' | 'failed';
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  
  // Call state
  callState: CallState;
  
  // Call actions
  makeCall: (target: string) => Promise<void>;
  answerCall: () => Promise<void>;
  hangupCall: () => Promise<void>;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDTMF: (digit: string) => void;
  
  // Dial helper
  dialNumber: (number: string) => void;
  
  // Loading/error states
  isLoading: boolean;
  error: string | null;
}

const SipContext = createContext<SipContextType | undefined>(undefined);

export function SipProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<SipDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<SipDevice | null>(null);
  const [registrationState, setRegistrationState] = useState<SipContextType['registrationState']>('unregistered');
  const [callState, setCallState] = useState<CallState>({
    session: null,
    state: 'idle',
    direction: null,
    remoteIdentity: null,
    duration: 0,
    isMuted: false,
    isOnHold: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioElementRef.current = new Audio();
      audioElementRef.current.autoplay = true;
    }
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.srcObject = null;
      }
    };
  }, []);

  // Duration timer
  useEffect(() => {
    if (callState.state === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      setCallState(prev => ({ ...prev, duration: 0 }));
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState.state]);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getDevices();
      if (response.success && response.devices) {
        setDevices(response.devices);
        
        // Update selected device reference if it exists in the new devices list
        if (selectedDevice) {
          const updatedDevice = response.devices.find(d => d.id === selectedDevice.id);
          if (updatedDevice) {
            setSelectedDevice(updatedDevice);
          } else {
            // If previously selected device no longer exists, select first available
            setSelectedDevice(response.devices[0] || null);
          }
        } else if (response.devices.length > 0) {
          // Auto-select first device if no device was previously selected
          setSelectedDevice(response.devices[0]);
        }
      } else {
        setError(response.error || 'Failed to fetch devices');
      }
    } catch (err) {
      setError('Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDevice = useCallback((device: SipDevice) => {
    // Unregister current device if registered
    if (registrationState === 'registered') {
      unregister();
    }
    setSelectedDevice(device);
  }, [registrationState]);

  const setupUserAgent = useCallback((device: SipDevice) => {
    try {
      const uri = UserAgent.makeURI(device.sipUri);
      if (!uri) {
        throw new Error('Invalid SIP URI');
      }

      const userAgent = new UserAgent({
        uri,
        transportOptions: {
          server: device.wssUrl,
        },
        authorizationUsername: device.username,
        authorizationPassword: device.password,
        sessionDescriptionHandlerFactoryOptions: {
          constraints: {
            audio: true,
            video: false,
          },
        },
        delegate: {
          onInvite: (invitation) => {
            handleIncomingCall(invitation);
          },
        },
      });

      userAgentRef.current = userAgent;
      return userAgent;
    } catch (err) {
      console.error('Failed to setup UserAgent:', err);
      throw err;
    }
  }, []);

  const register = useCallback(async () => {
    if (!selectedDevice) {
      setError('No device selected');
      return;
    }

    try {
      setRegistrationState('registering');
      setError(null);

      const userAgent = setupUserAgent(selectedDevice);
      await userAgent.start();

      const registerer = new Registerer(userAgent);
      registererRef.current = registerer;

      registerer.stateChange.addListener((state) => {
        switch (state) {
          case 'Registered':
            setRegistrationState('registered');
            break;
          case 'Unregistered':
            setRegistrationState('unregistered');
            break;
          case 'Terminated':
            setRegistrationState('failed');
            setError('Registration failed');
            break;
        }
      });

      await registerer.register();
    } catch (err) {
      console.error('Registration failed:', err);
      setRegistrationState('failed');
      setError('Registration failed');
    }
  }, [selectedDevice, setupUserAgent]);

  const unregister = useCallback(async () => {
    if (!registererRef.current) return;

    try {
      setRegistrationState('unregistering');
      await registererRef.current.unregister();
      
      if (userAgentRef.current) {
        await userAgentRef.current.stop();
        userAgentRef.current = null;
      }
      
      registererRef.current = null;
      setRegistrationState('unregistered');
    } catch (err) {
      console.error('Unregistration failed:', err);
      setError('Unregistration failed');
    }
  }, []);

  const setupSessionHandlers = useCallback((session: Session) => {
    session.stateChange.addListener((state) => {
      switch (state) {
        case SessionState.Initial:
        case SessionState.Establishing:
          setCallState(prev => ({ ...prev, state: 'connecting' }));
          break;
        case SessionState.Established:
          setCallState(prev => ({ ...prev, state: 'connected' }));
          // Attach remote audio
          const remoteStream = new MediaStream();
          const pc = (session.sessionDescriptionHandler as any)?.peerConnection;
          if (pc) {
            pc.getReceivers().forEach((receiver: any) => {
              if (receiver.track) {
                remoteStream.addTrack(receiver.track);
              }
            });
          }
          if (audioElementRef.current) {
            audioElementRef.current.srcObject = remoteStream;
          }
          break;
        case SessionState.Terminating:
        case SessionState.Terminated:
          setCallState({
            session: null,
            state: 'idle',
            direction: null,
            remoteIdentity: null,
            duration: 0,
            isMuted: false,
            isOnHold: false,
          });
          if (audioElementRef.current) {
            audioElementRef.current.srcObject = null;
          }
          break;
      }
    });
  }, []);

  const handleIncomingCall = useCallback((invitation: Session) => {
    const remoteIdentity = invitation.remoteIdentity.uri.user || 'Unknown';
    
    setCallState({
      session: invitation,
      state: 'ringing',
      direction: 'inbound',
      remoteIdentity,
      duration: 0,
      isMuted: false,
      isOnHold: false,
    });

    setupSessionHandlers(invitation);
  }, [setupSessionHandlers]);

  const makeCall = useCallback(async (target: string) => {
    if (!userAgentRef.current || registrationState !== 'registered') {
      setError('Not registered');
      return;
    }

    try {
      const targetUri = UserAgent.makeURI(`sip:${target}@${selectedDevice?.domain}`);
      if (!targetUri) {
        throw new Error('Invalid target');
      }

      const inviter = new Inviter(userAgentRef.current, targetUri);
      
      setCallState({
        session: inviter,
        state: 'connecting',
        direction: 'outbound',
        remoteIdentity: target,
        duration: 0,
        isMuted: false,
        isOnHold: false,
      });

      setupSessionHandlers(inviter);
      await inviter.invite();
    } catch (err) {
      console.error('Failed to make call:', err);
      setError('Failed to make call');
      setCallState(prev => ({ ...prev, state: 'idle', session: null }));
    }
  }, [registrationState, selectedDevice, setupSessionHandlers]);

  const answerCall = useCallback(async () => {
    if (!callState.session || callState.direction !== 'inbound') return;

    try {
      await (callState.session as Invitation).accept();
    } catch (err) {
      console.error('Failed to answer call:', err);
      setError('Failed to answer call');
    }
  }, [callState.session, callState.direction]);

  const hangupCall = useCallback(async () => {
    if (!callState.session) return;

    try {
      setCallState(prev => ({ ...prev, state: 'disconnecting' }));
      
      switch (callState.session.state) {
        case SessionState.Initial:
        case SessionState.Establishing:
          if (callState.direction === 'outbound') {
            await (callState.session as Inviter).cancel();
          } else {
            await (callState.session as Invitation).reject();
          }
          break;
        case SessionState.Established:
          await callState.session.bye();
          break;
      }
    } catch (err) {
      console.error('Failed to hangup call:', err);
      setError('Failed to hangup call');
    }
  }, [callState.session, callState.direction]);

  const toggleMute = useCallback(() => {
    if (!callState.session || callState.state !== 'connected') return;

    const pc = (callState.session.sessionDescriptionHandler as any)?.peerConnection;
    if (!pc) return;

    const audioTrack = pc.getSenders().find((sender: any) => sender.track?.kind === 'audio');
    if (audioTrack?.track) {
      audioTrack.track.enabled = callState.isMuted;
      setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [callState.session, callState.state, callState.isMuted]);

  const toggleHold = useCallback(async () => {
    if (!callState.session || callState.state !== 'connected') return;

    try {
      // Use SessionDescriptionHandlerModifier for hold/unhold
      const sessionDescriptionHandlerOptions = callState.isOnHold
        ? {} // Resume
        : { hold: true }; // Hold
      
      await callState.session.invite(sessionDescriptionHandlerOptions as any);
      setCallState(prev => ({ ...prev, isOnHold: !prev.isOnHold }));
    } catch (err) {
      console.error('Failed to toggle hold:', err);
      setError('Failed to toggle hold');
    }
  }, [callState.session, callState.state, callState.isOnHold]);

  const sendDTMF = useCallback((digit: string) => {
    if (!callState.session || callState.state !== 'connected') return;

    try {
      callState.session.sessionDescriptionHandler?.sendDtmf(digit);
    } catch (err) {
      console.error('Failed to send DTMF:', err);
    }
  }, [callState.session, callState.state]);

  const dialNumber = useCallback((number: string) => {
    // Dispatch custom event to notify Softphone component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sip-dial-number', { detail: { number } }));
    }
  }, []);

  const value: SipContextType = {
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
    dialNumber,
    isLoading,
    error,
  };

  return <SipContext.Provider value={value}>{children}</SipContext.Provider>;
}

export function useSip() {
  const context = useContext(SipContext);
  if (context === undefined) {
    throw new Error('useSip must be used within a SipProvider');
  }
  return context;
}
