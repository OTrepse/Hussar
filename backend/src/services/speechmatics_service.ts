import {injectable} from "inversify";

@injectable()
export class SpeechmaticsService {

    private readonly apiKey: string;

    private readonly baseUrl =
        "https://asr.api.speechmatics.com/v2";

    public constructor() {
        const apiKey = process.env.SPEECHMATICS_API_KEY;

        if (!apiKey) {
            throw new Error(
                "SPEECHMATICS_API_KEY environment variable is not configured."
            );
        }

        this.apiKey = apiKey;
    }

    public async transcribe(
        audio: Buffer,
        filename: string,
        contentType: string,
    ): Promise<unknown> {

        const jobId = await this.createJob(
            audio,
            filename,
            contentType,
        );

        await this.waitForJob(jobId);

        return this.getTranscript(jobId);
    }

    private async createJob(
        audio: Buffer,
        filename: string,
        contentType: string,
    ): Promise<string> {

        const formData = new FormData();

        const audioBlob = new Blob(
            [new Uint8Array(audio)],
            {
                type: contentType,
            },
        );

        formData.append(
            "data_file",
            audioBlob,
            filename,
        );

        formData.append(
            "config",
            JSON.stringify({
                type: "transcription",
                transcription_config: {
                    language: "pl",
                },
            }),
        );

        const response = await fetch(
            `${this.baseUrl}/jobs`,
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${this.apiKey}`,
                },
                body: formData,
            },
        );

        if (!response.ok) {
            const error = await response.text();

            throw new Error(
                `Speechmatics job creation failed (${response.status}): ${error}`,
            );
        }

        const result = await response.json() as {
            id: string;
        };

        return result.id;
    }

    private async waitForJob(
        jobId: string,
    ): Promise<void> {

        while (true) {

            const response = await fetch(
                `${this.baseUrl}/jobs/${jobId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${this.apiKey}`,
                    },
                },
            );

            if (!response.ok) {
                const error = await response.text();

                throw new Error(
                    `Speechmatics status request failed (${response.status}): ${error}`,
                );
            }

            const result = await response.json() as {
                job: {
                    status: string;
                };
            };

            const status = result.job.status;

            console.log(
                `Speechmatics job ${jobId}: ${status}`,
            );

            if (status === "done") {
                return;
            }

            if (
                status === "rejected"
                || status === "failed"
            ) {
                throw new Error(
                    `Speechmatics transcription failed with status: ${status}`,
                );
            }

            await this.delay(1000);
        }
    }

    private async getTranscript(
        jobId: string,
    ): Promise<unknown> {

        const response = await fetch(
            `${this.baseUrl}/jobs/${jobId}/transcript?format=json-v2`,
            {
                headers: {
                    Authorization:
                        `Bearer ${this.apiKey}`,
                },
            },
        );

        if (!response.ok) {
            const error = await response.text();

            throw new Error(
                `Speechmatics transcript request failed (${response.status}): ${error}`,
            );
        }

        return response.json();
    }

    private delay(
        milliseconds: number,
    ): Promise<void> {

        return new Promise((resolve) => {
            setTimeout(resolve, milliseconds);
        });
    }
}