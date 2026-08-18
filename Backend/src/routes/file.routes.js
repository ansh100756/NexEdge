import { Router } from "express";
import {
  dashboard,
  downloadFile,
  grantFileAccess,
  openFile,
  sharedWithMe,
  uploadFile,
} from "../controllers/file.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import { handleUpload } from "../middleware/upload.middleware.js";
import {
  fileIdValidator,
  grantFileAccessValidator,
} from "../validators/file.validator.js";

const fileRouter = Router();

fileRouter.use(authUser);

/**
 * @route GET /api/files/dashboard
 * @desc Fetch files uploaded by the logged in user
 * @access Private
 */
fileRouter.get("/dashboard", dashboard);

/**
 * @route GET /api/files/shared-with-me
 * @desc Fetch active files shared with the logged in user's email
 * @access Private
 */
fileRouter.get("/shared-with-me", sharedWithMe);

/**
 * @route POST /api/files/upload
 * @desc Upload one file up to 100 MB to ImageKit and save its link
 * @access Private
 * @form-data { file }
 */
fileRouter.post("/upload", handleUpload, uploadFile);

/**
 * @route GET /api/files/:fileId/open
 * @desc Open a file when owner or active email grant has access
 * @access Private
 */
fileRouter.get("/:fileId/open", fileIdValidator, openFile);

/**
 * @route GET /api/files/:fileId/download
 * @desc Download a file when owner or access grant allows downloads
 * @access Private
 */
fileRouter.get("/:fileId/download", fileIdValidator, downloadFile);

/**
 * @route POST /api/files/:fileId/access
 * @desc Grant file access by email with duration and download permission
 * @access Private owner only
 * @body { users: [{ email, durationInHours, canDownload }] }
 */
fileRouter.post("/:fileId/access", grantFileAccessValidator, grantFileAccess);

export default fileRouter;
