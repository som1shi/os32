import React from 'react';
import './DOSEmulator.css';

const DOSEmulator = () => (
    <div className="dosemu-content">
        <iframe
            src="/dosbox.html"
            title="DOSBox Emulator"
            className="dosemu-iframe"
            allow="autoplay; fullscreen; pointer-lock"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        />
    </div>
);

export default DOSEmulator;
