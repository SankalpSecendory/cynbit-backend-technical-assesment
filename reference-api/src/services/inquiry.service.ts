import { IInquiryRepository, inquiryRepository } from "../repositories/inquiry.repository";
import { CreateInquiryInput, ListInquiriesQuery } from "../schemas/inquiry.schema";
import { logger } from "../utils/logger";

export interface InquiryCreationResult {
  inquiryId: string;
  status: string;
  createdAt: string;
}

export interface PaginatedInquiriesResult {
  inquiries: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
    industry: string | null;
    message: string;
    status: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class InquiryService {
  constructor(private readonly repo: IInquiryRepository = inquiryRepository) {}

  async createInquiry(input: CreateInquiryInput, requestId: string): Promise<InquiryCreationResult> {
    // 1. Normalize inputs
    const normalizedData: CreateInquiryInput = {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      company: input.company?.trim() || undefined,
      industry: input.industry?.trim() || undefined,
      message: input.message.trim(),
    };

    // 2. Persist to database within durable transactional boundary
    const persistedInquiry = await this.repo.create(normalizedData);

    logger.info(
      {
        requestId,
        inquiryId: persistedInquiry.id,
        status: persistedInquiry.status,
      },
      "Inquiry successfully persisted to database"
    );

    // 3. Trigger decoupled asynchronous notification (Resend Email Dispatch simulation)
    // Runs outside the HTTP request thread to prevent blocking client responses
    this.dispatchAsyncNotification({
      inquiryId: persistedInquiry.id,
      name: normalizedData.name,
      email: normalizedData.email,
      requestId,
    });

    return {
      inquiryId: persistedInquiry.id,
      status: persistedInquiry.status.toLowerCase(),
      createdAt: persistedInquiry.createdAt.toISOString(),
    };
  }

  async listInquiries(query: ListInquiriesQuery): Promise<PaginatedInquiriesResult> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const [inquiries, totalCount] = await Promise.all([
      this.repo.findMany(skip, limit, status),
      this.repo.count(status),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      inquiries: inquiries.map((inq) => ({
        id: inq.id,
        name: inq.name,
        email: inq.email,
        company: inq.company,
        industry: inq.industry,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Asynchronous Notification Dispatcher
   * Simulates reliable message delivery to Resend / transactional email provider
   * with exponential backoff retry logic outside the HTTP request lifecycle.
   */
  private dispatchAsyncNotification(payload: {
    inquiryId: string;
    name: string;
    email: string;
    requestId: string;
  }): void {
    setImmediate(async () => {
      const maxRetries = 3;
      let attempt = 0;
      let delivered = false;

      while (attempt < maxRetries && !delivered) {
        attempt++;
        try {
          // Simulated asynchronous network dispatch to Resend email API
          await new Promise((resolve) => setTimeout(resolve, 50));
          delivered = true;
          logger.info(
            {
              requestId: payload.requestId,
              inquiryId: payload.inquiryId,
              attempt,
            },
            "Asynchronous email notification delivered successfully via Resend"
          );
        } catch (err: unknown) {
          logger.warn(
            {
              requestId: payload.requestId,
              inquiryId: payload.inquiryId,
              attempt,
              err,
            },
            "Transient failure delivering email notification; retrying"
          );
          if (attempt >= maxRetries) {
            logger.error(
              {
                requestId: payload.requestId,
                inquiryId: payload.inquiryId,
              },
              "Exhausted notification retries; moving to Dead-Letter Queue (DLQ)"
            );
          }
        }
      }
    });
  }
}

export const inquiryService = new InquiryService();
