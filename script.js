// Make elements draggable for a more interactive "detective board" feel
const items = document.querySelectorAll('.evidence-item');
let highestZ = 10; // Global counter for z-index stacking

items.forEach(item => {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Set initial z-index
    item.style.zIndex = highestZ;

    item.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);

    function dragStart(e) {
        // Don't drag if clicking on text
        if (e.target.tagName.toLowerCase() === 'p' || e.target.tagName.toLowerCase() === 'h1' || e.target.tagName.toLowerCase() === 'h2') {
            return;
        }

        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === item || item.contains(e.target)) {
            isDragging = true;
            item.classList.add('dragging');
            // Bring to front permanently after drag
            highestZ++;
            item.style.zIndex = highestZ;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        item.classList.remove('dragging');
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, item);
        }
    }

    function setTranslate(xPos, yPos, el) {
        // We update CSS variables instead of the transform property directly.
        // This ensures CSS hover states and original rotation angles are preserved.
        el.style.setProperty('--pos-x', `${xPos}px`);
        el.style.setProperty('--pos-y', `${yPos}px`);
        
        // Update string position when dragging
        updateString();
    }
});

// Dynamic String Logic
const pin1 = document.getElementById('pin-1');
const pin2 = document.getElementById('pin-2');
const dynamicString = document.getElementById('dynamic-string');

function updateString() {
    if (!pin1 || !pin2 || !dynamicString) return;

    // Get exact screen coordinates of the center of both pins
    const rect1 = pin1.getBoundingClientRect();
    const rect2 = pin2.getBoundingClientRect();

    // The visual base of the pin is slightly lower than the div's center
    const cx1 = rect1.left + (rect1.width / 2);
    const cy1 = rect1.top + (rect1.height / 2) + 5;
    
    const cx2 = rect2.left + (rect2.width / 2);
    const cy2 = rect2.top + (rect2.height / 2) + 5;

    // Calculate distance
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // We shorten the line by 15px on each side so it stops at the edge of the pin
    // and doesn't draw *over* the pin head, even though the line's z-index is high.
    const R = 15; 
    
    let x1 = cx1, y1 = cy1, x2 = cx2, y2 = cy2;
    if (dist > R * 2) {
        x1 = cx1 + (dx / dist) * R;
        y1 = cy1 + (dy / dist) * R;
        x2 = cx2 - (dx / dist) * R;
        y2 = cy2 - (dy / dist) * R;
    }

    // Update the SVG line attributes
    dynamicString.setAttribute('x1', x1);
    dynamicString.setAttribute('y1', y1);
    dynamicString.setAttribute('x2', x2);
    dynamicString.setAttribute('y2', y2);
}

// Continuous update loop so the string follows CSS hover animations perfectly
function renderLoop() {
    updateString();
    requestAnimationFrame(renderLoop);
}

// Start the loop
renderLoop();

// Flashlight Effect (Spotlight on cursor)
document.addEventListener('mousemove', (e) => {
    // Set CSS variables with the cursor coordinates
    document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
});
