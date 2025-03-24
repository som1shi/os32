import React, { memo, useCallback } from 'react';

const GameInput = ({
    currentPerson,
    userInput,
    suggestions,
    errorMessage,
    loading,
    submittingPerson,
    gameComplete,
    personChain,
    inputRef,
    handleInputChange,
    handleKeyDown,
    handleSelectSuggestion,
    handleFormSubmit,
    goBack
}) => {
    const onSuggestionClick = useCallback((suggestion) => {
        handleSelectSuggestion(suggestion);
    }, [handleSelectSuggestion]);

    const showSuggestions = suggestions.length > 0 && userInput.trim().length > 0;
    
    if (!currentPerson) {
        return (
            <div className="input-section">
                <div className="loading">
                    <p>Loading game data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="input-section">
            <label>Enter a person connected to {currentPerson.title}</label>
            
            <form onSubmit={handleFormSubmit}>
                <div className="input-field">
                    <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a connected person's name..."
                        disabled={submittingPerson || gameComplete}
                        autoComplete="off"
                    />
                    
                    {showSuggestions && (
                        <div className="suggestions">
                            {suggestions.map((suggestion, index) => (
                                <div 
                                    key={`suggestion-${index}-${suggestion}`}
                                    className={`suggestion ${userInput === suggestion ? 'selected' : ''}`}
                                    onClick={() => onSuggestionClick(suggestion)}
                                >
                                    <span className="suggestion-text">{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="button-container">
                    <button 
                        type="submit"
                        className={`submit-button ${submittingPerson ? 'submitting' : ''}`}
                        disabled={!userInput || submittingPerson}
                    >
                        {submittingPerson ? 'Submitting...' : 'Submit Person'}
                    </button>
                    <button 
                        type="button"
                        className="del-button"
                        onClick={goBack}
                        disabled={personChain.length <= 1 || submittingPerson}
                    >
                        ← Back
                    </button>
                </div>
            </form>

            {errorMessage && (
                <div className="error-message">{errorMessage}</div>
            )}
        </div>
    );
};

export default memo(GameInput); 