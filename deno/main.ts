import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const connectedClients = new Map();

const app = new Application();
const port = 8080;
const router = new Router();

function broadcast(message) {
  for (const client of connectedClients.values()) {
    client.send(message);
  }
}

function broadcast_usernames() {
  const usernames = [...connectedClients.keys()];
  console.log("Sending updated username list to all clients...");

  broadcast(
    JSON.stringify({
      event: "update-users",
      usernames: usernames,
    })
  );
}

router.get("/chat", async (ctx) => {
  const socket = await ctx.upgrade();
  const username = ctx.request.url.searchParams.get("username");
  if (connectedClients.has(username)) {
    socket.close(1008, `Username ${username} is already taken`);
    return;
  }

  socket.username = username;
  connectedClients.set(username, socket);
  console.log(`New client connected: ${username}`);

  socket.onopen = () => broadcast_usernames();

  socket.onclose = () => {
    console.log(`Client ${socket.username} disconnected`);
    connectedClients.delete(socket.username);
    broadcast_usernames();
  };

  // Every time the user sends a message, broadcast it to all other users...
  socket.onmessage = (message) => {
    const data = message.data;

    broadcast(
      JSON.stringify({
        event: "send-message",
        username: socket.username,
        message: data,
      })
    );
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Listening at http://localhost:" + port);
await app.listen({ port });
