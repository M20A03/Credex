import { z } from "zod";

/**
 * Build-time and runtime environment schema validation.
 * Ensures the application fails fast if required configurations are absent.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  
  // Anthropic AI Claude Key (optional at build, warned at runtime)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  // Supabase Lead Database (optional for local mock mode)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Resend Email (optional for local mock mode)
  RESEND_API_KEY: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Invalid environment variables in production build.");
  }
}

export const env = parsedEnv.success ? parsedEnv.data : (process.env as unknown as z.infer<typeof envSchema>);
