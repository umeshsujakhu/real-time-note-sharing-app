import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log for debugging purposes
      console.log(
        "Validation middleware - req.body before validation:",
        req.body
      );

      // Check if req.body is undefined or null
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("Empty or missing request body");

        return res.status(400).json({
          success: false,
          message: "Request body is empty or invalid",
          errors: {
            issues: [
              {
                code: "invalid_request_body",
                message:
                  "Request body is missing or empty. Make sure you're sending data with proper Content-Type header.",
              },
            ],
            name: "ValidationError",
          },
        });
      }

      // FIXED: Parse the request data directly, not wrapping it in an object
      // This was causing the validation to look for req.body.body.name instead of req.body.name
      await schema.parseAsync(req.body);

      // Log successful validation
      console.log("Validation successful");

      return next();
    } catch (error) {
      console.error("Validation error:", error);

      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: {
          issues: [
            {
              code: "unknown_error",
              message:
                error instanceof Error
                  ? error.message
                  : "Unknown validation error",
            },
          ],
          name: "ValidationError",
        },
      });
    }
  };
