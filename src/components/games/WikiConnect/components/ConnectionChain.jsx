import React from 'react';

const ConnectionChain = ({ personChain }) => {
    return (
        <div className="word-chain-section">
            <h3>Your Connection Chain</h3>
            <div className="word-chain">
                {personChain.map((person, index) => (
                    <React.Fragment key={index}>
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

export default ConnectionChain; 