// Backend/src/routes/cdn.routes.js

import { Router } from "express";
import { authorizeForCdn } from "../controllers/cdn.controller.js";
import { authUser } from "../middleware/auth.middleware.js";
import { requireTrustedCdn } from "../middleware/cdn.middleware.js";
import { fileIdValidator } from "../validators/file.validator.js";

const cdnRouter = Router();

cdnRouter.use(requireTrustedCdn, authUser);

cdnRouter.get("/authorize/:fileId", fileIdValidator, authorizeForCdn);

export default cdnRouter;
