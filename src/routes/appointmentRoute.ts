import e, { type Request, type Response } from "express";
import { authMiddleWare } from "../middleware/authMiddleWare";
import { verifyRole } from "../middleware/verifyRole";
import { appointmentBookingSchema } from "../validation/appointmentSchema";
import { prisma } from "../db";

const appointmentRouter = e.Router();

appointmentRouter.post(
  "/",
  authMiddleWare,
  verifyRole("USER"),
  async (req: Request, res: Response) => {
    const { data, success } = appointmentBookingSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success,
        data: null,
        error: "Invalid slotid or time",
      });
    }
    const [serviceId, date, time] = data.slotId.split("_");
    if (!serviceId || !date || !time) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "Invalid slotid or time",
      });
    }

    const isAvailable = await prisma.availability.findFirst({
      where: {
        serviceId: serviceId,
        dayOfWeek: new Date(date).getDay(),
      },
    });
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "Service not available on this day",
      });
    }
    if (time < isAvailable.startTime || time >= isAvailable.endTime) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "Invalid slot",
      });
    }
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (service?.providerId === req.userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "Provider cannot book own service",
      });
    }
    const isBooked = await prisma.appointment.findUnique({
      where: {
        slotId: data.slotId,
      },
    });
    if (isBooked) {
      return res.status(409).json({
        success: false,
        data: null,
        error: "Slot already booked",
      });
    }
    try {
      const BookAppointment = await prisma.$transaction(async (tx) => {
        const existing = await tx.appointment.findUnique({
          where: { slotId: data.slotId },
        });

        if (existing) {
          throw new Error("Slot already booked");
        }
        return await tx.appointment.create({
          data: {
            slotId: data.slotId,
            serviceId,
            date: date,
            startTime: time,
            endTime: isAvailable.endTime,
            userId: req.userId,
            status: "BOOKED",
          },
        });
      });
      return res.status(201).json({
        success,
        data: {
          id: BookAppointment.id,
          slotId: BookAppointment.slotId,
          status: BookAppointment.status,
        },
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        data: null,
        error: "Internal server error",
      });
    }
  },
);

appointmentRouter.get(
  "/me",
  authMiddleWare,
  verifyRole("USER"),
  async (req: Request, res: Response) => {
    try {
      const appointment = await prisma.appointment.findMany({
        where: {
          userId: req.userId,
        },
        select: {
            date: true,
            startTime: true,
            endTime: true,
            status: true,
            service: {
                select: {
                    name: true, 
                    type: true
                }
            }
        }
      })
      const formatted = appointment.map((i) => {
        return {
            serviceName: i.service.name,
            type: i.service.type,
            date: i.date,
            startTime: i.startTime,
            endTime: i.endTime,
            status: i.status
        }
        
      })
      return res.json({
        success: true,
        data: formatted,
        error: null
      })
    } catch (e) {
      return res.status(500).json({
        success: false,
        data: null,
        error: "Internal server error",
      });
    }
  },
);

export default appointmentRouter;
