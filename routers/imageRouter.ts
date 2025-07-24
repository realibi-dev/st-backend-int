import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import path from "path";
import fs from "fs";
const router: Router = Router();

const productImagesDir = "./uploads/product_images/";

router.post("/uploadProductImage", async (req: Request, res: Response) => {
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
    if (!fs.existsSync(productImagesDir)) {
      fs.mkdirSync(productImagesDir, { recursive: true });
    }

    // Проверка на формат Base64
    const base64Pattern = /^data:image\/(png|jpeg);base64,/;
    if (!base64Pattern.test(image)) {
      return res.status(400).send("Invalid image format. Only Base64-encoded PNG and JPEG images are allowed.");
    }

    // Генерация имени файла
    const random = Math.round(Math.random() * 1000000000).toString();
    const fileName = `${random}_${imageName.replaceAll(' ', '')}`;
    const filePath = path.join(productImagesDir, fileName);

    // Удаление префикса "data:image/(png|jpeg);base64,"
    const base64Data = image.replace(base64Pattern, "");

    // Проверка размера файла (50MB лимит для Base64 данных)
    const fileSizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
    if (fileSizeInBytes > maxSizeInBytes) {
      return res.status(400).send("File size exceeds 50MB limit.");
    }

    // Асинхронное сохранение файла
    await fs.promises.writeFile(filePath, base64Data, "base64");

    // Сохранение пути в базу данных
    await prisma.product.update({
      where: { id: +productId },
      data: { image: `/file/product_images/${fileName}` },
    });

    res.status(200).send(`/file/product_images/${fileName}`);
  } catch (err) {
    console.error("Error uploading product image:", err);
    res.status(500).send("An error occurred while uploading the product image.");
  }
});

const userImagesDir = "./uploads/user_images/";

router.post("/uploadUserImage", async (req: Request, res: Response) => {
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
    if (!fs.existsSync(userImagesDir)) {
      fs.mkdirSync(userImagesDir, { recursive: true });
    }

    // Проверка на формат Base64
    const base64Pattern = /^data:image\/(png|jpeg);base64,/;
    if (!base64Pattern.test(image)) {
      return res.status(400).send("Invalid image format. Only Base64-encoded PNG and JPEG images are allowed.");
    }

    // Генерация имени файла
    const random = Math.round(Math.random() * 1000000000).toString();
    const fileName = `${random}_${imageName}`;
    const filePath = path.join(userImagesDir, fileName);

    // Удаление префикса "data:image/(png|jpeg);base64,"
    const base64Data = image.replace(base64Pattern, "");

    // Проверка размера файла (50MB лимит для Base64 данных)
    const fileSizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
    if (fileSizeInBytes > maxSizeInBytes) {
      return res.status(400).send("File size exceeds 50MB limit.");
    }

    // Асинхронное сохранение файла
    await fs.promises.writeFile(filePath, base64Data, "base64");

    // Сохранение пути в базу данных
    await prisma.user.update({
      where: { id: +userId },
      data: { image: `/file/user_images/${fileName}` },
    });

    res.status(200).send(`/file/user_images/${fileName}`);
  } catch (err) {
    console.error("Error uploading user image:", err);
    res.status(500).send("An error occurred while uploading the user image.");
  }
});

router.post("/uploadSubCategoryImage", async (req: Request, res: Response) => {
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
    if (!fs.existsSync("./uploads/subcategories_images/")) {
      fs.mkdirSync("./uploads/subcategories_images/", { recursive: true });
    }

    // Проверка на формат Base64
    const base64Pattern = /^data:image\/(png|jpeg);base64,/;
    if (!base64Pattern.test(image)) {
      return res.status(400).send("Invalid image format. Only Base64-encoded PNG and JPEG images are allowed.");
    }

    // Генерация имени файла
    const random = Math.round(Math.random() * 1000000000).toString();
    const fileName = `${random}_${imageName}`;
    const filePath = path.join("./uploads/subcategories_images/", fileName);

    // Удаление префикса "data:image/(png|jpeg);base64,"
    const base64Data = image.replace(base64Pattern, "");

    // Проверка размера файла (50MB лимит для Base64 данных)
    const fileSizeInBytes = (base64Data.length * 3) / 4;
    const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
    if (fileSizeInBytes > maxSizeInBytes) {
      return res.status(400).send("File size exceeds 50MB limit.");
    }

    // Асинхронное сохранение файла
    await fs.promises.writeFile(filePath, base64Data, "base64");

    // Сохранение пути в базу данных
    await prisma.subCategory.update({
      where: { id: +subCategoryId },
      data: { image: `/file/subcategories_images/${fileName}` },
    });

    res.status(200).send(`/file/subcategories_images/${fileName}`);
  } catch (err) {
    console.error("Error uploading image:", err);
    res.status(500).send("An error occurred while uploading the image.");
  }
});

export default router;