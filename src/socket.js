import { io } from "socket.io-client";

const SOCKET_URL = "https://backend-production-4394.up.railway.app";

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/*Connection logs*/
socket.on("connect", () =>
  console.log("✅ Connected to Socket.IO server:", socket.id)
);

socket.on("disconnect", () =>
  console.log("❌ Disconnected from Socket.IO server")
);

socket.on("connect_error", (err) =>
  console.error("⚠️ Socket connection error:", err.message)
);

export default socket;

/*Order updates*/

export function updateOrder(order_id, updates) {
  return new Promise((resolve, reject) => {
    socket.emit("update_order", { order_id, updates }, (ack) => {
      if (ack?.success) resolve(ack);
      else reject(ack || { success: false, message: "Update failed" });
    });
  });
}

/* Mark order successful */
export function markSuccessful(order_id) {
  return new Promise((resolve, reject) => {
    socket.emit("mark_successful", { order_id }, (ack) => {
      if (ack?.success) resolve(ack);
      else reject(ack || { success: false });
    });
  });
}

/* Mark order unsuccessful*/
export function markUnsuccessful(order_id, reason = "") {
  return new Promise((resolve, reject) => {
    socket.emit("mark_unsuccessful", { order_id, reason }, (ack) => {
      if (ack?.success) resolve(ack);
      else reject(ack || { success: false });
    });
  });
}




export function subscribe(event, callback) {
  socket.on(event, callback);
  return () => socket.off(event, callback);
}
