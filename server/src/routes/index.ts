import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import noteRoutes from "./note.routes";
import todoRoutes from "./todo.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/notes", noteRoutes);
router.use("/todos", todoRoutes);

// Simple test endpoint with no type annotations
router.post("/test-body-parser", function (req, res) {
  console.log("TEST BODY PARSER ENDPOINT");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  res.status(200).json({
    success: true,
    message: "Body parser test",
    received: {
      body: req.body,
    },
  });
});

export default router;
