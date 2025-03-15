import { useMemo } from 'react';

const useWikipediaSearch = () => {
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const fetchLinkedPeople = async (title) => {
        try {
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=links&format=json&origin=*`
            );
            const data = await response.json();
            
            if (!data.parse?.links) return [];
            
            const allLinks = data.parse.links
                .filter(link => link.ns === 0)
                .map(link => link['*'])
                .filter(link => (
                    !link.includes("(disambiguation)") &&
                    !link.includes("List of") &&
                    !link.startsWith("Timeline") &&
                    !link.includes("Index of") &&
                    !link.includes("Category:") &&
                    link !== title
                ));

            return allLinks;
        } catch (error) {
            console.error("Error fetching links:", error);
            return [];
        }
    };
    
    const fetchPersonDetailsWithImage = async (title) => {
        try {
            const [extractRes, imageRes] = await Promise.all([
                fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(title)}&format=json&origin=*`),
                fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=400&format=json&origin=*`)
            ]);
            
            const extractData = await extractRes.json();
            const imageData = await imageRes.json();
            
            const pages = extractData.query.pages;
            const pageId = Object.keys(pages)[0];
            
            if (pageId < 0) {
                return { description: "Unknown person", imageUrl: null };
            }
            
            const extract = pages[pageId].extract || "";
            
            let description;
            if (extract.includes('.')) {
                description = extract.split('.')[0] + '.';
            } else {
                description = extract.substring(0, Math.min(100, extract.length));
                if (description.length === 100) description += '...';
            }
            
            let imageUrl = null;
            if (imageData.query?.pages?.[pageId]?.thumbnail?.source) {
                imageUrl = imageData.query.pages[pageId].thumbnail.source;
            }
            
            return { description, imageUrl };
        } catch (error) {
            console.error(`Error fetching details for ${title}:`, error);
            return { description: "Notable figure", imageUrl: null };
        }
    };
    
    const validateWikipediaTitle = async (title) => {
        try {
            if (!title || !title.trim()) return false;
            
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&format=json&origin=*`
            );
            const data = await response.json();
            
            if (!data.query || !data.query.pages) return false;
            
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            
            return parseInt(pageId) > 0;
        } catch (error) {
            console.error("Error validating title:", error);
            return false;
        }
    };
    
    const getWikipediaUrl = (title) => {
        if (!title) return "#";
        return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    };

    return {
        debounce,
        fetchLinkedPeople,
        fetchPersonDetailsWithImage,
        validateWikipediaTitle,
        getWikipediaUrl
    };
};

export default useWikipediaSearch; 