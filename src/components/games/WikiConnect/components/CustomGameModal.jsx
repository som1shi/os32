import React from 'react';

const CustomGameModal = ({
    customStart,
    customTarget,
    customError,
    customLoading,
    setCustomStart,
    setCustomTarget,
    setShowCustomSetup,
    startCustomGame,
    validateWikipediaTitle
}) => {
    const handleStartChange = (e) => {
        setCustomStart(e.target.value);
    };

    const handleTargetChange = (e) => {
        setCustomTarget(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await startCustomGame();
        } catch (error) {
            console.error("Error starting custom game:", error);
        }
    };

    return (
        <div className="rules-modal">
            <div className="custom-game-content">
                <h2>Create Custom Game</h2>
                <p>Enter the names of two Wikipedia articles about people:</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="custom-game-inputs">
                        <div className="custom-input-group">
                            <label>Starting Person:</label>
                            <input 
                                type="text" 
                                value={customStart || ''}
                                onChange={handleStartChange}
                                placeholder="e.g. Albert Einstein"
                                disabled={customLoading}
                            />
                        </div>
                        
                        <div className="custom-input-group">
                            <label>Target Person:</label>
                            <input 
                                type="text" 
                                value={customTarget || ''}
                                onChange={handleTargetChange}
                                placeholder="e.g. Marie Curie"
                                disabled={customLoading}
                            />
                        </div>
                    </div>
                    
                    {customError && (
                        <div className="custom-error">{customError}</div>
                    )}
                    
                    <div className="custom-game-buttons">
                        <button 
                            type="button" 
                            onClick={() => setShowCustomSetup(false)}
                            disabled={customLoading}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!customStart || !customTarget || customLoading}
                        >
                            {customLoading ? "Loading..." : "Start Game"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomGameModal; 