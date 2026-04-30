import { vi } from 'vitest';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

export const getSocket = vi.fn().mockReturnValue(mockSocket);
export const connectSocket = vi.fn().mockReturnValue(mockSocket);
export const disconnectSocket = vi.fn();
export const joinRoom = vi.fn();
export const leaveRoom = vi.fn();
export const sendMessage = vi.fn();
export const emitTyping = vi.fn();
export const emitStopTyping = vi.fn();
export const emitMarkRead = vi.fn();
