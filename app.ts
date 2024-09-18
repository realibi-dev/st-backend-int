import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();
const app: Express = express();

app.get("/test", function(req: Request, res: Response) {
    res.send("Спасибо за обращение к Алиби!");
})

app.listen(process.env.ALIBI);