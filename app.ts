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

const corsOptions = {
	origin: 'https://marketly.kz',
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors());

app.use("/api/file", express.static("./uploads"));
app.use("/api/categories", categoryRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/branches", branchRouter);
app.use("/api/image", imageRouter);
app.use("/api/cartItems", cartItemsRouter);
app.use("/api/providers", providersRouter);
app.use("/api/productReviews", productReviewRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/configurations", configurationRouter);

app.listen(process.env.PORT);