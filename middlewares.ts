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

function checkAuthorization(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;  //    "Bearer asdlkjhfbak348756edjhfag3746"

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];

        jwt.verify(token, secretKey, function(err, decoded) {
            if (err) {
                redirectToLogin(req, res);
                return;
            }

            next();
        });
    } else {
        console.log("redirecting to authentication");
        res.redirect(301, "/profile/auth");
    }
}

function checkAdmin(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];

        jwt.verify(token, secretKey, function(err, decoded: any) {
            if (err) {
                redirectToLogin(req, res);
                return;
            }

            if (decoded.isSuperuser) {
                next();
            } else {
                res.status(400).send("This endpoint needs admin authorization!");
            }
        });
    } else {
        redirectToLogin(req, res);
    }
}

function checkProvider(req: Request, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization;

    if (bearerToken) {
        const token: string = bearerToken.split(" ")[1];

        jwt.verify(token, secretKey, function(err, decoded: any) {
            if (err) {
                redirectToLogin(req, res);
                return;
            }

            if (decoded.accountType === "provider") {
                next();
            } else {
                res.status(400).send("This endpoint needs provider authorization!");
            }
        });
    } else {
        redirectToLogin(req, res);
    }
}

export default { checkAuthorization, checkAdmin, checkProvider }