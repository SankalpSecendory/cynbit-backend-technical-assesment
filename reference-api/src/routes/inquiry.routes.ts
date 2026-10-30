import { Router } from "express";
import { inquiryController } from "../controllers/inquiry.controller";
import { healthController } from "../controllers/health.controller";
import { validate } from "../middleware/validate";
import { createInquirySchema, listInquiriesQuerySchema } from "../schemas/inquiry.schema";
import { inquiryRateLimiter } from "../middleware/rate-limiter";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// 1. Health & Diagnostics Check
router.get("/health", (req, res) => healthController.getHealth(req, res));

// 2. Public Inquiry Creation Route (Rate-limited, strictly validated)
router.post(
  "/inquiries",
  inquiryRateLimiter,
  validate(createInquirySchema, "body"),
  (req, res, next) => inquiryController.createInquiry(req, res, next)
);

// 3. Protected Administrative Inquiries Listing (Requires Admin Authentication, Paginated)
router.get(
  "/inquiries",
  authenticateAdmin,
  validate(listInquiriesQuerySchema, "query"),
  (req, res, next) => inquiryController.getInquiries(req, res, next)
);

export const apiRouter = router;
