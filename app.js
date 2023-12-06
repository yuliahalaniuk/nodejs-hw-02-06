import express from "express";
import logger from "morgan";
import cors from "cors";
import contactsRouter from "./routes/api/contacts.js";
import authRouter from "./routes/api/auth.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(express.static(path.join(__dirname, "public")));

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);
app.use("/users", authRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

export default app;
