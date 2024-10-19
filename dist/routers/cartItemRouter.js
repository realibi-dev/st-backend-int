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
const db_1 = __importDefault(require("../prisma/db"));
const helpers_1 = __importDefault(require("../helpers"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    try {
        db_1.default.cartItem.findMany({
            where: {
                deletedAt: null,
            }
        })
            .then((data) => {
            res.status(200).send(data);
        })
            .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
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
        db_1.default.cartItem.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
        })
            .then((data) => __awaiter(void 0, void 0, void 0, function* () {
            const cartItems = yield db_1.default.cartItem.findMany({
                where: {
                    deletedAt: null,
                    cartId: data === null || data === void 0 ? void 0 : data.id,
                }
            });
            res.status(200).send(Object.assign(Object.assign({}, data), { items: cartItems }));
        }))
            .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = helpers_1.default.getCurrentUserInfo(req);
        const cartItemInfo = req.body;
        if (currentUser) {
            let cart = yield db_1.default.cart.findFirst({
                where: {
                    userId: currentUser.id,
                    deletedAt: null,
                }
            });
            if (!cart) {
                cart = yield db_1.default.cart.create({
                    data: {
                        userId: currentUser.id,
                    }
                });
            }
            db_1.default.product.findFirst({
                where: {
                    deletedAt: null,
                    id: cartItemInfo.productId,
                }
            })
                .then((product) => {
                if (product) {
                    db_1.default.cartItem.create({
                        data: Object.assign(Object.assign({}, cartItemInfo), { cartId: cart.id, price: cartItemInfo.price || (product === null || product === void 0 ? void 0 : product.price) }),
                    })
                        .then(() => {
                        res.status(201).send("Cart item created");
                    });
                }
                else {
                    res.status(400).send("Product not found!");
                }
            })
                .catch((err) => {
                console.error(err);
                res.status(500).send("Server error. Please try later");
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Server error. Please try later");
    }
}));
router.put("/:id", (req, res) => {
    try {
        const id = +req.params.id;
        const cartInfo = req.body;
        db_1.default.cartItem.update({
            where: {
                id: id,
            },
            data: Object.assign(Object.assign({}, cartInfo), { updatedAt: new Date() }),
        })
            .then(() => {
            res.status(200).send("Cart item changed");
        })
            .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
router.delete("/:id", (req, res) => {
    const id = +req.params.id;
    try {
        db_1.default.cartItem.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
            .then((data) => {
            res.status(200).send("Cart item deleted");
        })
            .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
});
exports.default = router;
