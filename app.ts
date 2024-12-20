import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import categoryRouter from "./routers/categoryRouter";
import userRouter from "./routers/userRouter";
import productRouter from "./routers/productRouter";
import cartRouter from "./routers/cartRouter";
import orderRouter from "./routers/orderRouter";
import branchRouter from "./routers/branchRouter";
import imageRouter from "./routers/imageRouter";
import cartItemsRouter from "./routers/cartItemRouter";
import providersRouter from "./routers/providerProfileRouter";
import productReviewRouter from "./routers/productReviewRouter";
import badgesRouter from "./routers/badgeRouter";
import configurationRouter from "./routers/globalConfigurationRouter";
import cors from "cors";

dotenv.config();
const app: Express = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(cors());

app.use("/file", express.static("./uploads"));
app.use("/categories", categoryRouter);
app.use("/users", userRouter);
app.use("/products", productRouter);
app.use("/carts", cartRouter);
app.use("/orders", orderRouter);
app.use("/branches", branchRouter);
app.use("/image", imageRouter);
app.use("/cartItems", cartItemsRouter);
app.use("/providers", providersRouter);
app.use("/productReviews", productReviewRouter);
app.use("/badges", badgesRouter);
app.use("/configurations", configurationRouter);

app.listen(process.env.PORT);