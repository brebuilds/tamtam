// Vercel serverless function entry point
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth.ts";
import { appRouter } from "../server/routers.ts";
import { createContext } from "../server/_core/context.ts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth routes
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files from dist/public
const publicDir = path.join(__dirname, "..", "dist", "public");
app.use(express.static(publicDir));

// SPA fallback - serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
