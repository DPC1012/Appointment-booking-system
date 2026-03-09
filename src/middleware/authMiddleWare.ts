import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
interface decodedData {
    userId: string,
    role: string
}
export const authMiddleWare = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if(!authHeader)
    {
        return res.status(401).json({
            success: false,
            data: null,
            error: "Unauthorized"
        })
    }
    const token = authHeader.split("")[1];
    if(typeof token !== "string")
    {
        return res.status(401).json({
            success: false,
            data: null,
            error: "Invalid token"
        })
    }
    try
    {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET as string) as decodedData
        req.userId = decodedData.userId;
        req.role = decodedData.role;
        next();
    }
    catch(e)
    {
        return res.status(500).json({
            success: false,
            data: null,
            error: "Internal server error"
        })
    }
}