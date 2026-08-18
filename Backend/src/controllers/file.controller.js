import fileModel from "../models/file.model.js";
import userModel from "../models/user.model.js";
import { getImageKit } from "../config/imagekit.js";

function sanitizeFile(file, currentUserEmail, currentUserId) {
  const now = new Date();
  const activeAccess = file.access.find(
    (entry) =>
      entry.email === currentUserEmail.toLowerCase() && entry.expiresAt > now,
  );
  const isOwner = file.owner.toString() === currentUserId;

  return {
    id: file._id,
    owner: file.owner,
    originalName: file.originalName,
    url: file.url,
    thumbnailUrl: file.thumbnailUrl,
    mimeType: file.mimeType,
    size: file.size,
    isOwner,
    canDownload: isOwner || Boolean(activeAccess?.canDownload),
    accessExpiresAt: activeAccess?.expiresAt ?? null,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

async function getCurrentUser(userId) {
  return userModel.findById(userId).select("email");
}

async function getAuthorizedFile(fileId, userId) {
  const currentUser = await getCurrentUser(userId);

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

export async function dashboard(req, res) {
  try {
    const files = await fileModel
      .find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .select("-access.grantedBy");

    return res.status(200).json({
      message: "Dashboard files fetched successfully",
      success: true,
      files,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch dashboard files",
      success: false,
      err: err.message,
    });
  }
}

export async function sharedWithMe(req, res) {
  try {
    const currentUser = await getCurrentUser(req.user.id);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        err: "User not found",
      });
    }

    const now = new Date();
    const files = await fileModel
      .find({
        owner: { $ne: req.user.id },
        access: {
          $elemMatch: {
            email: currentUser.email,
            expiresAt: { $gt: now },
          },
        },
      })
      .populate("owner", "email")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      message: "Shared files fetched successfully",
      success: true,
      files: files.map((file) => sanitizeFile(file, currentUser.email, req.user.id)),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch shared files",
      success: false,
      err: err.message,
    });
  }
}

export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a file using the 'file' field",
        success: false,
        err: "File is required",
      });
    }

    const uploadedFile = await getImageKit().upload({
      file: req.file.buffer.toString("base64"),
      fileName: req.file.originalname,
      folder: `/nexedge/users/${req.user.id}`,
      useUniqueFileName: true,
    });

    const file = await fileModel.create({
      owner: req.user.id,
      originalName: req.file.originalname,
      imageKitFileId: uploadedFile.fileId,
      url: uploadedFile.url,
      thumbnailUrl: uploadedFile.thumbnailUrl,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(201).json({
      message: "File uploaded successfully",
      success: true,
      file,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to upload file",
      success: false,
      err: err.message,
    });
  }
}

export async function openFile(req, res) {
  try {
    const result = await getAuthorizedFile(req.params.fileId, req.user.id);

    if (result.err) {
      return res.status(result.status).json({
        message: result.err === "Forbidden" ? "You do not have access to this file" : result.err,
        success: false,
        err: result.err,
      });
    }

    return res.status(200).json({
      message: "File opened successfully",
      success: true,
      file: sanitizeFile(result.file, result.currentUser.email, req.user.id),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to open file",
      success: false,
      err: err.message,
    });
  }
}

export async function downloadFile(req, res) {
  try {
    const result = await getAuthorizedFile(req.params.fileId, req.user.id);

    if (result.err) {
      return res.status(result.status).json({
        message: result.err === "Forbidden" ? "You do not have access to this file" : result.err,
        success: false,
        err: result.err,
      });
    }

    if (!result.isOwner && !result.access?.canDownload) {
      return res.status(403).json({
        message: "You can view this file, but download access is disabled",
        success: false,
        err: "Download not allowed",
      });
    }

    return res.redirect(result.file.url);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to download file",
      success: false,
      err: err.message,
    });
  }
}

export async function grantFileAccess(req, res) {
  try {
    const file = await fileModel.findById(req.params.fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
        success: false,
        err: "File not found",
      });
    }

    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the file owner can grant access",
        success: false,
        err: "Forbidden",
      });
    }

    const now = Date.now();
    const grants = req.body.users.map((user) => ({
      email: user.email.toLowerCase().trim(),
      expiresAt: new Date(now + Number(user.durationInHours) * 60 * 60 * 1000),
      canDownload: Boolean(user.canDownload),
      grantedBy: req.user.id,
    }));

    const accessByEmail = new Map(
      file.access.map((entry) => [entry.email, entry]),
    );

    for (const grant of grants) {
      accessByEmail.set(grant.email, grant);
    }

    file.access = Array.from(accessByEmail.values());
    await file.save();

    return res.status(200).json({
      message: "File access updated successfully",
      success: true,
      access: file.access,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to update file access",
      success: false,
      err: err.message,
    });
  }
}
