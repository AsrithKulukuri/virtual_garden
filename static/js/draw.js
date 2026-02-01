// ========== CANVAS DRAWING ========== 
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const clearBtn = document.getElementById('clearBtn');
const plantBtn = document.getElementById('plantBtn');
const brushColor = document.getElementById('brushColor');
const brushSize = document.getElementById('brushSize');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const cosmeticsBtn = document.getElementById('cosmeticsBtn');
const cosmeticsModal = document.getElementById('cosmeticsModal');
const closeCosmeticsBtn = document.getElementById('closeCosmeticsBtn');
const cosmeticsGrid = document.getElementById('cosmeticsGrid');
const creditsEl = document.getElementById('credits');

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let availableCosmetics = [];
let activeDrawCosmetics = JSON.parse(localStorage.getItem('activeDrawCosmetics') || '{}');
let purchasedCosmetics = JSON.parse(localStorage.getItem('purchasedCosmetics') || '[]');
let localSpentCosmetics = JSON.parse(localStorage.getItem('localSpentCosmetics') || '{}');
let serverCredits = 0;
const neonColors = ['#00f5ff', '#39ff14', '#ff2d95', '#ffe600', '#7d5cff', '#ff6b6b'];
let neonIndex = 0;
const cosmeticKeyById = {
    0: 'glow_plant',
    1: 'neon_brush',
    2: 'golden_leaves',
    3: 'rainbow_pot',
    4: 'robot_plant',
    5: 'crystal_stems'
};

// ========== CANVAS SETUP ========== 
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = brushColor.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
    applyActiveDrawCosmetics();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ========== COLOR AND SIZE CONTROLS ========== 
brushColor.addEventListener('change', () => {
    ctx.strokeStyle = brushColor.value;
    if (activeDrawCosmetics.neon_brush) {
        ctx.shadowColor = brushColor.value;
    }
});

brushSize.addEventListener('input', () => {
    ctx.lineWidth = brushSize.value;
});

// ========== LOAD STATS ON PAGE LOAD ========== 
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const token = await getAuthToken();
        if (!token) return;

        const response = await fetch('/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('plantCount').textContent = stats.total_plants;
            document.getElementById('streakCount').textContent = stats.streak;
        }
    } catch (e) {
        console.error('Error loading stats:', e);
    }

    await loadCredits();
    await loadCosmetics();
    applyActiveDrawCosmetics();
});
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// ========== TOUCH EVENTS ========== 
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function handleTouchStart(e) {
    e.preventDefault();
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawLine(lastX, lastY, x, y);
    lastX = x;
    lastY = y;
}

function handleTouchMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    drawLine(lastX, lastY, x, y);
    lastX = x;
    lastY = y;
}

function drawLine(fromX, fromY, toX, toY) {
    applyBrushEffects();
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    if (activeDrawCosmetics.neon_brush) {
        neonIndex = (neonIndex + 1) % neonColors.length;
    }
}

function applyBrushEffects() {
    ctx.lineWidth = brushSize.value;
    if (activeDrawCosmetics.neon_brush) {
        const neonColor = neonColors[neonIndex % neonColors.length];
        ctx.strokeStyle = neonColor;
        brushColor.value = neonColor;
        ctx.shadowBlur = 12;
        ctx.shadowColor = neonColor;
    } else {
        ctx.strokeStyle = brushColor.value;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }
}

function stopDrawing() {
    isDrawing = false;
}

// ========== CREDITS & COSMETICS (DRAW PAGE) ==========
async function loadCredits() {
    if (!creditsEl) return;
    try {
        const token = await getAuthToken();
        if (!token) return;

        const response = await fetch('/credits', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const creditsData = await response.json();
            serverCredits = creditsData.total_credits || 0;
            updateDisplayedCredits();
        }
    } catch (e) {
        console.error('Error loading credits:', e);
    }
}

async function loadCosmetics() {
    if (!cosmeticsGrid) return;
    try {
        const token = await getAuthToken();
        if (!token) return;

        const response = await fetch('/cosmetics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load cosmetics');

        const cosmetics = await response.json();
        const rawCosmetics = Array.isArray(cosmetics) ? cosmetics : (cosmetics.cosmetics || []);
        availableCosmetics = rawCosmetics.map(c => ({
            ...c,
            key: c.key || cosmeticKeyById[c.id]
        }));
        reconcileLocalSpent();
        sanitizeActiveCosmetics();
        displayCosmeticsShop(availableCosmetics);
    } catch (e) {
        console.error('Error loading cosmetics:', e);
        cosmeticsGrid.innerHTML = '<p style="color: #ff6b6b;">Error loading cosmetics</p>';
    }
}

