import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | undefined;
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please set MONGODB_URI in your .env.local");
}

/**
 * Singleton MongoDB connection – reuses the same connection in hot-reload
 * (Next.js dev mode) to avoid exhausting connection pool limits.
 */
export async function connectDB(): Promise<typeof mongoose> {
  // Return cached connection if already connected
  if (global._mongooseConn) return global._mongooseConn;

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  global._mongooseConn = await global._mongoosePromise;
  return global._mongooseConn;
}

export default connectDB;
