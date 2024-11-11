"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const secretKey = process.env.SECRET_KEY || "";
function checkAuthorization(req, res, next) {
    const bearerToken = req.headers.authorization; //    "Bearer asdlkjhfbak348756edjhfag3746"
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        jsonwebtoken_1.default.verify(token, secretKey, function (err, decoded) {
            if (err) {
                res.status(400).send(err);
                return;
            }
            next();
        });
    }
    else {
        res.status(401).send("User is not authorized!");
    }
}
function checkAdmin(req, res, next) {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        jsonwebtoken_1.default.verify(token, secretKey, function (err, decoded) {
            if (err) {
                res.status(400).send(err);
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
        res.status(401).send("User is not authorized!");
    }
}
function checkProvider(req, res, next) {
    const bearerToken = req.headers.authorization;
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        jsonwebtoken_1.default.verify(token, secretKey, function (err, decoded) {
            if (err) {
                res.status(400).send(err);
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
        res.status(401).send("User is not authorized!");
    }
}
exports.default = { checkAuthorization, checkAdmin, checkProvider };
