import { Request, Response, NextFunction } from "express";
import { inquiryService } from "../services/inquiry.service";
import { CreateInquiryInput, ListInquiriesQuery } from "../schemas/inquiry.schema";

export class InquiryController {
  async createInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateInquiryInput;
      const result = await inquiryService.createInquiry(input, req.id);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query as unknown) as ListInquiriesQuery;
      const result = await inquiryService.listInquiries(query);

      res.status(200).json({
        success: true,
        data: result.inquiries,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const inquiryController = new InquiryController();
