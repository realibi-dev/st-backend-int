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
const middlewares_1 = __importDefault(require("../middlewares"));
const router = (0, express_1.Router)();
router.get("/orders", middlewares_1.default.checkProvider, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = helpers_1.default.getCurrentUserInfo(req);
        const provider = yield db_1.default.providerProfile.findFirst({
            where: {
                userId: currentUser.id,
                deletedAt: null,
            }
        });
        const providerProducts = yield db_1.default.product.findMany({
            where: {
                providerId: provider === null || provider === void 0 ? void 0 : provider.id,
                deletedAt: null,
            }
        });
        let orderItems = yield db_1.default.orderItem.findMany({
            where: {
                deletedAt: null,
                productId: {
                    in: providerProducts.map((product) => product.id),
                },
            }
        });
        const products = yield db_1.default.product.findMany({
            where: {
                id: {
                    in: orderItems.map((item) => item.productId),
                },
            }
        });
        orderItems = orderItems.map((item) => {
            var _a;
            return Object.assign(Object.assign({}, item), { productName: (_a = products.find((product) => product.id === item.productId)) === null || _a === void 0 ? void 0 : _a.name });
        });
        let orders = yield db_1.default.order.findMany({
            where: {
                deletedAt: null,
                id: {
                    in: orderItems.map((item) => item.orderId),
                },
            }
        });
        orders = orders.map((order) => {
            return Object.assign(Object.assign({}, order), { items: orderItems.filter((item) => item.orderId === order.id) });
        });
        res.status(200).send(orders);
    }
    catch (error) {
        console.error(new Date().toISOString(), error);
        res.status(500).send(error);
    }
}));
router.get("/", (req, res) => {
    try {
        db_1.default.providerProfile.findMany({
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
        db_1.default.providerProfile.findFirst({
            where: {
                deletedAt: null,
                id: id,
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
router.post("/", (req, res) => {
    try {
        const providerInfo = req.body;
        db_1.default.providerProfile.create({
            data: providerInfo,
        })
            .then(() => {
            res.status(201).send("Provider profile created");
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
router.put("/:id", (req, res) => {
    try {
        const id = +req.params.id;
        const providerInfo = req.body;
        db_1.default.providerProfile.update({
            where: {
                id: id,
            },
            data: Object.assign(Object.assign({}, providerInfo), { updatedAt: new Date() }),
        })
            .then(() => {
            res.status(200).send("Provider profile changed");
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
        db_1.default.providerProfile.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
            .then((data) => {
            res.status(200).send("Provider profile deleted");
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
