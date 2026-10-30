import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

type RequestLocation = "body" | "query" | "params";

export function validate(schema: AnyZodObject, location: RequestLocation = "body") {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[location]);
      req[location] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(err);
      }
    }
  };
}
