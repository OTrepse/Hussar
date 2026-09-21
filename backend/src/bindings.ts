import { Container } from "inversify";

import { UserController } from "./controllers/user_controller.js";
import { UserRepository } from "./repositories/user_repository.js";
import { TYPES } from "./services/types/types.js";

const container = new Container();

container
    .bind<UserRepository>(TYPES.UserRepository)
    .to(UserRepository)
    .inSingletonScope();

container
    .bind<UserController>(TYPES.UserController)
    .to(UserController)
    .inSingletonScope();

export default container;