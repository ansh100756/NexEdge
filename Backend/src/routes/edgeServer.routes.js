import { Router } from "express";
import EdgeServer from "../models/edgeServer.model.js";

const edgeServerRouter = Router();

/**
 * @route GET /api/edge-servers
 * @desc Get all edge servers
 * @access Public
 * @query { token }
 */
edgeServerRouter.get("/", async (req, res) => {
  try {
    const { city, isActive } = req.query;
    const filters = {};

    if (city) {
      filters.city = city;
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === "true";
    }

    const edgeServers = await EdgeServer.find(filters).sort({
      city: 1,
      name: 1,
    });

    return res.status(200).json({
      count: edgeServers.length,
      edgeServers,
    });
  } catch (error) {
    console.error("Error fetching edge servers:", error);
    return res.status(500).json({
      message: "Failed to fetch edge servers",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/edge-servers/:id
 * @desc Get a specific edge server
 * @access Public
 * @query { token }
 */
edgeServerRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const edgeServer = await EdgeServer.findById(id);

    if (!edgeServer) {
      return res.status(404).json({ message: "Edge server not found" });
    }

    return res.status(200).json({ edgeServer });
  } catch (error) {
    console.error("Error fetching edge server:", error);
    return res.status(500).json({
      message: "Failed to fetch edge server",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/edge-servers
 * @desc Create a new edge server
 * @access Public
 * @query { token }
 */
edgeServerRouter.post("/create", async (req, res) => {
  try {
    const {
      name,
      city,
      latitude,
      longitude,
      baseUrl,
      isActive = true,
    } = req.body;

    if (
      !name ||
      !city ||
      latitude === undefined ||
      longitude === undefined ||
      !baseUrl
    ) {
      return res.status(400).json({
        message: "name, city, latitude, longitude, and baseUrl are required",
      });
    }

    const edgeServer = await EdgeServer.create({
      name,
      city,
      latitude,
      longitude,
      baseUrl,
      isActive,
    });

    return res.status(201).json({
      message: "Edge server created successfully",
      edgeServer,
    });
  } catch (error) {
    console.error("Error creating edge server:", error);
    return res.status(500).json({
      message: "Failed to create edge server",
      error: error.message,
    });
  }
});

/**
 * @route PUT /api/edge-servers/:id
 * @desc Update a specific edge server
 * @access Public
 * @query { token }
 */
edgeServerRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, latitude, longitude, baseUrl, isActive } = req.body;

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (city !== undefined) updates.city = city;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (baseUrl !== undefined) updates.baseUrl = baseUrl;
    if (isActive !== undefined) updates.isActive = isActive;

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    const edgeServer = await EdgeServer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!edgeServer) {
      return res.status(404).json({ message: "Edge server not found" });
    }

    return res.status(200).json({
      message: "Edge server updated successfully",
      edgeServer,
    });
  } catch (error) {
    console.error("Error updating edge server:", error);
    return res.status(500).json({
      message: "Failed to update edge server",
      error: error.message,
    });
  }
});

/**
 * @route PATCH /api/edge-servers/:id/deactivate
 * @desc Deactivate a specific edge server
 * @access Public
 * @query { token }
 */
edgeServerRouter.patch("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    const edgeServer = await EdgeServer.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!edgeServer) {
      return res.status(404).json({ message: "Edge server not found" });
    }

    return res.status(200).json({
      message: "Edge server deactivated successfully",
      edgeServer,
    });
  } catch (error) {
    console.error("Error deactivating edge server:", error);
    return res.status(500).json({
      message: "Failed to deactivate edge server",
      error: error.message,
    });
  }
});

export default edgeServerRouter;
