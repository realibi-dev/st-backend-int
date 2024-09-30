import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
const router: Router = Router();

interface IProviderProfile {
    name: string;
    image: string|undefined;
    userId: number;
}

router.get("/", (req: Request, res: Response) => {
    try {
        prisma.providerProfile.findMany({
            where: {
                deletedAt: null,
            }
        })
        .then((data) => {
            res.status(200).send(data);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.get("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.providerProfile.findFirst({
            where: {
                deletedAt: null,
                id: id,
            }
        })
        .then((data) => {
            res.status(200).send(data);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.post("/", (req: Request, res: Response) => {
    try {
        const providerInfo: IProviderProfile = req.body;
        prisma.providerProfile.create({
            data: providerInfo,
        })
        .then(() => {
            res.status(201).send("Provider profile created");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.put("/:id", (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        const providerInfo: IProviderProfile = req.body;

        prisma.providerProfile.update({
            where: {
                id: id,
            }, 
            data: {
                ...providerInfo,
                updatedAt: new Date(),
            },
        })
        .then(() => {
            res.status(200).send("Provider profile changed");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

router.delete("/:id", (req: Request, res: Response) => {
    const id = +req.params.id;

    try {
        prisma.providerProfile.update({
            where: {
                id: id,
            },
            data: {
                deletedAt: new Date()
            }
        })
        .then((data) => {
            res.status(200).send("Provider profile deleted");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error. Please try later");
    }
})

export default router;