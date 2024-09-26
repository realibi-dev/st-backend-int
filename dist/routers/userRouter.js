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
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./../prisma/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const middlewares_1 = __importDefault(require("./../middlewares"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const secretKey = process.env.SECRET_KEY || "";
router.get("/", middlewares_1.default.checkAdmin, (req, res) => {
    try {
        db_1.default.user.findMany({
            where: {
                deletedAt: null,
            }
        })
            .then((data) => {
            res.status(200).send(data);
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.get("/:id", (req, res) => {
    const id = +req.params.id;
    try {
        db_1.default.user.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
        })
            .then((data) => {
            res.status(200).send(data);
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.post("/auth", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = req.body;
        const user = yield db_1.default.user.findFirst({
            where: {
                deletedAt: null,
                username: userData.username,
                password: userData.password
            }
        });
        if (!user) {
            res.status(400).send("User not found");
            return;
        }
        // creating token
        const payload = Object.assign({}, user);
        const options = {
            expiresIn: '2h'
        };
        const token = jsonwebtoken_1.default.sign(payload, secretKey, options);
        res.send({
            user: Object.assign(Object.assign({}, user), { password: undefined }),
            token: token
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userInfo = req.body;
        const existingUser = yield db_1.default.user.findFirst({
            where: {
                OR: [
                    {
                        username: userInfo.username,
                    },
                    {
                        phone: userInfo.phone,
                    }
                ]
            }
        });
        if (existingUser) {
            res.status(400).send("User already exists!");
            return;
        }
        const user = yield db_1.default.user.create({
            data: {
                username: userInfo.username,
                password: userInfo.password,
                accountType: userInfo.accountType,
                fullname: userInfo.fullname,
                phone: userInfo.phone,
            },
        });
        switch (userInfo.accountType) {
            case 'cafeOwner':
                db_1.default.branch.create({
                    data: {
                        name: userInfo.cafeName || '',
                        address: userInfo.cafeAddress || '',
                        contactPerson: userInfo.fullname,
                        contactPhone: userInfo.phone,
                        openTime: userInfo.openTime || '',
                        closeTime: userInfo.closeTime || '',
                        userId: user.id,
                    }
                })
                    .then(() => {
                    console.log("Branch created for user " + userInfo.username);
                });
                break;
            case 'provider':
                break;
            case 'regularUser':
                break;
        }
        res.status(201).send("User created");
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
router.delete("/:id", (req, res) => {
    const id = +req.params.id;
    try {
        db_1.default.user.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
            .then((data) => {
            res.status(200).send("User deleted");
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
exports.default = router;
