const BASE_URL = 'https://api.datamuse.com/words';

export const findSimilarWords = async (targetWord) => {
    try {
        const response = await fetch(`${BASE_URL}?ml=${targetWord}&max=15`);
        const results = await response.json();
        
        if (!results || results.length === 0) return null;
        results.sort((a, b) => a.score - b.score);

        return {
            level1: results.slice(0, 3).map(word => word.word.toUpperCase()),
            level2: results.slice(6, 9).map(word => word.word.toUpperCase()),
            level3: results.slice(-3).map(word => word.word.toUpperCase()),
        };
    } catch (error) {
        console.error('Error finding similar words:', error);
        return null;
    }
};

export const getRandomWord = async () => {
    try {
        const response = await fetch(`${BASE_URL}?sp=*&max=1000&md=f&freq=30`);
        const words = await response.json();
        return words[Math.floor(Math.random() * words.length)].word.toUpperCase();
    } catch (error) {
        console.error('Error getting random word:', error);
        return 'ERROR';
    }
};

export const hasWord = async (word) => {
    try {
        const response = await fetch(`${BASE_URL}?sp=${word.toLowerCase()}&max=1`);
        const results = await response.json();
        return results.length > 0;
    } catch {
        return false;
    }
}; 