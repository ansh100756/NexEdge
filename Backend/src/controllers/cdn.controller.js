// Backend/src/controllers/cdn.controller.js
//
// Internal-only endpoint used by the CDN Router (and only the router).
// It answers ONE question: "can this user have this file, and if so,
// what's the origin URL + metadata the edge needs to serve/cache it?"
//
// It deliberately reuses the exact same getAuthorizedFile() logic that
// openFile/downloadFile already use in file.controller.js, so there is
// only ONE place in the whole system that decides who can access a file.

import fileModel from "../models/file.model.js";
import userModel from "../models/user.model.js";

async function getAuthorizedFile(fileId, userId) {
  const currentUser = await userModel.findById(userId).select("email");

  if (!currentUser) {
    return { status: 404, err: "User not found" };
  }

  const file = await fileModel.findById(fileId);

  if (!file) {
    return { status: 404, err: "File not found" };
  }

  const isOwner = file.owner.toString() === userId;
  const now = new Date();
  const access = file.access.find(
    (entry) => entry.email === currentUser.email && entry.expiresAt > now,
  );

  if (!isOwner && !access) {
    return { status: 403, err: "Forbidden" };
  }

  return { file, currentUser, isOwner, access };
}

/**
 * @route GET /api/cdn/authorize/:fileId
 * @desc  Internal endpoint for the CDN Router. Verifies the requesting
 *        user (via the same JWT cookie auth as everything else) is
 *        allowed to access fileId, and if so returns the ImageKit URL
 *        and cache metadata the edge needs. Never called by browsers
 *        directly — only by the trusted CDN Router service.
 * @access Private (requires valid user JWT, same as any /api/files route)
 */
export async function authorizeForCdn(req, res) {
  try {
    const result = await getAuthorizedFile(req.params.fileId, req.user.id);

    if (result.err) {
      return res.status(result.status).json({
        allowed: false,
        message: result.err,
      });
    }

    const canDownload = result.isOwner || Boolean(result.access?.canDownload);

    return res.status(200).json({
      allowed: true,
      fileId: result.file._id,
      originUrl: result.file.url, // the ImageKit URL
      mimeType: result.file.mimeType,
      size: result.file.size,
      canDownload,
      // cache-busting handle: if this changes, edges should treat old
      // cached bytes as stale even before TTL expiry (Step 13, invalidation)
      version: result.file.updatedAt.getTime(),
    });
  } catch (err) {
    return res.status(500).json({
      allowed: false,
      message: "Authorization check failed",
      err: err.message,
    });
  }
}
