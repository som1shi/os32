import React from 'react';

const TargetBox = ({ 
    targetSum, 
    successfulSelections, 
    animatingToTarget, 
    selectedNumbers, 
    currentSum, 
    targetBoxRef 
}) => {
    return (
        <div className="target-box-container">
            <div className="target-box" ref={targetBoxRef}>
                <div className="target-label">TARGET: {targetSum}</div>
                <div className="target-sum">
                    {successfulSelections.length > 0 && animatingToTarget && (
                        <div className="number-collection">
                            {successfulSelections.map((value, index) => (
                                <div key={index} className="falling-number">
                                    {value}
                                </div>
                            ))}
                        </div>
                    )}
                    {selectedNumbers.length > 0 && (
                        <div className={`current-sum ${currentSum === targetSum ? 'correct' : currentSum > targetSum ? 'over' : ''}`}>
                            {currentSum}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TargetBox; 