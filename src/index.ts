import express from "express"
import authRouter from "./routes/authRoute";
import serviceRouter from "./routes/serviceroute";
import appointmentRouter from "./routes/appointmentRoute";
import providerRouter from "./routes/providerRouter";

const app = express();
const route = express.Router()
app.use(express.json());

app.get("/",(req,res) => {
    res.send("hello from bun");
})
app.use("/auth", authRouter)
app.use("/services", serviceRouter)
app.use("/appointments", appointmentRouter)
app.use("/providers", providerRouter)

app.listen(3000,() => {
    console.log("backend is running")
});