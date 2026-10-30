import { Inquiry } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { CreateInquiryInput } from "../schemas/inquiry.schema";
import { DatabaseError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface IInquiryRepository {
  create(data: CreateInquiryInput): Promise<Inquiry>;
  findById(id: string): Promise<Inquiry | null>;
  findMany(skip: number, take: number, status?: string): Promise<Inquiry[]>;
  count(status?: string): Promise<number>;
}

export class InquiryRepository implements IInquiryRepository {
  async create(data: CreateInquiryInput): Promise<Inquiry> {
    try {
      return await prisma.inquiry.create({
        data: {
          name: data.name,
          email: data.email,
          company: data.company || null,
          industry: data.industry || null,
          message: data.message,
          status: "RECEIVED",
        },
      });
    } catch (err: unknown) {
      logger.error({ err }, "Repository failed to persist inquiry");
      throw new DatabaseError("Failed to persist inquiry to the database");
    }
  }

  async findById(id: string): Promise<Inquiry | null> {
    try {
      return await prisma.inquiry.findUnique({
        where: { id },
      });
    } catch (err: unknown) {
      logger.error({ err, id }, "Repository failed to find inquiry by id");
      throw new DatabaseError("Failed to query inquiry by id");
    }
  }

  async findMany(skip: number, take: number, status?: string): Promise<Inquiry[]> {
    try {
      return await prisma.inquiry.findMany({
        where: status ? { status } : undefined,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
    } catch (err: unknown) {
      logger.error({ err }, "Repository failed to query inquiries");
      throw new DatabaseError("Failed to retrieve inquiries");
    }
  }

  async count(status?: string): Promise<number> {
    try {
      return await prisma.inquiry.count({
        where: status ? { status } : undefined,
      });
    } catch (err: unknown) {
      logger.error({ err }, "Repository failed to count inquiries");
      throw new DatabaseError("Failed to count inquiry records");
    }
  }
}

export const inquiryRepository = new InquiryRepository();
