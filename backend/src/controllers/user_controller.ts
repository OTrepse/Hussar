import {Controller, Get, Route, Tags} from "tsoa";
import {inject, injectable} from "inversify";

import {UserRepository} from "../repositories/user_repository.js";
import {TYPES} from "../services/types/types.js";

@Route("users")
@Tags("Users")
@injectable()
export class UserController extends Controller {
    public constructor(@inject(TYPES.UserRepository) private readonly userRepository: UserRepository) {
        super();
    }

    @Get("test")
    public async test(): Promise<{message: string}> {
        const message = await this.userRepository.test();
        return { message };
    }
}