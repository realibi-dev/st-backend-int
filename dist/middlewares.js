"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secretKey = process.env.SECRET_KEY || "";
const redirectToLogin = (req, res) => {
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
};
function checkAuthorization(req, res, next) {
    const bearerToken = req.headers.authorization; //    "Bearer asdlkjhfbak348756edjhfag3746"
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        jsonwebtoken_1.default.verify(token, secretKey, function (err, decoded) {
            if (err) {
                redirectToLogin(req, res);
                return;
            }
            next();
        });
    }
    else {
        console.log("redirecting to authentication");
        res.redirect(301, "/profile/auth");
    }
}
function checkAdmin(req, res, next) {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        jsonwebtoken_1.default.verify(token, secretKey, function (err, decoded) {
            if (err) {
                redirectToLogin(req, res);
                return;
            }
            if (decoded.isSuperuser) {
                next();
            }
            else {
                res.status(400).send("This endpoint needs admin authorization!");
            }
        });
    }
    else {
        redirectToLogin(req, res);
    }
}
function checkProvider(req, res, next) {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        jsonwebtoken_1.default.verify(token, secretKey, function (err, decoded) {
            if (err) {
                redirectToLogin(req, res);
                return;
            }
            if (decoded.accountType === "provider") {
                next();
            }
            else {
                res.status(400).send("This endpoint needs provider authorization!");
            }
        });
    }
    else {
        redirectToLogin(req, res);
    }
}
exports.default = { checkAuthorization, checkAdmin, checkProvider };
