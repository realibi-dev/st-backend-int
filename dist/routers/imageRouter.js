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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const productImagesDir = "./uploads/product_images/";
router.post("/uploadProductImage", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { image, imageName, productId } = req.body;
        if (!image || !imageName || !productId) {
            return res.status(400).send("Invalid payload. Required fields: image, imageName, productId.");
        }
        // Проверка на тип productId
        if (isNaN(+productId)) {
            return res.status(400).send("Invalid productId.");
        }
        // Убедимся, что папка для сохранения существует
        if (!fs_1.default.existsSync(productImagesDir)) {
            fs_1.default.mkdirSync(productImagesDir, { recursive: true });
        }
        // Проверка на формат Base64
        const base64Pattern = /^data:image\/png;base64,/;
        if (!base64Pattern.test(image)) {
            return res.status(400).send("Invalid image format. Only Base64-encoded PNG images are allowed.");
        }
        // Генерация имени файла
        const random = Math.round(Math.random() * 1000000000).toString();
        const fileName = `${random}_${imageName.replaceAll(' ', '')}`;
        const filePath = path_1.default.join(productImagesDir, fileName);
        // Удаление префикса "data:image/png;base64,"
        const base64Data = image.replace(base64Pattern, "");
        // Сохранение файла
        fs_1.default.writeFileSync(filePath, base64Data, "base64");
        // Сохранение пути в базу данных
        yield db_1.default.product.update({
            where: { id: +productId },
            data: { image: `/file/product_images/${fileName}` },
        });
        res.status(200).send(`/file/product_images/${fileName}`);
    }
    catch (err) {
        console.error("Error uploading product image:", err);
        res.status(500).send("An error occurred while uploading the product image.");
    }
}));
const userImagesDir = "./uploads/user_images/";
router.post("/uploadUserImage", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { image, imageName, userId } = req.body;
        if (!image || !imageName || !userId) {
            return res.status(400).send("Invalid payload. Required fields: image, imageName, userId.");
        }
        // Проверка на тип userId
        if (isNaN(+userId)) {
            return res.status(400).send("Invalid userId.");
        }
        // Убедимся, что папка для сохранения существует
        if (!fs_1.default.existsSync(userImagesDir)) {
            fs_1.default.mkdirSync(userImagesDir, { recursive: true });
        }
        // Проверка на формат Base64
        const base64Pattern = /^data:image\/png;base64,/;
        if (!base64Pattern.test(image)) {
            return res.status(400).send("Invalid image format. Only Base64-encoded PNG images are allowed.");
        }
        // Генерация имени файла
        const random = Math.round(Math.random() * 1000000000).toString();
        const fileName = `${random}_${imageName}`;
        const filePath = path_1.default.join(userImagesDir, fileName);
        // Удаление префикса "data:image/png;base64,"
        const base64Data = image.replace(base64Pattern, "");
        // Сохранение файла
        fs_1.default.writeFileSync(filePath, base64Data, "base64");
        // Сохранение пути в базу данных
        yield db_1.default.user.update({
            where: { id: +userId },
            data: { image: `/file/user_images/${fileName}` },
        });
        res.status(200).send(`/file/user_images/${fileName}`);
    }
    catch (err) {
        console.error("Error uploading user image:", err);
        res.status(500).send("An error occurred while uploading the user image.");
    }
}));
router.post("/uploadSubCategoryImage", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { image, imageName, subCategoryId } = req.body;
        if (!image || !imageName || !subCategoryId) {
            return res.status(400).send("Invalid payload. Required fields: image, imageName, subCategoryId.");
        }
        // Проверка на тип подкатегории
        if (isNaN(+subCategoryId)) {
            return res.status(400).send("Invalid subCategoryId.");
        }
        // Убедимся, что папка для сохранения существует
        if (!fs_1.default.existsSync("./uploads/subcategories_images/")) {
            fs_1.default.mkdirSync("./uploads/subcategories_images/", { recursive: true });
        }
        // Проверка на формат Base64
        const base64Pattern = /^data:image\/png;base64,/;
        if (!base64Pattern.test(image)) {
            return res.status(400).send("Invalid image format. Only Base64-encoded PNG images are allowed.");
        }
        // Генерация имени файла
        const random = Math.round(Math.random() * 1000000000).toString();
        const fileName = `${random}_${imageName}`;
        const filePath = path_1.default.join("./uploads/subcategories_images/", fileName);
        // Удаление префикса "data:image/png;base64,"
        const base64Data = image.replace(base64Pattern, "");
        // Сохранение файла
        fs_1.default.writeFileSync(filePath, base64Data, "base64");
        // Сохранение пути в базу данных
        yield db_1.default.subCategory.update({
            where: { id: +subCategoryId },
            data: { image: `/file/subcategories_images/${fileName}` },
        });
        res.status(200).send(`/file/subcategories_images/${fileName}`);
    }
    catch (err) {
        console.error("Error uploading image:", err);
        res.status(500).send("An error occurred while uploading the image.");
    }
}));
exports.default = router;
