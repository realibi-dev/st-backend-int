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
        db_1.default.category.findMany({
            where: {
                deletedAt: null,
            }
        })
            .then((categories) => __awaiter(void 0, void 0, void 0, function* () {
            const subCategories = yield db_1.default.subCategory.findMany({
                where: {
                    deletedAt: null,
                }
            });
            categories = categories.map(item => {
                return Object.assign(Object.assign({}, item), { subCategories: subCategories.filter(subCategory => subCategory.categoryId === item.id) });
            });
            res.status(200).send(categories);
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
        db_1.default.category.findFirst({
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
        const categoryInfo = req.body;
        db_1.default.category.create({
            data: Object.assign({ id: Math.floor(Math.random() * 1000000000) }, categoryInfo),
        })
            .then(() => {
            res.status(201).send("Category created");
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
router.post("/subCategories", (req, res) => {
    try {
        const subCategoryInfo = req.body;
        db_1.default.subCategory.create({
            data: Object.assign({ id: Math.floor(Math.random() * 1000000000) }, subCategoryInfo),
        })
            .then(() => {
            res.status(201).send("Subcategory created");
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
        const categoryInfo = req.body;
        db_1.default.category.update({
            where: {
                id: id,
            },
            data: Object.assign(Object.assign({}, categoryInfo), { updatedAt: new Date() }),
        })
            .then(() => {
            res.status(200).send("Category changed");
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
        db_1.default.category.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
            .then((data) => {
            res.status(200).send("Category deleted");
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
