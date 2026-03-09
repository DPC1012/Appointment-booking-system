import e from "express"
import { loginBody, registerBody } from "../validation/authSchema";
import { prisma } from "../db";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const authRouter = e.Router();

authRouter.post("/register", async (req, res) => {
    const { data, success} = registerBody.safeParse(req.body);
    if(!success)
    {
        return res.status(400).json({
            success,
            data: null,
            error: "Invalid input"
        })
    }
    const findUser = await prisma.user.findUnique({where: {
        email: data.email
    }})
    if(findUser)
    {
        return res.status(409).json({
            success: false,
            data: null,
            error: "Email already exists"
        })
    }

    try
    {
        const hasedPassword = await bcrypt.hash(data.password,10);
        const userData = await prisma.user.create({
            data:{
                name: data.name,
                email: data.email,
                password: hasedPassword,
                role: data.role ? data.role : "USER",
            }
        })
        return res.status(201).json({
            success: true,
            data:{ 
                message: `User created Successfully with id ${userData.id}`
            },
            error: null
        })
    }
    catch(e)
    {
        return res.status(500).json({
            success: false,
            data: null,
            error: "Internal server error"
        })
    }
})

authRouter.post("/login", async (req, res) => {
    const { data, success} = loginBody.safeParse(req.body);
    if(!success)
    {
        return res.status(404).json({
            success,
            data: null,
            error: "Invalid input"
        })
    }
    const findUser = await prisma.user.findUnique({
        where: {
            email: data.email
        }
    })
    if(!findUser)
    {
        return res.status(404).json({
            success: false,
            data: null,
            error: "User not found"
        })
    }
    const validPassword = await bcrypt.compare(data.password,findUser.password);
    if(!validPassword)
    {
        return res.status(401).json({
            success: false,
            data: null,
            error: "Invalid credentials"
        })
    }
    try
    {
        const token = jwt.sign({userId: findUser.id, role: findUser.role}, process.env.JWT_SECRET as string);
        return res.json({
            success: false,
            data:{ 
                token
            },
            error: null
        })
    }
    catch(e)
    {
        return res.status(404).json({
            success: false,
            data: null,
            error: "Internal server error"
        })
    }
})

export default authRouter