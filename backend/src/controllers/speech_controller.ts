import {
    Controller, FormField,
    Post,
    Route,
    Tags,
    UploadedFile,
} from "tsoa";
import {
    inject,
    injectable,
} from "inversify";
import { SpeechmaticsService } from "../services/speechmatics_service.js";
import {PracticeItemsRepository} from "../repositories/practice_items_repository.js";

@Route("speech")
@Tags("Speech")
@injectable()
export class SpeechController extends Controller {

    public constructor(
        @inject(SpeechmaticsService) private readonly speechmaticsService: SpeechmaticsService,
        @inject(PracticeItemsRepository) private readonly practiceItemsRepository: PracticeItemsRepository
    ) {
        super();
    }

    //THIS CALLS THE SPEECHMATICS SERVICE TRANSCRIBE METHOD AND ALLOWS IT TO TRANSCRIBE THE AUDIO INPUT
    @Post("transcribe")
    public async transcribe(
        @UploadedFile() audio: Express.Multer.File,
        @FormField() practiceItemId: number,
    ): Promise<unknown> {
        const practiceItem =
            await this.practiceItemsRepository.getPracticeItem(practiceItemId);

        if (!practiceItem) {
            this.setStatus(404);
            return {message: "Practice item not found"};
        }

        return this.speechmaticsService.transcribe(
            audio.buffer,
            audio.originalname,
            audio.mimetype,
            practiceItem.polishText,
        );
    }
}