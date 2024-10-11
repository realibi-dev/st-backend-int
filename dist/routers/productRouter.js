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
const helpers_1 = __importDefault(require("./../helpers"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    // TODO: test this endpoint with userId in req body
    try {
        db_1.default.product.findMany({
            where: {
                deletedAt: null,
            }
        })
            .then((data) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            const currentUserId = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = helpers_1.default.getCurrentUserInfo(req)) === null || _b === void 0 ? void 0 : _b.id);
            if (currentUserId) {
                const newPriceProducts = yield db_1.default.productNewPrice.findMany({
                    where: {
                        deletedAt: null,
                        userId: currentUserId
                    }
                });
                if (newPriceProducts.length) {
                    const productsWithUpdatedPrices = data.map(product => {
                        var _a;
                        return Object.assign(Object.assign({}, product), { price: ((_a = newPriceProducts.find(item => item.productId === product.id)) === null || _a === void 0 ? void 0 : _a.price) || product.price });
                    });
                    res.status(200).send(productsWithUpdatedPrices);
                    return;
                }
            }
            res.status(200).send(data);
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
router.get("/:id", (req, res) => {
    const id = +req.params.id;
    try {
        db_1.default.product.findFirst({
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
        const productInfo = req.body;
        console.log("Product info", productInfo);
        db_1.default.product.create({
            data: productInfo,
        })
            .then(() => {
            res.status(201).send("Product created");
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
        const productInfo = req.body;
        db_1.default.product.update({
            where: {
                id: id,
            },
            data: Object.assign(Object.assign({}, productInfo), { updatedAt: new Date() }),
        })
            .then(() => {
            res.status(200).send("Product changed");
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
        db_1.default.product.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
            .then((data) => {
            res.status(200).send("Product deleted");
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
router.post('/changeprice', (req, res) => {
    try {
        const data = req.body;
        db_1.default.productNewPrice.create({
            data: {
                userId: data.userId,
                productId: data.productId,
                price: data.newPrice,
            }
        })
            .then((data) => {
            console.log("Product price changed for account id", data.userId);
            res.status(201).send(data);
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
