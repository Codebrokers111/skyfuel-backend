import { Router } from "express";
import { authRouter } from "../modules/auth/auth.route.js";
import { mailRouter } from "../modules/mail/mail.route.js";
import { productRouter } from "../modules/products/product.route.js";

const v1 = Router();
v1.use("/auth", authRouter);
v1.use("/mail", mailRouter);
v1.use("/product", productRouter);

export default v1;
