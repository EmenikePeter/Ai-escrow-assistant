import express from "express";
import Dispute from "../models/Dispute.js";
const router = express.Router();

// GET /api/disputes - fetch all disputes (for support/agent dashboard)
router.get("/", async (req, res) => {
  try {
    const disputes = await Dispute.find({})
      .populate("contractId", "title buyerId sellerId")
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

// GET /api/disputes/:id - fetch a single dispute by id
router.get("/:id", async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("contractId", "title buyerId sellerId");
    if (!dispute) return res.status(404).json({ error: "Dispute not found" });
    res.json(dispute);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dispute" });
  }
});

export default router;
