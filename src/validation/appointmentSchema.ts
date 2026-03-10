import z from "zod"

export const appointmentBookingSchema = z.object({
    slotId: z.string().regex(/^[^_]+_\d{4}-\d{2}-\d{2}_\d{2}:\d{2}$/)
})