import React from 'react';

const GameInput = ({
    currentPerson,
    userInput,
    suggestions,
    errorMessage,
    loading,
    gameComplete,
    personChain,
    inputRef,
    handleInputChange,
    handleKeyDown,
    handleSelectSuggestion,
    handleFormSubmit,
    goBack
}) => {
    return (
        <div className="input-section">
            <label>Enter a person connected to {currentPerson?.title}</label>
            
            <form onSubmit={handleFormSubmit}>
                <div className="input-field">
                    <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a connected person's name..."
                        disabled={loading || gameComplete}
                    />
                    
                    {suggestions.length > 0 && (
                        <div className="suggestions">
                            {suggestions.map((suggestion, index) => (
                                <div 
                                    key={index}
                                    className={`suggestion ${userInput === suggestion ? 'selected' : ''}`}
                                    onClick={() => handleSelectSuggestion(suggestion)}
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
                        className="submit-button"
                        disabled={!userInput || loading}
                    >
                        Submit Person
                    </button>
                    <button 
                        type="button"
                        className="del-button"
                        onClick={goBack}
                        disabled={personChain.length <= 1 || loading}
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

export default GameInput; 