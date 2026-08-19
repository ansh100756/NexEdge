import multer from "multer";

const ONE_HUNDRED_MB = 100 * 1024 * 1024;

export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: ONE_HUNDRED_MB,
    files: 1,
  },
}).single("file");

export function handleUpload(req, res, next) {
  uploadSingleFile(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size must not be greater than 100 MB",
        success: false,
        err: "File too large",
      });
    }

    return res.status(400).json({
      message: "File upload failed",
      success: false,
      err: err.message,
    });
  });
}
