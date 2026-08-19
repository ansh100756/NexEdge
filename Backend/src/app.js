import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import fileRouter from "./routes/file.routes.js";
import cdnRouter from "./routes/cdn.routes.js";   // <-- add this

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/files", fileRouter);
app.use("/api/cdn", cdnRouter);   // <-- add this

export default app;