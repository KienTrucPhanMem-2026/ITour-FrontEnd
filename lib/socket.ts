import { io, Socket } from "socket.io-client";

// Connect to Chat Server at port 2902, /customer namespace
const socket: Socket = io("http://localhost:2902/customer", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
