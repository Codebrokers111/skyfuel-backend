import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route.js";

const v1 = Router();
v1.use("/auth", authRouter);

export default v1;
