"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getCurrentUserInfo = (req) => {
    const bearerToken = req.headers.authorization;
    console.log("bearer token", bearerToken);
    if (bearerToken) {
        const token = bearerToken.split(" ")[1];
        console.log("token", token);
        let userInfo;
        jsonwebtoken_1.default.verify(token, process.env.SECRET_KEY || "", function (err, decoded) {
            if (err) {
                console.log("err", err);
                return;
            }
            console.log("decoded", decoded);
            userInfo = decoded;
        });
        return userInfo;
    }
    else {
        return;
    }
};
exports.default = {
    getCurrentUserInfo,
};
