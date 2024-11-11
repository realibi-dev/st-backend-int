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
        db_1.default.cart.findMany({
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
        db_1.default.cart.findFirst({
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
router.post("/", (req, res) => {
    try {
        const cartInfo = req.body;
        db_1.default.cart.create({
            data: cartInfo,
        })
            .then(() => {
            res.status(201).send("Cart created");
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
router.post("/addItem", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const newCartItem = req.body;
        const currentUserId = (_a = helpers_1.default.getCurrentUserInfo(req)) === null || _a === void 0 ? void 0 : _a.id;
        if (currentUserId) {
            let existingCart = yield db_1.default.cart.findFirst({
                where: {
                    deletedAt: null,
                    userId: currentUserId,
                }
            });
            if (!existingCart) {
                existingCart = yield db_1.default.cart.create({
                    data: {
                        userId: currentUserId,
                    }
                });
            }
            const existingItemInCart = yield db_1.default.cartItem.findFirst({
                where: {
                    deletedAt: null,
                    cartId: existingCart.id,
                    productId: newCartItem.productId
                }
            });
            let cartItemId = existingItemInCart === null || existingItemInCart === void 0 ? void 0 : existingItemInCart.id;
            if (existingItemInCart) {
                yield db_1.default.cartItem.update({
                    where: {
                        id: existingItemInCart.id,
                    },
                    data: {
                        quantity: newCartItem.quantity,
                    }
                });
            }
            else {
                const product = yield db_1.default.product.findFirst({
                    where: {
                        deletedAt: null,
                        id: newCartItem.productId,
                    }
                });
                const newItem = yield db_1.default.cartItem.create({
                    data: {
                        productId: newCartItem.productId,
                        cartId: existingCart.id,
                        price: newCartItem.price || (product === null || product === void 0 ? void 0 : product.price) || 0,
                        quantity: newCartItem.quantity,
                        id: Math.round(Math.random() * 1000000000),
                    }
                });
                cartItemId = newItem.id;
            }
            res.status(201).send({ success: true, cartItemId });
        }
        else {
            res.status(401).send({
                success: false,
                message: "User not authorized",
            });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false });
    }
}));
router.delete("/:id", (req, res) => {
    const id = +req.params.id;
    try {
        db_1.default.cart.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
            .then((data) => {
            res.status(200).send("Cart deleted");
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
