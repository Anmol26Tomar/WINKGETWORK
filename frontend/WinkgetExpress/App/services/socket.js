import io from 'socket.io-client';

const DEFAULT_BASE = 'http://172.20.49.88:5000';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || DEFAULT_BASE;

let socketInstance = null;

export function getSocket() {
	if (!socketInstance) {
		try {
			socketInstance = io(API_BASE, { transports: ['websocket'], reconnection: true });
		} catch (e) {
			// noop: consumer must handle missing socket
		}
	}
	return socketInstance;
}

export function disconnectSocket() {
	if (socketInstance) {
		socketInstance.disconnect();
		socketInstance = null;
	}
}


