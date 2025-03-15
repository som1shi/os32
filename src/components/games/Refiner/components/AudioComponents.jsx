import React from 'react';

const AudioComponents = ({ 
    audioRef, 
    correctSoundRef, 
    completeGameSoundRef, 
    hintRevealSoundRef, 
    wrongSoundRef 
}) => {
    return (
        <>
            <audio ref={audioRef} loop />
            <audio ref={correctSoundRef} />
            <audio ref={completeGameSoundRef} />
            <audio ref={hintRevealSoundRef} />
            <audio ref={wrongSoundRef} />
        </>
    );
};

export default AudioComponents; 