import { Container } from "inversify";

import { UserController } from "./controllers/user_controller.js";
import { UserRepository } from "./repositories/user_repository.js";
import { PracticeItemsController } from "./controllers/practice_item_controller.js";
import {PracticeItemsRepository, PracticeItemsRepositoryImpl} from "./repositories/practice_items_repository.js";
import { TYPES } from "./services/types/types.js";
import {SpeechmaticsService} from "./services/speechmatics_service.js";
import {SpeechController} from "./controllers/speech_controller.js";


// BASICALLY THE BINDINGS CREATE A NEW INSTANCE OF WHATEVER IS CALLED USING INVERSIFY
const container = new Container();

//========USER==========//
container
    .bind<UserRepository>(TYPES.UserRepository)
    .to(UserRepository)
    .inSingletonScope();

container
    .bind<UserController>(UserController)
    .toSelf()
    .inSingletonScope();

//========PRACTICE ITEMS==========//
container
    .bind<PracticeItemsRepository>(PracticeItemsRepository)
    .to(PracticeItemsRepositoryImpl)
    .inSingletonScope();

container
    .bind<PracticeItemsController>(PracticeItemsController)
    .toSelf()
    .inSingletonScope();

//========SPEECHMATICS SERVICE==========//
container
    .bind<SpeechmaticsService>(SpeechmaticsService)
    .toSelf()
    .inSingletonScope();

//========SPEECH==========//
container
    .bind<SpeechController>(SpeechController)
    .toSelf()
    .inSingletonScope();


export const iocContainer = {
    get: <T>(controller: new (...args: any[]) => T): T => {
        return container.get(controller);
    }
};

export default container;
