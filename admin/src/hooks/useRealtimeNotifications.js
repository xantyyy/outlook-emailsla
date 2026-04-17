// ============================================
// REAL-TIME NOTIFICATIONS HOOK (Frontend)
// useRealtimeNotifications Hook
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';

const useRealtimeNotifications = (onNotification) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Get WebSocket URL based on environment
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.REACT_APP_WS_PORT || '5000';
    
    // Get token from localStorage
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      console.error('❌ No authentication token found');
      return null;
    }

    // For development
    if (process.env.NODE_ENV === 'development') {
      return `${protocol}//${host}:${port}/ws/notifications?token=${token}`;
    }
    
    // For production
    return `${protocol}//${host}/ws/notifications?token=${token}`;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    const wsUrl = getWebSocketUrl();
    
    if (!wsUrl) {
      console.error('❌ Cannot connect: No WebSocket URL');
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('✅ Already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket:', wsUrl.replace(/token=.*/, 'token=***'));
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected!');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Start ping/pong to keep connection alive
        startHeartbeat();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received notification:', data);

          // Handle different message types
          switch (data.type) {
            case 'connected':
              console.log('🎉 Connection confirmed:', data.message);
              break;
              
            case 'notification':
            case 'broadcast':
              // Call the callback with notification data
              if (onNotification && data.data) {
                onNotification(data.data);
                playNotificationSound();
              }
              break;
              
            case 'pong':
              // Heartbeat response
              break;
              
            default:
              console.log('📬 Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        
        stopHeartbeat();
        
        // Attempt to reconnect
        attemptReconnect();
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setConnectionStatus('error');
      attemptReconnect();
    }
  }, [getWebSocketUrl, onNotification]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, []);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      setConnectionStatus('failed');
      return;
    }

    reconnectAttemptsRef.current++;
    console.log(`🔄 Reconnecting... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    
    setConnectionStatus('reconnecting');
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectDelay * reconnectAttemptsRef.current);
  }, [connect]);

  // Heartbeat to keep connection alive
  const heartbeatIntervalRef = useRef(null);
  
  const startHeartbeat = () => {
    stopHeartbeat(); // Clear any existing interval
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000); // Ping every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xvDglEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I0+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfccLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQcZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHAU1jdXzzn0vBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYELIHO8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMeS0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSQ0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSQ0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQQoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSg0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEMLElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQQoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSg0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEMLElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAF');
      audio.volume = 0.3;
      audio.play().catch(() => console.log('🔇 Sound blocked by browser'));
    } catch (error) {
      console.log('🔇 Could not play notification sound');
    }
  };

  // Send message to server
  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('⚠️ Cannot send message: WebSocket not connected');
    return false;
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when user comes back online
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network back online, reconnecting...');
      if (!isConnected) {
        connect();
      }
    };

    const handleOffline = () => {
      console.log('📴 Network offline');
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, connect]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    send
  };
};

export default useRealtimeNotifications;