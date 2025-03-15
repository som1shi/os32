import React from 'react';

const RulesModal = ({ setShowRules }) => {
    return (
        <div className="rules-modal">
            <div className="rules-content">
                <h2>How to Play WikiConnect</h2>
                <p>Connect historical figures through Wikipedia page links in as few steps as possible.</p>
                <ol>
                    <li>You start with a random historical figure</li>
                    <li>Your goal is to reach the target person</li>
                    <li>You can only navigate through people who are linked on the current person's Wikipedia page</li>
                    <li>Type the name of a connected person to add them to your chain</li>
                    <li>Try to reach the target in as few steps as possible</li>
                </ol>
                <button onClick={() => setShowRules(false)}>Close</button>
            </div>
        </div>
    );
};

export default RulesModal; 