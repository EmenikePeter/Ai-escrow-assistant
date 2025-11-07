import express from "express";
import isAdmin from "../middleware/isAdmin.js";
import Dispute from "../models/Dispute.js";
const router = express.Router();

router.get("/", isAdmin, async (req, res) => {
  try {
    const disputes = await Dispute.find({ status: { $in: ["open", "pending"] } })
      .populate("contractId", "title buyerId sellerId")
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

export default router;
