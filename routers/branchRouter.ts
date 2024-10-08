import { Router, Request, Response } from "express";
import prisma from "./../prisma/db";
import middlewares from "../middlewares";
const router: Router = Router();

interface IBranch {
    name: string;
    address: string;
    contactPerson: string;
    contactPhone: string;
    openTime: string;
    closeTime: string;
    userId: number;
    isActive: boolean|undefined; // need only for put request
    isVerified: boolean|undefined; // need only for put request
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.branch.findMany({
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.get("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.branch.findFirst({
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
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/", (req: Request, res: Response) => {
    try {
        const branchInfo: IBranch = req.body;
        prisma.branch.create({
            data: branchInfo,
        })
        .then(() => {
            res.status(201).send("Branch created");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        })

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.put("/:id", (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        const branchInfo: IBranch = req.body;

        prisma.branch.update({
            where: {
                id: id,
            }, 
            data: {
                ...branchInfo,
                updatedAt: new Date(),
            },
        })
        .then(() => {
            res.status(200).send("Branch changed");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.delete("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.branch.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            res.status(200).send("Branch deleted");
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Server error. Please try later");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;