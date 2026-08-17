// --- PENGATURAN 3D MODEL ---
// Anda bisa mengubah angka-angka di bawah ini untuk mengatur posisi & ukuran 3D Model:
window.MODEL_CONFIG = {
    scaleSize: 3,         // Makin besar angka, model makin besar (Default: 3)
    positionY: 0.1,       // Naik/Turun. Positif (+) naik mendekati tali, Negatif (-) turun (Default: 0.6)
    positionX: 0,         // Geser Kiri/Kanan. Positif (+) ke Kanan, Negatif (-) ke Kiri (Default: 0)
    positionZ: 0          // Maju/Mundur. Positif (+) Maju mendekat layar, Negatif (-) Mundur (Default: 0)
};
// ---------------------------

// Force scroll to top on page load (Home section)
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Make elements draggable for a more interactive "detective board" feel
const items = document.querySelectorAll('.evidence-item');
let highestZ = 10; // Global counter for z-index stacking

// Paper Sound Effect setup removed
const navPins = document.querySelectorAll('.nav-pin');
const folderTab = document.querySelector('.folder-tab');

navPins.forEach(pin => {
    
    
    // Smooth scroll functionality for all nav buttons
    pin.addEventListener('click', (e) => {
        const targetId = pin.getAttribute('href');
        
        // If it's a real anchor link (starts with #)
        if (targetId.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                if (document.body.classList.contains('diagonal-mode')) {
                    const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
                    let targetScrollY = 0;
                    
                    if (targetId === '#home-section') targetScrollY = 0;
                    else if (targetId === '#project-section') targetScrollY = 0.25 * maxScroll;
                    else if (targetId === '#skill-section') targetScrollY = 0.50 * maxScroll;
                    else if (targetId === '#about-section') targetScrollY = 0.75 * maxScroll;
                    else if (targetId === '#contact-section') targetScrollY = 1.0 * maxScroll;
                    
                    window.scrollTo({
                        top: targetScrollY,
                        behavior: 'smooth'
                    });
                } else {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});

// ScrollSpy: Update active nav pin based on scroll position using IntersectionObserver
const sections = document.querySelectorAll('.evidence-container');
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5 // Trigger when at least 50% of the section is visible
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const activeId = entry.target.id;
            
            // Remove active class from all pins
            navPins.forEach(p => p.classList.remove('active'));
            
            // Add active class to corresponding pin
            const activePin = document.querySelector(`.nav-pin[href="#${activeId}"]`);
            if (activePin) {
                activePin.classList.add('active');
            }
        }
    });
}, observerOptions);

// Observe all sections
sections.forEach(section => {
    if (section.id) {
        observer.observe(section);
    }
});

