import z from "zod"

export const serviceSchema = z.object({
    name: z.string(),
    type: z.enum(["MEDICAL", "HOUSE_HELP", "BEAUTY", "FITNESS", "EDUCATION", "OTHER"]),
    durationMinutes: z
    .number()
    .min(30, "Minimum duration is 30 minutes")
    .max(120, "Maximum duration is 120 minutes")
    .refine((val) => val % 30 == 0, {error: "Duration must be a multiple of 30"})
})

export const availabilitySchema = z.object({
    dayOfWeek: z.number().min(0, "Minimum number should be 0").max(6, "Maximum number should be 6"),
    startTime: z.iso.time(),
    endTime: z.iso.time()
})

export const queryParamSchema = z.object({
    type: z.enum(["MEDICAL", "HOUSE_HELP", "BEAUTY", "FITNESS", "EDUCATION", "OTHER"])
})

export const slotSchema = z.object({
    date: z.iso.date()
})