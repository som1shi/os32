import React, { memo, useEffect, useState } from 'react';

const GridCell = memo(({ number, scaryCells }) => {
    return (
        <div
            key={number.id}
            data-id={number.id}
            className={`
                grid-cell 
                ${number.selected ? 'selected' : ''} 
                ${number.animating ? 'animating' : ''} 
                ${scaryCells.includes(number.id) ? 'scary' : ''}
            `}
            onSelectStart={(e) => e.preventDefault()}
            style={{ userSelect: 'none', touchAction: 'none' }}
        >
            {number.value}
        </div>
    );
});

const GameBoard = ({ 
    numbers, 
    scaryCells, 
    selectionBox, 
    gridRef, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp 
}) => {
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);
    
    return (
        <div 
            className={`numbers-grid ${isMobile ? 'mobile-grid' : ''}`}
            ref={gridRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onTouchCancel={handleMouseUp}
            onSelectStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {numbers.map(number => (
                <GridCell 
                    key={number.id}
                    number={number}
                    scaryCells={scaryCells}
                />
            ))}
            
            {selectionBox && (
                <div 
                    className="selection-box"
                    style={{
                        left: `${selectionBox.left}px`,
                        top: `${selectionBox.top}px`,
                        width: `${selectionBox.width}px`,
                        height: `${selectionBox.height}px`
                    }}
                />
            )}
        </div>
    );
};

export default memo(GameBoard); 