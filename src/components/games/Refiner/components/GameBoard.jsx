import React from 'react';

const GameBoard = ({ 
    numbers, 
    scaryCells, 
    selectionBox, 
    gridRef, 
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp 
}) => {
    return (
        <div 
            className="numbers-grid" 
            ref={gridRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onSelectStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {numbers.map(number => (
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
                    style={{ userSelect: 'none' }}
                >
                    {number.value}
                </div>
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

export default GameBoard; 