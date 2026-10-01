import {
    Controller,
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

@Route("speech")
@Tags("Speech")
@injectable()
export class SpeechController extends Controller {

    public constructor(@inject(SpeechmaticsService) private readonly speechmaticsService: SpeechmaticsService) {
        super();
    }

    //THIS CALLS THE SPEECHMATICS SERVICE TRANSCRIBE METHOD AND ALLOWS IT TO TRANSCRIBE THE AUDIO INPUT
    @Post("transcribe")
    public async transcribe(@UploadedFile() audio: Express.Multer.File): Promise<unknown> {
        return this.speechmaticsService.transcribe(
            audio.buffer,
            audio.originalname,
            audio.mimetype,
        );
    }
}