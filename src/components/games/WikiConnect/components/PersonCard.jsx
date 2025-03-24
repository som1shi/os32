import React, { memo } from 'react';

const PersonCard = ({ label, person, startPerson, getWikipediaUrl }) => {
    if (!person) {
        return (
            <div className="person-card">
                <div className="card-label">{label}</div>
                <div className="card-content">
                    <div className="default-image">
                        <span>?</span>
                    </div>
                    <div className="person-info">
                        <div className="person-title">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (label === "Current" && person?.title === startPerson?.title) {
        return (
            <div className="person-card current-card">
                <div className="question-mark-container">
                    <div className="question-mark">?</div>
                </div>
            </div>
        );
    }

    return (
        <div className="person-card">
            <div className="card-label">{label}</div>
            <div className="card-content">
                <div className="person-image">
                    {person?.imageUrl ? (
                        <img src={person.imageUrl} alt={person.title} />
                    ) : (
                        <div className="default-image">
                            <span>{person?.title?.[0] || '?'}</span>
                        </div>
                    )}
                </div>
                <div className="person-info">
                    <div className="person-title">
                        <a
                            href={getWikipediaUrl?.(person?.title)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {person?.title}
                        </a>
                    </div>
                    <div className="person-description">
                        {person?.description}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(PersonCard); 