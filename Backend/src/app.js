import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { getAllowedOrigins, isAllowedOrigin } from "./config/app.js";
import authRouter from "./routes/auth.routes.js";
import fileRouter from "./routes/file.routes.js";
import cdnRouter from "./routes/cdn.routes.js";

const app = express();
const allowedOrigins = getAllowedOrigins();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin, allowedOrigins)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed"));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "nexedge-api" });
});

app.use("/api/auth", authRouter);
app.use("/api/files", fileRouter);
app.use("/api/cdn", cdnRouter);

app.use((err, req, res, next) => {
  if (err.message === "Origin is not allowed") {
    return res.status(403).json({
      message: "This origin is not allowed",
      success: false,
    });
  }

  return next(err);
});

export default app;
