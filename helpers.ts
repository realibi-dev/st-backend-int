import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const getCurrentUserInfo = (req: Request) => {
    const bearerToken = req.headers.authorization;

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];

        jwt.verify(token, process.env.SECRET_KEY || "", function(err, decoded: any) {
            if (err) {
                return;
            }

            return decoded;
        });
    } else {
        return;
    }
}

export default {
    getCurrentUserInfo,
}