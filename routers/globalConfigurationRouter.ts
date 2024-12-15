import { Router, Request, Response } from "express";
import prisma from "../prisma/db";
const router: Router = Router();

router.get('/', async (request: Request, response: Response) => {
    try {
        const configurations = await prisma.globalConfiguration.findMany({
            where: {
                deletedAt: null,
            }
        });
        return response.status(200).send(configurations);
    } catch(e) {
        response.status(500).send(e);
    }
});

export default router;