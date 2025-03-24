import React, { memo } from 'react';

const ConnectionChain = ({ personChain }) => {
    if (!personChain || personChain.length === 0) {
        return (
            <div className="word-chain-section">
                <h3>Your Connection Chain</h3>
                <div className="word-chain">
                    <div className="chain-word">Start a connection</div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="word-chain-section">
            <h3>Your Connection Chain</h3>
            <div className="word-chain">
                {personChain.map((person, index) => (
                    <React.Fragment key={`${person.title}-${index}`}>
                        <div className="chain-word">
                            {person.title}
                        </div>
                        {index < personChain.length - 1 && (
                            <div className="chain-arrow">→</div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default memo(ConnectionChain); 