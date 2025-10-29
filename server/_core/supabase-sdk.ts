import { createClient } from '@supabase/supabase-js';
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { ForbiddenError } from "@shared/_core/errors";

const supabaseUrl = ENV.supabaseUrl;
const supabaseServiceKey = ENV.supabaseServiceKey || ENV.supabaseAnonKey;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables");
}

// Server-side Supabase client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class SupabaseAuthService {
  async authenticateRequest(req: Request): Promise<User> {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ForbiddenError("Missing authorization token");
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      throw ForbiddenError("Invalid auth token");
    }

    const signedInAt = new Date();
    let user = await db.getUser(supabaseUser.id);

    // If user not in DB, create them
    if (!user) {
      await db.upsertUser({
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || null,
        email: supabaseUser.email ?? null,
        loginMethod: 'email',
        lastSignedIn: signedInAt,
      });
      user = await db.getUser(supabaseUser.id);
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    // Update last signed in
    await db.upsertUser({
      id: user.id,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const supabaseAuth = new SupabaseAuthService();
