import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const getCurrentUserInfo = (req: Request): any => {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];

        let userInfo;

        jwt.verify(token, process.env.SECRET_KEY || "", function(err, decoded: any) {
            if (err) {
                console.log("err", err);
                return;
            }
            // console.log("decoded", decoded);
            userInfo = decoded;
        });

        return userInfo;
    } else {
        return;
    }
}

export default {
    getCurrentUserInfo,
}