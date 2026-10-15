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
            englishText: 'Good morning / Good day',
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
        },
        {
            id: 4,
            polishText: 'Do widzenia',
            englishText: 'Goodbye',
            difficulty: 'beginner',
            category: 'greetings',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'doh vee-DZEH-nyah'
        },
        {
            id: 5,
            polishText: 'Proszę',
            englishText: 'Please / Here you go',
            difficulty: 'beginner',
            category: 'common-phrases',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'PROH-sheh'
        },
        {
            id: 6,
            polishText: 'Przepraszam',
            englishText: 'Sorry / Excuse me',
            difficulty: 'beginner',
            category: 'common-phrases',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'psheh-PRAH-shahm'
        },
        {
            id: 7,
            polishText: 'Tak',
            englishText: 'Yes',
            difficulty: 'beginner',
            category: 'basic-words',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'tahk'
        },
        {
            id: 8,
            polishText: 'Nie',
            englishText: 'No',
            difficulty: 'beginner',
            category: 'basic-words',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'nyeh'
        },
        {
            id: 9,
            polishText: 'Dobranoc',
            englishText: 'Good night',
            difficulty: 'beginner',
            category: 'greetings',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'doh-BRAH-nohts'
        },
        {
            id: 10,
            polishText: 'Jak się masz?',
            englishText: 'How are you?',
            difficulty: 'beginner',
            category: 'conversation',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'yahk shyeh mahsh'
        },
        {
            id: 11,
            polishText: 'Mam na imię',
            englishText: 'My name is',
            difficulty: 'beginner',
            category: 'introductions',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'mahm nah EE-myeh'
        },
        {
            id: 12,
            polishText: 'Skąd jesteś?',
            englishText: 'Where are you from?',
            difficulty: 'intermediate',
            category: 'conversation',
            courses: ['Polish 102'],
            referenceAudio: '',
            phoneticPronunciationText: 'skohnt YES-tesh'
        },
        {
            id: 13,
            polishText: 'Nie rozumiem',
            englishText: "I don't understand",
            difficulty: 'beginner',
            category: 'common-phrases',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'nyeh roh-ZOO-myem'
        },
        {
            id: 14,
            polishText: 'Mówię trochę po polsku',
            englishText: 'I speak a little Polish',
            difficulty: 'intermediate',
            category: 'conversation',
            courses: ['Polish 102'],
            referenceAudio: '',
            phoneticPronunciationText: 'MOO-vyeh TROH-heh poh POHL-skoo'
        },
        {
            id: 15,
            polishText: 'Gdzie jest łazienka?',
            englishText: 'Where is the bathroom?',
            difficulty: 'intermediate',
            category: 'travel',
            courses: ['Polish 102'],
            referenceAudio: '',
            phoneticPronunciationText: 'gdjyeh yest wah-ZYEN-kah'
        },
        {
            id: 16,
            polishText: 'Ile to kosztuje?',
            englishText: 'How much does this cost?',
            difficulty: 'intermediate',
            category: 'shopping',
            courses: ['Polish 102'],
            referenceAudio: '',
            phoneticPronunciationText: 'EE-leh toh kosh-TOO-yeh'
        },
        {
            id: 17,
            polishText: 'Poproszę wodę',
            englishText: 'Water, please',
            difficulty: 'intermediate',
            category: 'food-and-drink',
            courses: ['Polish 102'],
            referenceAudio: '',
            phoneticPronunciationText: 'poh-PROH-sheh VOH-deh'
        },
        {
            id: 18,
            polishText: 'Bardzo dobrze',
            englishText: 'Very good',
            difficulty: 'beginner',
            category: 'common-phrases',
            courses: ['Polish 101'],
            referenceAudio: '',
            phoneticPronunciationText: 'BAR-dzoh DOHB-zheh'
        },
        {
            id: 19,
            polishText: 'Szczęście',
            englishText: 'Happiness / Luck',
            difficulty: 'intermediate',
            category: 'pronunciation-challenges',
            courses: ['Polish 102'],
            referenceAudio: '',
            phoneticPronunciationText: 'SHCHEN-shchyeh'
        },
        {
            id: 20,
            polishText: 'Chrząszcz',
            englishText: 'Beetle',
            difficulty: 'advanced',
            category: 'pronunciation-challenges',
            courses: ['Polish 201'],
            referenceAudio: '',
            phoneticPronunciationText: 'hshonshch'
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