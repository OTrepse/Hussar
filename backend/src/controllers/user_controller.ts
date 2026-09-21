import { Router, type Request, type Response } from "express";
import { inject, injectable } from "inversify";

import { UserRepository } from "../repositories/user_repository.js";
import { TYPES } from "../services/types/types.js";

@injectable()
export class UserController {

    public readonly router = Router();

    public constructor(
        @inject(TYPES.UserRepository)
        private readonly userRepository: UserRepository,
    ) {
        this.router.get("/test", this.test.bind(this));
    }

    private async test(
        _req: Request,
        res: Response,
    ): Promise<void> {

        const message = await this.userRepository.test();

        res.status(200).json({
            message,
        });
    }

}