import e, { type Request, type Response } from "express";
import { authMiddleWare } from "../middleware/authMiddleWare";
import { verifyRole } from "../middleware/verifyRole";
import { querySchema } from "../validation/providerSchema";
import { prisma } from "../db";

const providerRouter = e.Router();

providerRouter.get(
  "/me/schedule",
  authMiddleWare,
  verifyRole("SERVICE_PROVIDE"),
  async (req: Request, res: Response) => {
    const { data, success } = querySchema.safeParse(req.query.date);
    if (!success) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "Invalid input or date",
      });
    }
    try {
      const fetchServices = await prisma.service.findMany({
        where: {
          providerId: req.userId,
        },
        select: {
          id: true,
          name: true,
        },
      });
      const serviceIds = fetchServices.map((i) => i.id);
      const fetchAppointments = await prisma.appointment.findMany({
        where: {
          serviceId: {
            in: serviceIds,
          },
          date: data.date,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      });
      const grouped = fetchServices.map((s) => {
        return {
          serviceId: s.id,
          serviceName: s.name,
          appointments: fetchAppointments
            .filter((as) => as.serviceId === s.id)
            .map((a) => ({
              appointmentId: a.id,
              userName: a.user.name,
              startTime: a.startTime,
              endTime: a.endTime,
              status: a.status,
            })),
        };
      });
      return res.json({
        success: true,
        data: {
            date: data.date,
            service: grouped
        }
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
export default providerRouter;