if (folderTab) {
    
}

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

    // Add sound and bring to front on hover
    item.addEventListener('mouseenter', () => {
        
        
        // Hanya item di luar project-section yang z-index nya permanen naik
        if (!item.closest('#project-section')) {
            highestZ++;
            item.style.zIndex = highestZ;
        }
    });

    // Mouse Events
    item.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);

    function dragStart(e) {
        // Disable dragging on mobile layout
        if (window.innerWidth <= 768) return;
        
        // Disable dragging for portal links
        if (item.classList.contains('portal-link')) return;

        // Don't drag if clicking on text or 3D canvas
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'canvas') {
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
            
            // Play paper grab sound
            

            if (item.id === 'character-1') {
                window.isCharDragging = true;
            }
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
        item.classList.remove('dragging');
        
        if (item.id === 'character-1') {
            window.isCharDragging = false;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault(); // Prevent scrolling while dragging
            
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            // --- ADDED FOR 3D PHYSICS ---
            // Expose velocity to the global window object so 3d-script.js can read it
            if (item.id === 'character-1') {
                window.charDragVelocityX = e.movementX;
                window.charDragVelocityY = e.movementY;
            }
            // -----------------------------

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
// Configuration for all string connections
const connections = [
    { from: 'pin-1', to: 'pin-2' }, // Home section: Document to Green Note
    { from: 'pin-2', to: 'pin-proj-title' }, // Bridge: Green Note to Project Title
    { from: 'pin-proj-title', to: 'pin-folder-game' }, // Project: Title to Game Folder
    { from: 'pin-folder-game', to: 'pin-pg1' }, // Game Folder to Photo 1
    { from: 'pin-folder-game', to: 'pin-pg2' }, // Game Folder to Photo 2
    { from: 'pin-folder-game', to: 'pin-pg3' }, // Game Folder to Photo 3
    { from: 'pin-proj-title', to: 'pin-folder-3d' }, // Project: Title to 3D Folder
    { from: 'pin-folder-3d', to: 'pin-p3d1' }, // 3D Folder to Photo 1
    { from: 'pin-folder-3d', to: 'pin-p3d2' }, // 3D Folder to Photo 2
    { from: 'pin-folder-3d', to: 'pin-p3d3' }, // 3D Folder to Photo 3
    { from: 'pin-proj-title', to: 'pin-char' } // Project: Title to Character
];

const stringSvg = document.getElementById('string-svg');
const svgNS = "http://www.w3.org/2000/svg";

// Initialize SVG lines
const lineElements = [];
connections.forEach(conn => {
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('class', 'red-string');
    stringSvg.appendChild(line);
    lineElements.push({
        lineNode: line,
        pinFrom: document.getElementById(conn.from),
        pinTo: document.getElementById(conn.to)
    });
});

function updateString() {
    lineElements.forEach(connection => {
        const p1 = connection.pinFrom;
        const p2 = connection.pinTo;
        const line = connection.lineNode;
        
        if (!p1 || !p2 || !line) return;

        const rect1 = p1.getBoundingClientRect();
        const rect2 = p2.getBoundingClientRect();

        // Koordinat relatif terhadap .board agar tahan terhadap transform/translasi
        // Cache the board query if not cached, or just query it (we will define it globally)
        const boardRect = window.boardElement ? window.boardElement.getBoundingClientRect() : (window.boardElement = document.querySelector('.board')).getBoundingClientRect();
        const cx1 = rect1.left - boardRect.left + (rect1.width / 2);
        const cy1 = rect1.top - boardRect.top + (rect1.height / 2) + 5;
        const cx2 = rect2.left - boardRect.left + (rect2.width / 2);
        const cy2 = rect2.top - boardRect.top + (rect2.height / 2) + 5;

        // Calculate distance and shorten the line by 12.5px so it stops at the edge of the pin
        const dx = cx2 - cx1;
        const dy = cy2 - cy1;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const R = 12.5; 
        
        let x1 = cx1, y1 = cy1, x2 = cx2, y2 = cy2;
        if (dist > R * 2) {
            x1 = cx1 + (dx / dist) * R;
            y1 = cy1 + (dy / dist) * R;
            x2 = cx2 - (dx / dist) * R;
            y2 = cy2 - (dy / dist) * R;
        }

        // Bulatkan koordinat ke bilangan bulat untuk menghilangkan fluktuasi subpixel secara total.
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        x2 = Math.round(x2);
        y2 = Math.round(y2);

        // Anti-Jitter Threshold
        // Jangan update DOM SVG jika posisinya sama persis
        // Ini mencegah tali terlihat "bergetar" atau terus-menerus sinkronisasi di DevTools.
        if (
            !connection.lastCoords ||
            connection.lastCoords.x1 !== x1 ||
            connection.lastCoords.y1 !== y1 ||
            connection.lastCoords.x2 !== x2 ||
            connection.lastCoords.y2 !== y2
        ) {
            // Apply coordinates directly to SVG line
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            
            // Simpan koordinat terakhir
            connection.lastCoords = { x1, y1, x2, y2 };
        }
    });
}

window.addEventListener('scroll', updateString);
window.addEventListener('resize', updateString);

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

// EXPERIMENT: Diagonal Scrolling
window.addEventListener('wheel', (e) => {
    if (window.innerWidth <= 768) return; // Ignore on mobile
    if (e.deltaY !== 0) {
        e.preventDefault();
        window.scrollBy({
            left: e.deltaY * 0.8, // Scroll right
            top: e.deltaY,      // Scroll down
            behavior: 'auto'
        });
    }
}, { passive: false });

// ========== MOBILE INFINITE CAROUSEL ==========
(function() {
    // We remove the early return so the logic sets up properly even if the user starts on desktop and resizes to mobile.
    
    document.querySelectorAll('.carousel-track').forEach(track => {
        let position = 0;
        const speed = 0.4; // piksel per frame (kecepatan auto-scroll)
        let isDragging = false;
        let startX = 0;
        let dragStartPos = 0;
        let halfWidth = 0;
        
        // Hitung setengah lebar track (= lebar 3 item asli) setelah gambar dimuat
        function calcHalf() {
            halfWidth = track.scrollWidth / 2;
        }
        
        // Hitung saat halaman siap dan saat di-resize
        window.addEventListener('load', calcHalf);
        window.addEventListener('resize', calcHalf);
        // Backup: hitung ulang setelah 2 detik jika gambar lambat
        setTimeout(calcHalf, 2000);
        
        function animate() {
            if (!isDragging && halfWidth > 0) {
                // Game = ke kiri (-1), 3D = ke kanan (+1)
                const direction = track.dataset.carousel === '3d' ? 1 : -1;
                position += (speed * direction);
                
                // Infinite loop: wrap around
                if (position <= -halfWidth) {
                    position += halfWidth;
                } else if (position > 0) {
                    position -= halfWidth;
                }
            }
            track.style.transform = `translateX(${position}px)`;
            requestAnimationFrame(animate);
        }
        
        // Touch Events untuk swipe manual
        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
            dragStartPos = position;
        }, { passive: true });
        
        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const diff = e.touches[0].clientX - startX;
            position = dragStartPos + diff;
            // Wrap around kedua arah
            if (halfWidth > 0) {
                if (position <= -halfWidth) position += halfWidth;
                if (position > 0) position -= halfWidth;
            }
            track.style.transform = `translateX(${position}px)`;
        }, { passive: true });
        
        track.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        // Mulai animasi
        requestAnimationFrame(animate);
    });
})();