function reconcileLocalSpent() {
    const ownedKeys = new Set(availableCosmetics.filter(c => c.owned).map(c => c.key));
    Object.keys(localSpentCosmetics).forEach(key => {
        if (ownedKeys.has(key)) {
            delete localSpentCosmetics[key];
        }
    });
    localStorage.setItem('localSpentCosmetics', JSON.stringify(localSpentCosmetics));
    updateDisplayedCredits();
}

function sanitizeActiveCosmetics() {
    const ownedKeys = new Set(
        availableCosmetics.filter(c => c.owned).map(c => c.key)
    );
    purchasedCosmetics.forEach(key => ownedKeys.add(key));
    Object.keys(activeDrawCosmetics).forEach(key => {
        if (!ownedKeys.has(key)) {
            delete activeDrawCosmetics[key];
        }
    });
    localStorage.setItem('activeDrawCosmetics', JSON.stringify(activeDrawCosmetics));
}

function updateDisplayedCredits() {
    if (!creditsEl) return;
    const localSpentTotal = Object.values(localSpentCosmetics).reduce((sum, val) => sum + (parseInt(val, 10) || 0), 0);
    const adjusted = Math.max(0, (serverCredits || 0) - localSpentTotal);
    creditsEl.textContent = adjusted;
}

function displayCosmeticsShop(cosmetics) {
    cosmeticsGrid.innerHTML = '';

    cosmetics.forEach(cosmetic => {
        const card = document.createElement('div');
        card.style.cssText = `
            background: rgba(255, 105, 180, 0.1);
            border: 1px solid rgba(255, 105, 180, 0.2);
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        `;

        const isLocallyOwned = purchasedCosmetics.includes(cosmetic.key) || purchasedCosmetics.includes(cosmetic.id);
        const isOwned = cosmetic.owned || isLocallyOwned;
        const isToggle = cosmetic.key === 'neon_brush' || cosmetic.key === 'rainbow_pot';
        const isActive = !!activeDrawCosmetics[cosmetic.key];
        const buttonText = isOwned
            ? (isToggle ? (isActive ? '✓ Active' : 'Use') : '✓ Owned')
            : `Buy - ${cosmetic.price}💰`;
        const buttonDisabled = isOwned && !isToggle ? 'disabled' : '';

        card.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${cosmetic.emoji}</div>
            <h3 style="margin: 0.5rem 0; color: #ff69b4;">${cosmetic.name}</h3>
            <p style="margin: 0 0 1rem 0; color: #a8d5a8; font-size: 0.9rem;">${cosmetic.description}</p>
            <button data-cosmetic-id="${cosmetic.id}" data-cosmetic-key="${cosmetic.key}" ${buttonDisabled} style="
                background: ${isOwned && !isToggle ? '#555' : 'rgba(255, 105, 180, 0.3)'};
                color: ${isOwned && !isToggle ? '#999' : '#ff69b4'};
                border: 1px solid rgba(255, 105, 180, 0.5);
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: ${isOwned && !isToggle ? 'default' : 'pointer'};
                font-weight: bold;
                width: 100%;
                transition: all 0.3s;
            ">${buttonText}</button>
            ${isOwned && !isToggle ? '<p style="margin-top: 0.5rem; color: #aaa; font-size: 0.75rem;">Applies in Garden</p>' : ''}
        `;

        const button = card.querySelector('button');
        if (button && !buttonDisabled) {
            button.addEventListener('click', async () => {
                if (isOwned) {
                    toggleDrawCosmetic(cosmetic.key);
                } else {
                    await purchaseCosmetic(cosmetic.id);
                }
            });
        }

        cosmeticsGrid.appendChild(card);
    });
}

function toggleDrawCosmetic(key) {
    if (!key) return;
    activeDrawCosmetics[key] = !activeDrawCosmetics[key];
    localStorage.setItem('activeDrawCosmetics', JSON.stringify(activeDrawCosmetics));
    if (key === 'neon_brush' && activeDrawCosmetics[key]) {
        neonIndex = 0;
    }
    applyActiveDrawCosmetics();
    displayCosmeticsShop(availableCosmetics);
}

function applyActiveDrawCosmetics() {
    applyBrushEffects();

    if (activeDrawCosmetics.rainbow_pot) {
        document.body.classList.add('rainbow-theme');
    } else {
        document.body.classList.remove('rainbow-theme');
    }
}

async function purchaseCosmetic(cosmeticId) {
    try {
        const token = await getAuthToken();
        const response = await fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cosmetic_id: cosmeticId })
        });

        if (response.status === 402) {
            alert('❌ Not enough credits!');
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            alert(`Error: ${error.error}`);
            return;
        }

        const result = await response.json();
        alert(`✨ Purchased ${result.cosmetic}!\nRemaining: ${result.remaining_credits}💰`);
        const purchasedItem = availableCosmetics.find(c => c.id === cosmeticId);
        if (purchasedItem && purchasedItem.key) {
            if (!purchasedCosmetics.includes(purchasedItem.key)) {
                purchasedCosmetics.push(purchasedItem.key);
            }
            localSpentCosmetics[purchasedItem.key] = purchasedItem.price || 0;
        }
        if (purchasedItem && !purchasedCosmetics.includes(purchasedItem.id)) {
            purchasedCosmetics.push(purchasedItem.id);
        }
        localStorage.setItem('purchasedCosmetics', JSON.stringify(purchasedCosmetics));
        localStorage.setItem('localSpentCosmetics', JSON.stringify(localSpentCosmetics));

        if (purchasedItem && (purchasedItem.key === 'neon_brush' || purchasedItem.key === 'rainbow_pot')) {
            activeDrawCosmetics[purchasedItem.key] = true;
            localStorage.setItem('activeDrawCosmetics', JSON.stringify(activeDrawCosmetics));
            applyActiveDrawCosmetics();
        }

        if (typeof result.remaining_credits !== 'undefined') {
            serverCredits = result.remaining_credits;
        }
        updateDisplayedCredits();

        await loadCredits();
        await loadCosmetics();
    } catch (e) {
        console.error('Error purchasing cosmetic:', e);
        alert('Purchase failed');
    }
}

if (cosmeticsBtn && cosmeticsModal && closeCosmeticsBtn) {
    cosmeticsBtn.addEventListener('click', async () => {
        cosmeticsModal.style.display = 'block';
        await loadCosmetics();
    });

    closeCosmeticsBtn.addEventListener('click', () => {
        cosmeticsModal.style.display = 'none';
    });

    cosmeticsModal.addEventListener('click', (e) => {
        if (e.target === cosmeticsModal) {
            cosmeticsModal.style.display = 'none';
        }
    });
}

// ========== CLEAR BUTTON ========== 
clearBtn.addEventListener('click', () => {
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
});

// ========== PLANT BUTTON & SUBMISSION ========== 
plantBtn.addEventListener('click', async () => {
    const imageData = canvas.toDataURL('image/png');

    loadingSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');

    try {
        // Get auth token
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image: imageData })
        });

        if (response.ok) {
            const plant = await response.json();
            errorMessage.classList.add('hidden');

            // Play plant grow sound
            playGrowSound();

            // Show funny notification
            const funnyMessages = [
                "🎉 Plot twist: Your plant is BEAUTIFUL!",
                "✨ Your imagination is ✨ S P E C I A L ✨",
                "🌿 The garden approves! ✓",
                "🎨 Picasso could never.",
                "💪 Your doodle has POWER!",
                "🚀 Plant + You = ❤️",
                "🌱 A wild plant appeared!",
                "🤔 Is it a plant? Is it art? It's MAGIC!"
            ];
            const randomMsg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
            alert(randomMsg);

            window.location.href = '/garden';
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create plant');
        }

    } catch (error) {
        errorMessage.textContent = '❌ ' + error.message;
        errorMessage.classList.remove('hidden');
    } finally {
        loadingSpinner.classList.add('hidden');
    }
});
function playGrowSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        // Play a rising tone effect
        osc.frequency.setValueAtTime(400, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Silent fail
    }
}