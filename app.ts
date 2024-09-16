import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

const app: Express = express();
dotenv.config();

app.get("/test", (req: Request, res: Response) => {
    res.send("hello world!");
});

app.listen(process.env.PORT);