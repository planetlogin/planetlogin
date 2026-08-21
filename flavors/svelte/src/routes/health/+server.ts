import { json, type RequestHandler } from "@sveltejs/kit";

const start = Date.now();
const VERSION = process.env.PLANETLOGIN_VERSION || "dev";

export const GET: RequestHandler = async () => {
  return json({
    status: "ok",
    uptime: Math.floor((Date.now() - start) / 1000),
    version: VERSION,
    node: process.version,
    timestamp: new Date().toISOString(),
  });
};
