import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.SECRET_KEY || "";

function checkAuthorization(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;  //    "Bearer asdlkjhfbak348756edjhfag3746"

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];

        jwt.verify(token, secretKey, function(err, decoded) {
            if (err) {
                res.status(400).send(err);
                return;
            }

            next();
        });
    } else {
        res.status(401).send("User is not authorized!");
    }
}

function checkAdmin(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];

        jwt.verify(token, secretKey, function(err, decoded: any) {
            if (err) {
                res.status(400).send(err);
                return;
            }

            if (decoded.isSuperuser) {
                next();
            } else {
                res.status(400).send("This endpoint needs admin authorization!");
            }
        });
    } else {
        res.status(401).send("User is not authorized!");
    }
}

export default { checkAuthorization, checkAdmin }