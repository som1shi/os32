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
                
                const searchWords = normalizedTerm.split(/\s+/).filter(word => word.length > 0);
                if (searchWords.length > 1) {
                    return searchWords.every(word => personName.includes(word));
                }
                
                return false;
            });
            
            const sortedResults = filtered
                .sort((a, b) => {
                    const aLower = a.toLowerCase();
                    const bLower = b.toLowerCase();
                    
                    if (aLower === normalizedTerm) return -1;
                    if (bLower === normalizedTerm) return 1;
                    if (aLower.startsWith(normalizedTerm)) return -1;
                    if (bLower.startsWith(normalizedTerm)) return 1;
                    return aLower.indexOf(normalizedTerm) - bLower.indexOf(normalizedTerm);
                })
                .slice(0, 5);
                
            setSuggestions(sortedResults);
        }, 150), 
        [linkedPeople]
    );
    
    const fetchPersonDetailsWithCache = async (title) => {
        if (peopleCache[title]) return peopleCache[title];
        
        const details = await fetchPersonDetailsWithImage(title);
        setPeopleCache(prev => ({ ...prev, [title]: details }));
        return details;
    };
    
    const fetchLinkedPeopleWithCache = async (title) => {
        const cacheKey = `links_${title}`;
        if (peopleCache[cacheKey]) return peopleCache[cacheKey];
        
        const links = await fetchWikiLinks(title);
        setPeopleCache(prev => ({ ...prev, [cacheKey]: links }));
        return links;
    };
    
    const handleInputChange = (e) => {
        setUserInput(e.target.value);
        setSelectedIndex(-1);
        searchPeople(e.target.value);
    };
    
    const handleSubmitPerson = useCallback(async () => {
        if (!userInput) return;
        
        try {
            setErrorMessage('');
            const normalizedInput = userInput.trim();
            
            if (normalizedInput.toLowerCase() === targetPerson.title.toLowerCase()) {
                handleSuccess(targetPerson);
                return;
            }
            
            const directMatch = linkedPeople.find(
                person => person.toLowerCase() === normalizedInput.toLowerCase()
            );
            
            if (directMatch) {
                const [details, links] = await Promise.all([
                    fetchPersonDetailsWithCache(directMatch),
                    fetchLinkedPeopleWithCache(directMatch)
                ]);
                
                const nextPerson = {
                    title: directMatch,
                    description: details.description,
                    imageUrl: details.imageUrl
                };
                
                setPersonChain(prev => [...prev, nextPerson]);
                setCurrentPerson(nextPerson);
                setLinkedPeople(links);
                setUserInput('');
                setSuggestions([]);
                
                if (nextPerson.title.toLowerCase() === targetPerson.title.toLowerCase()) {
                    handleSuccess(nextPerson);
                }
                
                if (inputRef.current) inputRef.current.focus();
            } else {
                const matches = linkedPeople.filter(person => 
                    person.toLowerCase().includes(normalizedInput.toLowerCase()) ||
                    normalizedInput.toLowerCase().includes(person.toLowerCase())
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
        }
    }, [userInput, linkedPeople, targetPerson, currentPerson, fetchPersonDetailsWithCache, fetchLinkedPeopleWithCache]);
    
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
    
    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => {
                const newIndex = prev < suggestions.length - 1 ? prev + 1 : prev;
                if (newIndex >= 0) {
                    setUserInput(suggestions[newIndex]);
                }
                return newIndex;
            });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => {
                const newIndex = prev > 0 ? prev - 1 : 0;
                setUserInput(suggestions[newIndex]);
                return newIndex;
            });
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[selectedIndex]);
        }
    };
    
    const handleSelectSuggestion = (suggestion) => {
        setUserInput(suggestion);
        setSuggestions([]);
        if (inputRef.current) inputRef.current.focus();
    };
    
    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSubmitPerson();
    };
    
    const handleSuccess = (person) => {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setGameComplete(true);
        setGameActive(false);
    };
    
    const goBack = () => {
        if (personChain.length <= 1) return;
        
        const newChain = [...personChain];
        newChain.pop();
        const previousPerson = newChain[newChain.length - 1];
        
        setPersonChain(newChain);
        setCurrentPerson(previousPerson);
        
        fetchLinkedPeopleWithCache(previousPerson.title)
            .then(links => setLinkedPeople(links))
            .catch(error => console.error("Error fetching links for previous person:", error));
    };
    
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
    
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
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
        fetchLinkedPeople: fetchWikiLinks,
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