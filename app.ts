import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import categoryRouter from "./routers/categoryRouter";
import userRouter from "./routers/userRouter";
import cors from "cors";

dotenv.config();
const app: Express = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());

app.use("/categories", categoryRouter);
app.use("/users", userRouter);

app.listen(process.env.PORT);