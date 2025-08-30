import http from "http";
import { app } from "./app.js";

const PORT = Number(process.env.PORT || 8080);
const server = http.createServer(app);

server.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
