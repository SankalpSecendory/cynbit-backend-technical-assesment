import { z } from "zod";

export const createInquirySchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email("Please provide a valid email address")
      .max(254, "Email cannot exceed 254 characters"),
    company: z
      .string()
      .trim()
      .max(120, "Company name cannot exceed 120 characters")
      .optional()
      .or(z.literal("")),
    industry: z
      .string()
      .trim()
      .max(80, "Industry cannot exceed 80 characters")
      .optional()
      .or(z.literal("")),
    message: z
      .string({ required_error: "Message is required" })
      .trim()
      .min(10, "Message must be at least 10 characters long")
      .max(5000, "Message cannot exceed 5000 characters"),
  })
  .strict({
    message: "Unexpected properties encountered in request payload",
  });

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;

export const listInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be a positive integer").default(1),
  limit: z.coerce.number().int().min(1).max(50, "Limit cannot exceed 50 records per page").default(10),
  status: z.enum(["RECEIVED", "IN_REVIEW", "CONTACTED", "RESOLVED", "ARCHIVED"]).optional(),
});

export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
