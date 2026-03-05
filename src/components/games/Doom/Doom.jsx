import React from 'react';
import './Doom.css';

const Doom = () => (
    <div className="doom-content">
        <iframe
            src="/doom.html"
            title="Doom"
            className="doom-iframe"
            allow="autoplay; fullscreen; pointer-lock"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        />
    </div>
);

export default Doom;
