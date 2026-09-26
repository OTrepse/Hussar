import {injectable} from 'inversify';
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

    private readonly practiceItems: PracticeItem[] = [
        {
            id: 1,
            polishText: 'Cześć',
            englishText: 'Hello',
            difficulty: 'beginner',
            category: 'greetings',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'chesh-ch'
        },
        {
            id: 2,
            polishText: 'Dzień dobry',
            englishText: 'Good morning',
            difficulty: 'beginner',
            category: 'greetings',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'jen DOH-bri'
        },
        {
            id: 3,
            polishText: 'Dziękuję',
            englishText: 'Thank you',
            difficulty: 'beginner',
            category: 'common-phrases',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'jen-KOO-yeh'
        }
    ];

    async listPracticeItems(): Promise<PracticeItem[]> {
        return this.practiceItems;
    }

    async getPracticeItem(
        id: number
    ): Promise<PracticeItem | undefined> {
        return this.practiceItems.find(item => item.id === id);
    }
}