import io from "socket.io-client";

const DEFAULT_BASE = "http://192.168.1.15:5000";
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || DEFAULT_BASE;

let socketInstance = null;

export function getSocket(token) {
  if (!socketInstance) {
    try {
      socketInstance = io(`${API_BASE}/captain`, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        auth: { token }, 
      });

      socketInstance.on("connect", () => {
        console.log("✅ Connected to /captain socket:", socketInstance.id);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      socketInstance.on("reconnect", (attempt) => {
        console.log(`♻️ Socket reconnected after ${attempt} attempts`);
      });

      socketInstance.on("connect_error", (err) => {
        console.log("⚠️ Socket connection error:", err.message);
      });
    } catch (e) {
      console.log("Socket initialization error:", e);
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
