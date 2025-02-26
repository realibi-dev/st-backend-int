import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.SECRET_KEY || "";

const redirectToLogin = (req: Request, res: Response) => {
    const targetUrl = `${process.env.CLIENT_DOMAIN}/profile/auth`;

    res.send(`
        <html>
            <head><title>Redirecting...</title></head>
            <body>
                <script>
                    window.location.href = "${targetUrl}";
                </script>
            </body>
        </html>
    `);
}

async function checkAuthorization(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;  //    "Bearer asdlkjhfbak348756edjhfag3746"

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];
        try {
            await jwt.verify(token, secretKey);
            next();
        } catch(err) {
            res.status(401).send("Not Authorized");
        }
    } else {
        res.status(401).send("Not Authorized");
    }
}

async function checkAdmin(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];
        try {
            const decoded: any = await jwt.verify(token, secretKey);
            
            if (decoded.isSuperuser) {
                next();
            } else {
                res.status(401).send("This endpoint needs admin authorization!");
            }
        } catch(err) {
            res.status(401).send("Not Authorized");
        }
    } else {
        res.status(401).send("Not Authorized");
    }
}

async function checkProvider(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];
        try {
            const decoded: any = await jwt.verify(token, secretKey);
            
            if (decoded.accountType === "provider") {
                next();
            } else {
                res.status(400).send("This endpoint needs provider authorization!");
            }
        } catch(err) {
            res.status(401).send("Not Authorized");
        }
    } else {
        res.status(401).send("Not Authorized");
    }
}

export default { checkAuthorization, checkAdmin, checkProvider }