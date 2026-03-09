import e, { type Request, type Response } from "express";
import {
  availabilitySchema,
  queryParamSchema,
  serviceSchema,
  slotSchema,
} from "../validation/serviceSchema";
import { verifyRole } from "../middleware/verifyRole";
import { prisma } from "../db";
import { authMiddleWare } from "../middleware/authMiddleWare";

const serviceRouter = e.Router();

serviceRouter.post(
  "/",
  authMiddleWare,
  verifyRole("SERVICE_PROVIDER"),
  async (req: Request, res: Response) => {
    const { data, success } = serviceSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success,
        data: null,
        error: "Invalid input",
      });
    }
    try {
      const createdService = await prisma.service.create({
        data: {
          providerId: req.userId,
          name: data.name,
          type: data.type,
          durationMinutes: data.durationMinutes,
        },
      });
      return res.status(201).json({
        success: false,
        data: {
          id: createdService.id,
          name: createdService.name,
          type: createdService.type,
          durationMinutes: createdService.durationMinutes,
        },
        error: null,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        data: null,
        message: "Internal server error",
      });
    }
  },
);

serviceRouter.post(
  "/:serviceId/availability",
  authMiddleWare,
  verifyRole("SERVICE_PROVIDER"),
  async (req: Request, res: Response) => {
    const serviceId = req.params.serviceId as string;
    const findService = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
    });
    if (!findService) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "Service not found",
      });
    }
    if (findService.providerId !== req.userId) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "Service does not belong to provider",
      });
    }
    const { data, success } = availabilitySchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({
        success,
        data: null,
        error: "Invalid input or time format",
      });
    }
    const overlapping = await prisma.availability.findFirst({
      where: {
        serviceId: serviceId,
        dayOfWeek: data.dayOfWeek,
        startTime: {
          lt: data.endTime,
        },
        endTime: {
          gt: data.startTime,
        },
      },
    });
    if (overlapping) {
      return res.status(409).json({
        success: false,
        data: null,
        error: "Overlapping availability",
      });
    }
    const setAvailability = await prisma.availability.create({
      data: {
        serviceId: serviceId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
    return res.status(201).json({
      success,
      data: {
        message: "Availability is set",
      },
      error: null,
    });
  },
);

serviceRouter.get("/", authMiddleWare, async (req: Request, res: Response) => {
  const { data, success } = queryParamSchema.safeParse(req.query.type);
  if (!success) {
    return res.status(400).json({
      success,
      data: null,
      error: "Invalid service type",
    });
  }
  try {
    const findService = await prisma.service.findMany({
      where: {
        type: data.type,
      },
    });

    return res.json({
      success,
      data: {
        findService,
      },
      error: null,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "Internal server error",
    });
  }
});

serviceRouter.get(
  "/:serviceId/slots",
  authMiddleWare,
  async (req: Request, res: Response) => {
    const { data, success } = slotSchema.safeParse(req.query.date);
    if (!success) {
      return res.status(400).json({
        success,
        data: null,
        error: "Invalid date or format",
      });
    }
    const serviceId = req.params.serviceId as string;
    const findService = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
      include: {
        appointments: true,
      },
    });
    if (!findService) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "Service not found",
      });
    }
    try {
      const slotArray = findService.appointments.map((d) => {
        if (d.date === data.date) {
          return {
            slotId: d.slotId,
            startTime: d.startTime,
            endTime: d.endTime,
          };
        }
      });
      return res.json({
        success,
        data: {
          serviceId: serviceId,
          date: data.date,
          slots: slotArray,
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

export default serviceRouter;
