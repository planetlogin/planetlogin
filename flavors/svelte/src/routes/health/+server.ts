import { json, type RequestHandler } from "@sveltejs/kit";

const start = Date.now();

export const GET: RequestHandler = async () => {
  return json({
    status: "ok",
    uptime: Math.floor((Date.now() - start) / 1000),
    version: process.env.npm_package_version ?? "unknown",
    node: process.version,
    timestamp: new Date().toISOString(),
  });
};
