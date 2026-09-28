import { randomUUID } from "crypto";
import express, { Router, type Request, type Response } from "express";
import { mkdir, writeFile } from "fs/promises";
import { dirname, extname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { injectable } from "inversify";

type StashedAudioResponse = {
    id: string;
    originalFilename: string;
    storedFilename: string;
    relativePath: string;
    contentType: string;
    size: number;
    createdAt: string;
};

const BACKEND_ROOT_DIRECTORY = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
);
const AUDIO_UPLOAD_DIRECTORY = join(BACKEND_ROOT_DIRECTORY, "uploads", "audio");
const MAX_AUDIO_SIZE = "25mb";

const allowedExtensions = new Set([
    ".m4a",
    ".mp3",
    ".ogg",
    ".wav",
    ".webm",
]);

function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[/\\?%*:|"<>]/g, "_")
        .replace(/\s+/g, "_")
        .slice(0, 120);
}

function getAudioExtension(
    originalFilename: string,
    contentType: string,
): string {
    const originalExtension = extname(originalFilename).toLowerCase();

    if (allowedExtensions.has(originalExtension)) {
        return originalExtension;
    }

    switch (contentType) {
        case "audio/mp4":
            return ".m4a";
        case "audio/mpeg":
            return ".mp3";
        case "audio/ogg":
            return ".ogg";
        case "audio/wav":
        case "audio/wave":
            return ".wav";
        default:
            return ".webm";
    }
}

@injectable()
export class AudioStashController {

    public readonly router = Router();

    public constructor() {
        this.router.post(
            "/",
            express.raw({
                limit: MAX_AUDIO_SIZE,
                type: ["audio/*", "application/octet-stream"],
            }),
            this.create.bind(this),
        );
    }

    private async create(
        req: Request,
        res: Response<StashedAudioResponse | { message: string }>,
    ): Promise<void> {

        const audioBuffer = req.body;

        if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
            res.status(400).json({
                message: "No audio file was uploaded.",
            });
            return;
        }

        const contentType = req.header("content-type")?.split(";")[0]
            || "application/octet-stream";

        if (
            !contentType.startsWith("audio/")
            && contentType !== "application/octet-stream"
        ) {
            res.status(415).json({
                message: "Only audio uploads are supported.",
            });
            return;
        }

        const originalFilename = sanitizeFilename(
            req.header("x-audio-filename") || "recording.webm",
        );
        const id = randomUUID();
        const extension = getAudioExtension(originalFilename, contentType);
        const storedFilename = `${id}${extension}`;

        await mkdir(AUDIO_UPLOAD_DIRECTORY, {
            recursive: true,
        });
        await writeFile(join(AUDIO_UPLOAD_DIRECTORY, storedFilename), audioBuffer);

        res.status(201).json({
            id,
            originalFilename,
            storedFilename,
            relativePath: `uploads/audio/${storedFilename}`,
            contentType,
            size: audioBuffer.length,
            createdAt: new Date().toISOString(),
        });
    }

}
