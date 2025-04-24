/**
 * SERVER BODY-PARSER FIX
 *
 * If you're seeing validation errors like:
 * {
 *   "success": false,
 *   "message": "Validation error",
 *   "errors": {
 *     "issues": [
 *       { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["name"], "message": "Required" },
 *       ...
 *     ],
 *     "name": "ZodError"
 *   }
 * }
 *
 * The problem is likely that your Express server's body-parser middleware is not correctly configured.
 *
 * ====================
 * HOW TO FIX THIS ISSUE
 * ====================
 *
 * Find your server's main file (usually app.js, index.js, server.js, or app.ts) and add these lines:
 *
 * ```js
 * // For Express 4.16.0 and higher
 * app.use(express.json());
 * app.use(express.urlencoded({ extended: true }));
 *
 * // OR for older Express versions with body-parser package
 * const bodyParser = require('body-parser');
 * app.use(bodyParser.json());
 * app.use(bodyParser.urlencoded({ extended: true }));
 * ```
 *
 * Make sure these middleware declarations appear BEFORE any route definitions.
 *
 * ====================
 * CHECKING YOUR SERVER LOGS
 * ====================
 *
 * Check your server console logs to see how the request body is being received.
 * You might want to add this temporary debugging middleware to your server:
 *
 * ```js
 * app.use((req, res, next) => {
 *   console.log('Request Body:', req.body);
 *   console.log('Content-Type:', req.headers['content-type']);
 *   next();
 * });
 * ```
 *
 * ====================
 * COMMON ISSUES
 * ====================
 *
 * 1. Body-parser middleware is missing
 * 2. Body-parser is added AFTER your routes
 * 3. Request is not being sent as JSON (check Content-Type header)
 * 4. A proxy or CORS issue is interfering with the request
 *
 * If the URL-encoded form test works but the JSON test doesn't, this confirms
 * your server is missing the express.json() middleware.
 */
