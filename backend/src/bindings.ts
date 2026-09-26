import { Container } from "inversify";

import { UserController } from "./controllers/user_controller.js";
import { UserRepository } from "./repositories/user_repository.js";
import { PracticeItemsController } from "./controllers/practice_item_controller.js";
import {PracticeItemsRepository, PracticeItemsRepositoryImpl} from "./repositories/practice_items_repository.js";
import { TYPES } from "./services/types/types.js";

const container = new Container();

//========USER==========//
container
    .bind<UserRepository>(TYPES.UserRepository)
    .to(UserRepository)
    .inSingletonScope();

container
    .bind<UserController>(TYPES.UserController)
    .to(UserController)
    .inSingletonScope();

//========PRACTICE ITEMS==========//
container
    .bind<PracticeItemsRepository>(PracticeItemsRepository)
    .to(PracticeItemsRepositoryImpl)
    .inSingletonScope();

container
    .bind(PracticeItemsController)
    .toSelf();

export const iocContainer = {
    get: <T>(controller: new (...args: any[]) => T): T => {
        return container.get(controller);
    }
};

export default container;