import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useWikipediaSearch from './useWikipediaSearch';

const useGameState = () => {
    const [startPerson, setStartPerson] = useState(null);
    const [targetPerson, setTargetPerson] = useState(null);
    const [currentPerson, setCurrentPerson] = useState(null);
    const [personChain, setPersonChain] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gameActive, setGameActive] = useState(false);
    const [gameComplete, setGameComplete] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [seconds, setSeconds] = useState(0);
    const [showRules, setShowRules] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [linkedPeople, setLinkedPeople] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [peopleCache, setPeopleCache] = useState({});
    const [showCustomSetup, setShowCustomSetup] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customTarget, setCustomTarget] = useState('');
    const [customError, setCustomError] = useState('');
    const [customLoading, setCustomLoading] = useState(false);
    const [submittingPerson, setSubmittingPerson] = useState(false);
    
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const initializedRef = useRef(false);
    
    const { 
        debounce, 
        fetchLinkedPeople: fetchWikiLinks, 
        fetchPersonDetailsWithImage, 
        validateWikipediaTitle,
        getWikipediaUrl
    } = useWikipediaSearch();
    
    const searchPeople = useMemo(() => 
        debounce((searchTerm) => {
            if (!searchTerm || searchTerm.length < 2 || !linkedPeople?.length) {
                setSuggestions([]);
                return;
            }
            
            const normalizedTerm = searchTerm.toLowerCase().trim();
            const filtered = linkedPeople.filter(person => {
                if (!person) return false;
                const personName = person.toLowerCase();
                
                if (personName.includes(normalizedTerm)) return true;
                
                return false;
            });
            
            filtered.sort((a, b) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                const aExact = aLower === normalizedTerm;
                const bExact = bLower === normalizedTerm;
                
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
                
                const aStarts = aLower.startsWith(normalizedTerm);
                const bStarts = bLower.startsWith(normalizedTerm);
                
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                
                return 0;
            });
            
            setSuggestions(filtered.slice(0, 5));
        }, 300), 
    [linkedPeople]);
    
    const fetchPersonDetailsWithCache = useCallback(async (title) => {
        if (!title) return null;
        
        if (peopleCache[title]?.details) {
            return peopleCache[title].details;
        }
        
        const details = await fetchPersonDetailsWithImage(title);
        
        setPeopleCache(prev => ({
            ...prev,
            [title]: {
                ...prev[title],
                details
            }
        }));
        
        return details;
    }, [fetchPersonDetailsWithImage, peopleCache]);
    
    const fetchLinkedPeopleWithCache = useCallback(async (title) => {
        if (!title) return [];
        
        if (peopleCache[title]?.links) {
            return peopleCache[title].links;
        }
        
        const links = await fetchWikiLinks(title);
        
        setPeopleCache(prev => ({
            ...prev,
            [title]: {
                ...prev[title],
                links
            }
        }));
        
        return links;
    }, [fetchWikiLinks, peopleCache]);
    
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        setUserInput(value);
        setErrorMessage('');
        setSelectedIndex(-1);
        
        if (value && value.length >= 2 && linkedPeople.length > 0) {
            searchPeople(value);
        } else {
            setSuggestions([]);
        }
    }, [linkedPeople, searchPeople]);
    
    const handleSubmitPerson = useCallback(async (personName) => {
        if (!personName || submittingPerson) return;
        
        setErrorMessage('');
        
        try {
            if (!currentPerson) {
                setErrorMessage("Game is still initializing. Please try again.");
                return;
            }
            
            const normalizedInput = personName.trim();
            
            const directMatch = linkedPeople.find(
                person => person && person.toLowerCase() === normalizedInput.toLowerCase()
            );
            
            if (directMatch) {
                setSubmittingPerson(true);
                
                try {
                    const details = await fetchPersonDetailsWithCache(directMatch);
                    
                    if (!details) {
                        setErrorMessage(`Could not find information about ${directMatch}`);
                        setSubmittingPerson(false);
                        return;
                    }
                    
                    const nextPerson = {
                        title: directMatch,
                        description: details.description,
                        imageUrl: details.imageUrl
                    };
                    
                    const isTargetReached = nextPerson.title.toLowerCase() === targetPerson?.title?.toLowerCase();
                    
                    if (isTargetReached) {
                        setPersonChain(prev => [...prev, nextPerson]);
                        setCurrentPerson(nextPerson);
                        setGameComplete(true);
                        setGameActive(false);
                        
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                            timerRef.current = null;
                        }
                        
                        setUserInput('');
                        setSubmittingPerson(false);
                        return;
                    }
                    
                    const linksPromise = fetchLinkedPeopleWithCache(directMatch);
                    
                    setPersonChain(prev => [...prev, nextPerson]);
                    setCurrentPerson(nextPerson);
                    setUserInput('');
                    setSuggestions([]);
                    
                    const links = await linksPromise;
                    setLinkedPeople(links);
                    
                    if (inputRef.current) inputRef.current.focus();
                } catch (error) {
                    console.error("Error processing person:", error);
                    setErrorMessage("An error occurred. Please try again.");
                } finally {
                    setSubmittingPerson(false);
                }
            } else {
                const matches = linkedPeople.filter(person => 
                    person && person.toLowerCase().includes(normalizedInput.toLowerCase())
                );
                
                if (matches.length > 0) {
                    setErrorMessage(`Did you mean: ${matches.slice(0, 3).join(', ')}...?`);
                } else {
                    setErrorMessage(`"${normalizedInput}" isn't on ${currentPerson.title}'s Wikipedia page.`);
                }
            }
        } catch (error) {
            console.error("Error submitting person:", error);
            setErrorMessage("An error occurred. Please try again.");
            setSubmittingPerson(false);
        }
    }, [currentPerson, fetchLinkedPeopleWithCache, fetchPersonDetailsWithCache, linkedPeople, targetPerson, submittingPerson]);
    
    const fetchRandomPerson = async () => {
        try {
            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?action=query&list=random&rnnamespace=0&format=json&origin=*&rnlimit=20`
            );
            const data = await response.json();
            
            if (!data.query?.random?.length) {
                throw new Error("No random articles returned");
            }
            
            for (const article of data.query.random) {
                const title = article.title;
                
                if (
                    title.includes("(disambiguation)") ||
                    title.includes("List of") ||
                    title.startsWith("Timeline") ||
                    title.includes("Index of") ||
                    title.includes("Category:") ||
                    title.includes("Template:") ||
                    title.includes("Wikipedia:") ||
                    title.includes("Portal:") ||
                    title.includes("File:")
                ) {
                    continue;
                }
                
                const categoryResponse = await fetch(
                    `https://en.wikipedia.org/w/api.php?action=query&prop=categories&titles=${encodeURIComponent(title)}&format=json&origin=*&cllimit=20`
                );
                const categoryData = await categoryResponse.json();
                
                if (!categoryData.query?.pages) continue;
                
                const pages = categoryData.query.pages;
                const pageId = Object.keys(pages)[0];
                
                if (pageId < 0) continue;
                
                const categories = pages[pageId].categories || [];
                
                const isPersonArticle = categories.some(category => {
                    const categoryName = category.title.toLowerCase();
                    return (
                        categoryName.includes("birth") ||
                        categoryName.includes("death") ||
                        categoryName.includes("people") ||
                        categoryName.includes("person") ||
                        categoryName.includes("biography") ||
                        categoryName.includes("living") ||
                        categoryName.includes("born") ||
                        categoryName.includes("human") ||
                        categoryName.includes("actor") ||
                        categoryName.includes("actress") ||
                        categoryName.includes("politician") ||
                        categoryName.includes("musician") ||
                        categoryName.includes("writer") ||
                        categoryName.includes("athlete") ||
                        categoryName.includes("scientist")
                    );
                });
                
                if (isPersonArticle) {
                    return title;
                }
            }
            
            return fetchRandomPerson();
        } catch (error) {
            console.error("Error fetching random person:", error);
            throw error;
        }
    };
    
    const fetchRandomPeoplePair = async () => {
        try {
            const firstPerson = await fetchRandomPerson();
            let secondPerson;
            
            do {
                secondPerson = await fetchRandomPerson();
            } while (firstPerson === secondPerson);
            
            return fetchRandomPeoplePairDetails(firstPerson, secondPerson);
        } catch (error) {
            console.error("Error fetching random people pair:", error);
            throw new Error("Failed to fetch people data");
        }
    };
    
    const fetchRandomPeoplePairDetails = async (firstPerson, secondPerson) => {
        try {
            const [firstDetails, firstLinks, secondDetails] = await Promise.all([
                fetchPersonDetailsWithImage(firstPerson),
                fetchWikiLinks(firstPerson),
                fetchPersonDetailsWithImage(secondPerson)
            ]);
            
            const start = {
                title: firstPerson,
                description: firstDetails.description,
                imageUrl: firstDetails.imageUrl
            };
            
            const target = {
                title: secondPerson,
                description: secondDetails.description,
                imageUrl: secondDetails.imageUrl
            };
            
            return { start, target, links: firstLinks };
        } catch (error) {
            console.error("Error fetching people details:", error);
            throw new Error("Failed to fetch people details");
        }
    };
    
    const startGame = async () => {
        
        setLoading(true);
        setGameComplete(false);
        setUserInput('');
        setSuggestions([]);
        setErrorMessage('');
        
        try {
            const { start, target, links } = await fetchRandomPeoplePair();
            
            setStartPerson(start);
            setTargetPerson(target);
            setCurrentPerson(start);
            setPersonChain([start]);
            setLinkedPeople(links);
            
            setSeconds(0);
            setGameActive(true);
            
            if (inputRef.current) inputRef.current.focus();
        } catch (error) {
            console.error("Error starting game:", error);
            setErrorMessage("Failed to start game. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const startCustomGame = async () => {
        if (!customStart || !customTarget) {
            setCustomError("Please enter both starting and target people");
            return;
        }
        
        setCustomLoading(true);
        setCustomError('');
        
        try {
            const [startExists, targetExists] = await Promise.all([
                validateWikipediaTitle(customStart),
                validateWikipediaTitle(customTarget)
            ]);
            
            if (!startExists) {
                setCustomError(`"${customStart}" does not exist on Wikipedia`);
                setCustomLoading(false);
                return;
            }
            
            if (!targetExists) {
                setCustomError(`"${customTarget}" does not exist on Wikipedia`);
                setCustomLoading(false);
                return;
            }
            
            const [startDetails, startLinks, targetDetails] = await Promise.all([
                fetchPersonDetailsWithImage(customStart),
                fetchWikiLinks(customStart),
                fetchPersonDetailsWithImage(customTarget)
            ]);
            
            const start = {
                title: customStart,
                description: startDetails.description,
                imageUrl: startDetails.imageUrl
            };
            
            const target = {
                title: customTarget,
                description: targetDetails.description,
                imageUrl: targetDetails.imageUrl
            };
            
            setStartPerson(start);
            setTargetPerson(target);
            setCurrentPerson(start);
            setPersonChain([start]);
            setLinkedPeople(startLinks);
            setLoading(false);
            setGameComplete(false);
            setUserInput('');
            setSuggestions([]);
            setErrorMessage('');
            setSeconds(0);
            setGameActive(true);
            setShowCustomSetup(false);
            
            if (inputRef.current) inputRef.current.focus();
        } catch (error) {
            console.error("Error starting custom game:", error);
            setCustomError("An error occurred. Please try again.");
        } finally {
            setCustomLoading(false);
        }
    };
    
    const handleKeyDown = useCallback((e) => {
        if (suggestions.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
            setUserInput(suggestions[(selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : 0)]);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
            setUserInput(suggestions[(selectedIndex > 0 ? selectedIndex - 1 : suggestions.length - 1)]);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            setSuggestions([]);
            setSelectedIndex(-1);
        }
    }, [selectedIndex, suggestions]);
    
    const handleSelectSuggestion = useCallback((suggestion) => {
        setUserInput(suggestion);
        setSuggestions([]);
        setSelectedIndex(-1);
    }, []);
    
    const handleFormSubmit = useCallback((e) => {
        e.preventDefault();
        handleSubmitPerson(userInput);
    }, [userInput]);
    
    const handleSuccess = (person) => {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setGameComplete(true);
        setGameActive(false);
    };
    
    const goBack = useCallback(() => {
        if (personChain.length <= 1 || loading) return;
        
        const newChain = [...personChain];
        newChain.pop();
        
        const previousPerson = newChain[newChain.length - 1];
        setCurrentPerson(previousPerson);
        setPersonChain(newChain);
        
        setUserInput('');
        setErrorMessage('');
        
        (async () => {
            setLoading(true);
            try {
                const links = await fetchLinkedPeopleWithCache(previousPerson.title);
                setLinkedPeople(links);
            } catch (error) {
                console.error("Error fetching linked people:", error);
                setErrorMessage("Failed to load connections.");
            } finally {
                setLoading(false);
            }
        })();
    }, [fetchLinkedPeopleWithCache, loading, personChain]);
    
    const shareScore = () => {
        const message = `I connected ${startPerson?.title} to ${targetPerson?.title} in ${personChain.length - 1} steps and ${formatTime(seconds)}! Play WikiConnect!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'WikiConnect Score',
                text: message,
                url: window.location.href
            }).catch(err => {
                console.error('Share failed:', err);
                copyToClipboard(message);
            });
        } else {
            copyToClipboard(message);
        }
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('Score copied to clipboard!');
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    };
    
    const formatTime = useCallback((totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);
    
    useEffect(() => {
        if (gameActive && !gameComplete) {
            timerRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        }
        
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [gameActive, gameComplete]);
    
    useEffect(() => {
        if (!initializedRef.current) {
            initializedRef.current = true;
            startGame();
        }
        
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);
    
    return {
        startPerson,
        targetPerson,
        currentPerson,
        personChain,
        loading,
        gameActive,
        gameComplete,
        userInput,
        seconds,
        showRules,
        errorMessage,
        linkedPeople,
        suggestions,
        selectedIndex,
        peopleCache,
        showCustomSetup,
        customStart,
        customTarget,
        customError,
        customLoading,
        timerRef,
        inputRef,
        searchPeople,
        fetchLinkedPeople: fetchLinkedPeopleWithCache,
        fetchPersonDetailsWithImage,
        fetchPersonDetailsWithCache,
        fetchLinkedPeopleWithCache,
        handleInputChange,
        handleSubmitPerson,
        fetchRandomPeoplePair,
        startGame,
        handleKeyDown,
        handleSelectSuggestion,
        handleSuccess,
        goBack,
        shareScore,
        formatTime,
        handleFormSubmit,
        getWikipediaUrl,
        validateWikipediaTitle,
        startCustomGame,
        setShowRules,
        setShowCustomSetup,
        setCustomStart,
        setCustomTarget
    };
};

export default useGameState; 