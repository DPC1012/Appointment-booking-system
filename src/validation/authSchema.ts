import z, { email } from "zod"

export const registerBody = z.object({
    name: z.string(),
    email: z.email(),
    password: z.string().min(6).max(12),
    role: z.enum(["USER","SERVICE_PROVIDER"]).default("USER")
})

export const loginBody = z.object({
    email: z.email(),
    password: z.string().min(6).max(12)
})