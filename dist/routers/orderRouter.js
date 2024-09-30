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
const db_1 = __importDefault(require("./../prisma/db"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    try {
        db_1.default.order.findMany({
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
        db_1.default.order.findFirst({
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
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orderInfo = req.body;
        orderInfo.orderNumber = String(Math.round(Math.random() * 100000000));
        const cart = yield db_1.default.cart.findFirst({
            where: {
                id: orderInfo.cartId,
            }
        });
        const cartItems = yield db_1.default.cartItem.findMany({
            where: {
                cartId: cart === null || cart === void 0 ? void 0 : cart.id,
            }
        });
        orderInfo.totalPrice = cartItems.reduce((currentSum, item) => {
            return currentSum + (item.price || 0) * item.quantity;
        }, 0);
        const orderPayload = Object.assign(Object.assign({}, orderInfo), { cartId: undefined });
        db_1.default.order.create({
            data: orderPayload,
        })
            .then((order) => {
            cartItems.map((item) => __awaiter(void 0, void 0, void 0, function* () {
                yield db_1.default.orderItem.create({
                    data: {
                        productId: item.productId,
                        orderId: order.id,
                        price: item.price || 0,
                        status: order.status,
                        quantity: item.quantity,
                    }
                });
            }));
            res.status(201).send("Order created");
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
}));
exports.default = router;