// EXPERIMENT: Diagonal Scrolling
function setupDiagonalScroll() {
    if (window.innerWidth > 768) {
        document.body.classList.add('diagonal-mode');
    } else {
        document.body.classList.remove('diagonal-mode');
        document.querySelector('.board').style.transform = '';
    }
}

function handleDiagonalScroll() {
    if (document.body.classList.contains('diagonal-mode')) {
        const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        // Avoid division by zero
        if (maxScroll <= 0) return;
        
        const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
        
        // --- STICKY SCROLL LOGIC ---
        // Creates a "dead zone" around each page where scrolling doesn't move the camera
        function getStickyVal(rawVal, pauseSize) {
            const index = Math.round(rawVal);
            const dist = rawVal - index; // Range: -0.5 to 0.5
            const halfPause = pauseSize / 2;
            
            // If within the pause radius, clamp to the exact page index
            if (Math.abs(dist) <= halfPause) {
                return index;
            }
            
            // Otherwise, smoothly map the remaining distance
            if (dist > 0) {
                const mappedDist = (dist - halfPause) / (0.5 - halfPause);
                return index + mappedDist * 0.5;
            } else {
                const mappedDist = (dist + halfPause) / (0.5 - halfPause);
                return index + mappedDist * 0.5;
            }
        }
        
        const rawIndex = progress * 4; // 0 to 4
        const stickyIndex = getStickyVal(rawIndex, 0.4); // 40% of the scroll space is paused (20% before, 20% after center)
        const stickyProgress = stickyIndex / 4;
        
        let tx = 0;
        let ty = 0;
        
        if (stickyProgress <= 0.25) {
            // First 25% of scroll: Move RIGHT to Project (B1)
            const xProgress = stickyProgress / 0.25;
            tx = -xProgress * window.innerWidth;
            ty = 0;
        } else {
            // Remaining 75% of scroll: Move DIAGONAL DOWN-RIGHT to Skill (C2), About (D3), Contact (E4)
            const diagProgress = (stickyProgress - 0.25) / 0.75;
            tx = -(1 + diagProgress * 3) * window.innerWidth;
            ty = -(diagProgress * 3) * window.innerHeight;
        }
        
        document.querySelector('.board').style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    }
}

window.addEventListener('resize', () => {
    setupDiagonalScroll();
    handleDiagonalScroll();
});

window.addEventListener('scroll', handleDiagonalScroll, { passive: true });

// Initialize immediately
setupDiagonalScroll();
handleDiagonalScroll();
