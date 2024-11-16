import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
import path from "path";
import fs from "fs";
import multer from "multer";
const router: Router = Router();

const handleError = (err: any, res: Response) => {
    console.log(err);

    res
    .status(500)
    .contentType("text/plain")
    .send("Oops! Something went wrong!");
};  

const upload = multer({
    dest: "./images"
});

router.post("/uploadProductImage", upload.single("image"), (req: Request, res: Response) => {
    const tempPath = req.file?.path;
    const random = Math.round(Math.random() * 1000000000).toString();
    const targetPath = path.join(`./uploads/product_images/${random}.png`);

    const productId = req.body.productId;

    if (path.extname(req.file?.originalname || "file.png").toLowerCase() === ".png") {
      fs.rename(tempPath || "", targetPath, async err => {
        if (err) return handleError(err, res);

        await prisma.product.update({
            where: {
                id: +productId
            },
            data: {
                image: `/file/product_images/${random}.png`,
            }
        })
        .then(() => {
            res
            .status(200)
            .contentType("text/plain")
            .end(`/file/product_images/${random}.png`);
        })
        .catch(err => {
            handleError(err, res);
        })
      });
    } else {
      fs.unlink(tempPath || "", err => {
        if (err) return handleError(err, res);

        res
          .status(403)
          .contentType("text/plain")
          .end("Only .png files are allowed!");
      });
    }
});

router.post("/uploadUserImage", upload.single("image"), (req: Request, res: Response) => {
    const tempPath = req.file?.path;
    const random = Math.round(Math.random() * 1000000000).toString();
    const targetPath = path.join(`./uploads/user_images/${random}.png`);

    const userId = req.body.userId;

    if (path.extname(req.file?.originalname || "file.png").toLowerCase() === ".png") {
      fs.rename(tempPath || "", targetPath, async err => {
        if (err) return handleError(err, res);

        await prisma.user.update({
            where: {
                id: +userId
            },
            data: {
                image: `/file/user_images/${random}.png`,
            }
        })
        .then(() => {
            res
            .status(200)
            .contentType("text/plain")
            .end(`/file/user_images/${random}.png`);
        })
        .catch(err => {
            handleError(err, res);
        })
      });
    } else {
      fs.unlink(tempPath || "", err => {
        if (err) return handleError(err, res);

        res
          .status(403)
          .contentType("text/plain")
          .end("Only .png files are allowed!");
      });
    }
});

router.post("/uploadSubCategoryImage", upload.single("image"), (req: Request, res: Response) => {
  const tempPath = req.file?.path;
  const random = Math.round(Math.random() * 1000000000).toString();
  const targetPath = path.join(`./uploads/subcategories_images/${random}.png`);

  const subCategoryId = req.body.subCategoryId;

  console.log("subCategoryId", subCategoryId);

  if (path.extname(req.file?.originalname || "file.png").toLowerCase() === ".png") {
    fs.rename(tempPath || "", targetPath, async err => {
      if (err) return handleError(err, res);

      await prisma.subCategory.update({
          where: {
              id: +subCategoryId
          },
          data: {
              image: `/file/subcategories_images/${random}.png`,
          }
      })
      .then(() => {
          res
          .status(200)
          .contentType("text/plain")
          .end(`/file/subcategories_images/${random}.png`);
      })
      .catch(err => {
          handleError(err, res);
      })
    });
  } else {
    fs.unlink(tempPath || "", err => {
      if (err) return handleError(err, res);

      res
        .status(403)
        .contentType("text/plain")
        .end("Only .png files are allowed!");
    });
  }
});

export default router;