"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    return __awaiter(this, void 0, void 0, function* () {
        const bearerToken = req.headers.authorization; //    "Bearer asdlkjhfbak348756edjhfag3746"
        if (bearerToken) {
            const token = bearerToken.split(" ")[1];
            try {
                yield jsonwebtoken_1.default.verify(token, secretKey);
                next();
            }
            catch (err) {
                res.status(401).send("Not Authorized");
            }
        }
        else {
            res.status(401).send("Not Authorized");
        }
    });
}
function checkAdmin(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const bearerToken = req.headers.authorization;
        if (bearerToken) {
            const token = bearerToken.split(" ")[1];
            try {
                const decoded = yield jsonwebtoken_1.default.verify(token, secretKey);
                if (decoded.isSuperuser) {
                    next();
                }
                else {
                    res.status(401).send("This endpoint needs admin authorization!");
                }
            }
            catch (err) {
                res.status(401).send("Not Authorized");
            }
        }
        else {
            res.status(401).send("Not Authorized");
        }
    });
}
function checkProvider(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const bearerToken = req.headers.authorization;
        if (bearerToken) {
            const token = bearerToken.split(" ")[1];
            try {
                const decoded = yield jsonwebtoken_1.default.verify(token, secretKey);
                if (decoded.accountType === "provider") {
                    next();
                }
                else {
                    res.status(400).send("This endpoint needs provider authorization!");
                }
            }
            catch (err) {
                res.status(401).send("Not Authorized");
            }
        }
        else {
            res.status(401).send("Not Authorized");
        }
    });
}
exports.default = { checkAuthorization, checkAdmin, checkProvider };
