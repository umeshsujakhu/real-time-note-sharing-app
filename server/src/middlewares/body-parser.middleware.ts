import { Request, Response, NextFunction } from "express";

/**
 * Raw Body Parser Middleware
 *
 * This middleware captures the raw request body for JSON requests before
 * the regular body parser middleware processes it. This is useful for debugging
 * issues with JSON parsing or when the regular parser fails.
 *
 * IMPORTANT: Register this middleware BEFORE bodyParser.json()
 */
export const rawBodyParser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only process requests with JSON content type
  if (req.headers["content-type"]?.includes("application/json")) {
    let data = "";

    // Capture chunks of data
    req.on("data", (chunk) => {
      data += chunk.toString();
    });

    // Process the complete data
    req.on("end", () => {
      if (data) {
        try {
          // Store the raw body string (useful for debugging)
          (req as any).rawBody = data;

          // Attempt to parse JSON manually
          const jsonData = JSON.parse(data);

          // Assign to req.body - this will be overwritten by bodyParser.json() if it succeeds
          req.body = jsonData;

          // For debugging only
          console.log("Raw JSON data captured:", data);
        } catch (e) {
          console.error("Failed to parse raw JSON data:", e);
        }
      }
      next();
    });
  } else {
    next();
  }
};

/**
 * Debug Middleware
 *
 * This middleware logs request details including parsed body content.
 * Use this after all body parsers to see what was actually parsed.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("----------------------");
  console.log("Request:", req.method, req.url);
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Body:", req.body);
  console.log("----------------------");
  next();
};
