import {injectable} from 'inversify';
import {Pool} from 'pg';
import {PracticeItem} from '../classes/practice_item.js';

export interface PracticeItemsRepository {
    listPracticeItems(): Promise<PracticeItem[]>;
    getPracticeItem(id: number): Promise<PracticeItem | undefined>;
}

export const PracticeItemsRepository =
    Symbol.for('PracticeItemsRepository');

@injectable()
export class PracticeItemsRepositoryImpl
    implements PracticeItemsRepository {

    private readonly pool: Pool;

    constructor() {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not configured");
        }

        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async listPracticeItems(): Promise<PracticeItem[]> {
        const result = await this.pool.query(`
            SELECT
                pi.id,
                pi.polish_text AS "polishText",
                pi.english_text AS "englishText",
                pi.difficulty,
                pi.category,
                pi.reference_audio AS "referenceAudio",
                pi.phonetic_pronunciation_text AS "phoneticPronunciationText",
                ARRAY(
                    SELECT c.name
                    FROM course_practice_items cpi
                    JOIN courses c ON c.id = cpi.course_id
                    WHERE cpi.practice_item_id = pi.id
                    ORDER BY c.name
                ) AS courses
            FROM practice_items pi
            ORDER BY pi.id
        `);

        return result.rows.map(row => ({
            ...row,
            id: Number(row.id),
            referenceAudio: row.referenceAudio ?? "",
            phoneticPronunciationText: row.phoneticPronunciationText ?? "",
        })) as PracticeItem[];
    }

    async getPracticeItem(
        id: number
    ): Promise<PracticeItem | undefined> {
        const result = await this.pool.query(`
            SELECT
                pi.id,
                pi.polish_text AS "polishText",
                pi.english_text AS "englishText",
                pi.difficulty,
                pi.category,
                pi.reference_audio AS "referenceAudio",
                pi.phonetic_pronunciation_text AS "phoneticPronunciationText",
                ARRAY(
                    SELECT c.name
                    FROM course_practice_items cpi
                    JOIN courses c ON c.id = cpi.course_id
                    WHERE cpi.practice_item_id = pi.id
                    ORDER BY c.name
                ) AS courses
            FROM practice_items pi
            WHERE pi.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return undefined;
        }

        const row = result.rows[0];

        return {
            ...row,
            id: Number(row.id),
            referenceAudio: row.referenceAudio ?? "",
            phoneticPronunciationText: row.phoneticPronunciationText ?? "",
        } as PracticeItem;
    }
}