import {
    Controller,
    Get,
    Path,
    Route,
    Tags
} from 'tsoa';
import {inject, injectable} from 'inversify';

import {
    PracticeItemsRepository
} from '../repositories/practice_items_repository.js';

import {
    PracticeItem
} from '../classes/practice_item.js';

@Route('practice-items')
@Tags('Practice Items')
@injectable()
export class PracticeItemsController extends Controller {

    constructor(
        @inject(PracticeItemsRepository)
        private readonly repository: PracticeItemsRepository
    ) {
        super();
    }

    @Get()
    public async listPracticeItems(): Promise<PracticeItem[]> {
        return this.repository.listPracticeItems();
    }

    @Get('{id}')
    public async getPracticeItem(
        @Path() id: number
    ): Promise<PracticeItem | undefined> {
        return this.repository.getPracticeItem(id);
    }
}