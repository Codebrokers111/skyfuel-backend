import express from "express";
import morgan from "morgan";
import v1 from "./routes/v1.js";
import cors from "cors";

export const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.use("/v1", v1);

app.use((err: any, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});
