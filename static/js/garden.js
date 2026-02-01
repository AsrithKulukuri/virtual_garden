// ========== GARDEN PAGE ========== 
const gardenGrid = document.getElementById('gardenGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const emptyState = document.getElementById('emptyState');
const errorMessage = document.getElementById('errorMessage');
const themeSelector = document.getElementById('themeSelector');
const sortBtn = document.getElementById('sortBtn');
const challengeBtn = document.getElementById('challengeBtn');
const challengesPanel = document.getElementById('challengesPanel');
const challengesList = document.getElementById('challengesList');
const cosmeticsBtn = document.getElementById('cosmeticsBtn');
const cosmeticsModal = document.getElementById('cosmeticsModal');
const closeCosmeticsBtn = document.getElementById('closeCosmeticsBtn');
const cosmeticsGrid = document.getElementById('cosmeticsGrid');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const minigamesBtn = document.getElementById('minigamesBtn');
const minigamesModal = document.getElementById('minigamesModal');
const closeMinigamesBtn = document.getElementById('closeMinigamesBtn');
const minigamesMenuPanel = document.getElementById('minigamesMenuPanel');
const speedDrawPanel = document.getElementById('speedDrawPanel');
const startSpeedDrawBtn = document.getElementById('startSpeedDrawBtn');
const cancelSpeedDrawBtn = document.getElementById('cancelSpeedDrawBtn');
const speedDrawTimer = document.getElementById('speedDrawTimer');
const speedDrawCounter = document.getElementById('speedDrawCounter');
const colorMatchPanel = document.getElementById('colorMatchPanel');
const colorMatchDisplay = document.getElementById('colorMatchDisplay');
const colorMatchLevelDisplay = document.getElementById('colorMatchLevel');
const colorMatchScoreDisplay = document.getElementById('colorMatchScore');
const startColorMatchBtn = document.getElementById('startColorMatchBtn');
const colorMatchStartBtn = document.getElementById('colorMatchStartBtn');
const cancelColorMatchBtn = document.getElementById('cancelColorMatchBtn');
const heightChallengePanel = document.getElementById('heightChallengePanel');
const heightBar = document.getElementById('heightBar');
const currentHeightDisplay = document.getElementById('currentHeight');
const startHeightChallengeBtn = document.getElementById('startHeightChallengeBtn');
const cancelHeightChallengeBtn = document.getElementById('cancelHeightChallengeBtn');

let currentPlants = [];
let isSortedByHeight = false;
let currentCredits = 0;
let userCosmetics = {};
let cosmeticsCache = [];
let purchasedCosmetics = JSON.parse(localStorage.getItem('purchasedCosmetics') || '[]');
let localSpentCosmetics = JSON.parse(localStorage.getItem('localSpentCosmetics') || '{}');
let speedDrawActive = false;
let speedDrawCount = 0;
let speedDrawInterval = null;
let colorMatchActive = false;
let colorMatchSequence = [];
let playerSequence = [];
let colorMatchLevel = 1;
let colorMatchScore = 0;
let heightChallengeActive = false;

// ========== THEME SELECTOR ========== 
if (themeSelector) {
    themeSelector.addEventListener('change', (e) => {
        document.querySelector('.garden-page').className = `garden-page theme-${e.target.value}`;
        localStorage.setItem('gardenTheme', e.target.value);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('gardenTheme') || 'default';
    themeSelector.value = savedTheme;
    if (savedTheme !== 'default') {
        document.querySelector('.garden-page').classList.add(`theme-${savedTheme}`);
    }
}

// ========== SORT BUTTON ========== 
if (sortBtn) {
    sortBtn.addEventListener('click', () => {
        isSortedByHeight = !isSortedByHeight;
        const sorted = [...currentPlants].sort((a, b) => {
            return isSortedByHeight ? b.height - a.height : currentPlants.indexOf(a) - currentPlants.indexOf(b);
        });
        gardenGrid.innerHTML = '';
        sorted.forEach(plant => {
            gardenGrid.appendChild(createPlantCard(plant));
        });
        sortBtn.textContent = isSortedByHeight ? '📊 Sort by Date' : '📊 Sort by Height';
    });
}

// ========== COSMETICS SHOP ========== 
if (cosmeticsBtn) {
    cosmeticsBtn.addEventListener('click', () => {
        cosmeticsModal.style.display = 'block';
        loadCosmetics();
    });
}

if (closeCosmeticsBtn) {
    closeCosmeticsBtn.addEventListener('click', () => {
        cosmeticsModal.style.display = 'none';
    });
}

// Close modal when clicking outside
cosmeticsModal.addEventListener('click', (e) => {
    if (e.target === cosmeticsModal) {
        cosmeticsModal.style.display = 'none';
    }
});

// ========== LEADERBOARD ========== 
if (leaderboardBtn) {
    leaderboardBtn.addEventListener('click', () => {
        leaderboardModal.style.display = 'block';
        loadLeaderboard();
    });
}

if (closeLeaderboardBtn) {
    closeLeaderboardBtn.addEventListener('click', () => {
        leaderboardModal.style.display = 'none';
    });
}

// Close modal when clicking outside
leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
        leaderboardModal.style.display = 'none';
    }
});

// ========== MINI-GAMES ========== 
if (minigamesBtn) {
    minigamesBtn.addEventListener('click', () => {
        minigamesModal.style.display = 'block';
        minigamesMenuPanel.style.display = 'block';
        speedDrawPanel.style.display = 'none';
    });
}

if (closeMinigamesBtn) {
    closeMinigamesBtn.addEventListener('click', () => {
        minigamesModal.style.display = 'none';
        stopSpeedDraw();
    });
}

// Close modal when clicking outside
minigamesModal.addEventListener('click', (e) => {
    if (e.target === minigamesModal) {
        minigamesModal.style.display = 'none';
        stopSpeedDraw();
    }
});

if (startSpeedDrawBtn) {
    startSpeedDrawBtn.addEventListener('click', () => {
        startSpeedDraw();
    });
}

if (cancelSpeedDrawBtn) {
    cancelSpeedDrawBtn.addEventListener('click', () => {
        stopSpeedDraw();
        minigamesMenuPanel.style.display = 'block';
        speedDrawPanel.style.display = 'none';
    });
}

// Color Match buttons
if (startColorMatchBtn) {
    startColorMatchBtn.addEventListener('click', () => {
        minigamesMenuPanel.style.display = 'none';
        colorMatchPanel.style.display = 'block';
    });
}

if (cancelColorMatchBtn) {
    cancelColorMatchBtn.addEventListener('click', () => {
        stopColorMatch();
        minigamesMenuPanel.style.display = 'block';
        colorMatchPanel.style.display = 'none';
    });
}

if (colorMatchStartBtn) {
    colorMatchStartBtn.addEventListener('click', () => {
        startColorMatch();
    });
}

if (cancelHeightChallengeBtn) {
    cancelHeightChallengeBtn.addEventListener('click', () => {
        heightChallengeActive = false;
        minigamesMenuPanel.style.display = 'block';
        heightChallengePanel.style.display = 'none';
    });
}

// Height Challenge button
if (startHeightChallengeBtn) {
    startHeightChallengeBtn.addEventListener('click', () => {
        heightChallengeActive = true;
        minigamesMenuPanel.style.display = 'none';
        heightChallengePanel.style.display = 'block';
    });
}

// ========== CHALLENGES BUTTON ========== 
if (challengeBtn) {
    challengeBtn.addEventListener('click', () => {
        challengesPanel.style.display = challengesPanel.style.display === 'none' ? 'block' : 'none';
    });
}

// ========== FETCH & DISPLAY PLANTS ========== 
let previousAchievementCount = 0;

async function loadGarden() {
    try {
        // Get auth token
        const token = await getAuthToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch('/plants', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch plants');
        }

        const plants = await response.json();
        currentPlants = plants;
        loadingSpinner.classList.add('hidden');

        // Update stats
        document.getElementById('totalPlants').textContent = plants.length;

        if (plants.length > 0) {
            const heights = plants.map(p => p.height);
            const tallest = Math.max(...heights);
            document.getElementById('tallestPlant').textContent = tallest + 'px';

            const colors = new Set(plants.map(p => p.color));
            document.getElementById('colorVariety').textContent = colors.size;

            const leafTypes = new Set(plants.map(p => p.leaf_type));
            document.getElementById('leafTypes').textContent = leafTypes.size;

            // Update height challenge bar if active
            if (heightChallengeActive && heightBar) {
                const maxHeight = Math.max(...heights);
                const percentage = Math.min((maxHeight / 350) * 100, 100);
                heightBar.style.height = percentage + '%';
                document.getElementById('currentHeight').textContent = maxHeight;

                if (maxHeight >= 350) {
                    completeHeightChallenge();
                }
            }
        }

        // Load achievements from stats endpoint
        try {
            const statsResponse = await fetch('/stats', {
                headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`
                }
            });
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                const currentCount = stats.achievements_count;
                document.getElementById('achievements').textContent = currentCount;

                // Show animation if new achievement unlocked
                if (currentCount > previousAchievementCount) {
                    showAchievementPopup(
                        'Achievement Unlocked!',
                        `You now have ${currentCount} achievements! 🌟`
                    );
                    previousAchievementCount = currentCount;
                }
            }
        } catch (e) {
            console.error('Error loading achievements:', e);
        }

        // Load credits
        try {
            const creditsResponse = await fetch('/credits', {
                headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`
                }
            });
            if (creditsResponse.ok) {
                const creditsData = await creditsResponse.json();
                currentCredits = creditsData.total_credits;
                document.getElementById('credits').textContent = creditsData.total_credits;
            } else {
                const err = await creditsResponse.json().catch(() => ({}));
                console.error('Credits error:', err);
                document.getElementById('credits').textContent = currentCredits || 0;
            }
        } catch (e) {
            console.error('Error loading credits:', e);
            document.getElementById('credits').textContent = currentCredits || 0;
        }

        // Load challenges
        try {
            const challengesResponse = await fetch('/challenges', {
                headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`
                }
            });
            if (challengesResponse.ok) {
                const challenges = await challengesResponse.json();
                const challengeList = Array.isArray(challenges)
                    ? challenges
                    : (challenges.daily_challenges || []);
                displayChallenges(challengeList);
            }
        } catch (e) {
            console.error('Error loading challenges:', e);
        }

        // Load user cosmetics for plant rendering
        try {
            const cosmeticsResponse = await fetch('/cosmetics', {
                headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`
                }
            });
            if (cosmeticsResponse.ok) {
                const data = await cosmeticsResponse.json();
                userCosmetics = {};
                (data.cosmetics || []).forEach(cosmetic => {
                    if (cosmetic.owned) {
                        userCosmetics[cosmetic.id] = cosmetic;
                    }
                });
            }
        } catch (e) {
            console.error('Error loading cosmetics:', e);
        }

        if (plants.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            gardenGrid.classList.remove('hidden');
            plants.forEach(plant => {
                const plantCard = createPlantCard(plant);
                gardenGrid.appendChild(plantCard);

                // Check Height Challenge if active
                if (heightChallengeActive && plant.height >= 350) {
                    completeHeightChallenge();
                }

                // Update height bar display if Height Challenge is showing
                if (heightChallengeActive) {
                    const maxHeight = 350;
                    const percentage = Math.min(100, (plant.height / maxHeight) * 100);
                    if (heightBar) {
                        heightBar.style.height = percentage + '%';
                    }
                    const heightDisplay = document.getElementById('currentHeight');
                    if (heightDisplay) {
                        heightDisplay.textContent = plant.height;
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error:', error);
        loadingSpinner.classList.add('hidden');
        errorMessage.textContent = '⚠️ Failed to load garden: ' + error.message;
        errorMessage.classList.remove('hidden');
    }
}

// ========== DISPLAY CHALLENGES ========== 
function displayChallenges(challenges) {
    challengesList.innerHTML = '';
    challenges.forEach(challenge => {
        const challengeCard = document.createElement('div');
        challengeCard.style.cssText = `
            background: rgba(127, 211, 132, 0.1);
            border: 1px solid rgba(127, 211, 132, 0.2);
            border-radius: 8px;
            padding: 1rem;
            position: relative;
        `;

        const completedClass = challenge.completed ? 'opacity: 0.6;' : '';
        const checkmark = challenge.completed ? '✅' : '⭕';

        challengeCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #7fd384; font-size: 1.1rem;">${challenge.emoji} ${challenge.name}</h3>
                    <p style="margin: 0 0 0.5rem 0; color: #a8d5a8; font-size: 0.95rem;">${challenge.description}</p>
                    <p style="margin: 0; color: #ffc107; font-weight: bold;">💰 +${challenge.reward} credits</p>
                </div>
                <span style="font-size: 1.5rem; ${completedClass}">${checkmark}</span>
            </div>
        `;

        challengesList.appendChild(challengeCard);
    });
}

// ========== CREATE PLANT CARD ========== 
function createPlantCard(plant) {
    const card = document.createElement('div');
    card.className = 'plant-card';

    const visualization = createPlantVisualization(plant);
    const info = createPlantInfo(plant);

    card.appendChild(visualization);
    card.appendChild(info);

    return card;
}

// ========== CREATE PLANT VISUALIZATION ========== 
function createPlantVisualization(plant) {
    const container = document.createElement('div');
    container.className = 'plant-visualization';

    const height = plant.height;
    const branches = plant.branches;
    const leafType = plant.leaf_type;
    const color = plant.color;

    // Stem
    const stem = document.createElement('div');
    stem.className = 'plant-stem';
    stem.style.height = height + 'px';
    stem.style.backgroundColor = color;

    // Apply cosmetics if any
    if (userCosmetics && Object.values(userCosmetics).length > 0) {
        applyPlantCosmetics(stem, container);
    }

    container.appendChild(stem);

    // Branches with leaves
    for (let i = 0; i < branches; i++) {
        const branchGroup = createBranch(i, branches, height, leafType, color);
        container.appendChild(branchGroup);
    }

    return container;
}

function applyPlantCosmetics(stemElement, containerElement) {
    const cosmeticsList = Object.keys(userCosmetics || {});
    if (cosmeticsList.length === 0) return;

    // Randomly apply one active cosmetic
    const activeCosmeticKey = cosmeticsList[0];

    switch (activeCosmeticKey) {
        case 'glowing_plants':
            stemElement.style.boxShadow = '0 0 15px #00ff00, 0 0 30px rgba(0, 255, 0, 0.5)';
            stemElement.style.borderRadius = '50%';
            break;
        case 'neon_brush':
            stemElement.style.boxShadow = '0 0 20px #ff00ff';
            stemElement.style.filter = 'hue-rotate(45deg) brightness(1.3)';
            break;
        case 'golden_leaves':
            stemElement.style.backgroundColor = '#FFD700';
            stemElement.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.8)';
            break;
        case 'rainbow_garden':
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            stemElement.style.background = `linear-gradient(45deg, ${randomColor}, ${stemElement.style.backgroundColor})`;
            break;
        case 'robot_plants':
            stemElement.style.borderRadius = '8px';
            stemElement.style.border = '2px solid #444';
            stemElement.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
            break;
        case 'crystal_stems':
            stemElement.style.background = 'linear-gradient(90deg, rgba(100, 200, 255, 0.8), rgba(100, 200, 255, 0.4))';
            stemElement.style.boxShadow = '0 0 20px rgba(100, 200, 255, 0.6), inset 0 0 10px rgba(255,255,255,0.3)';
            break;
    }
}

// ========== CREATE BRANCH WITH LEAVES ========== 
function createBranch(index, totalBranches, stemHeight, leafType, color) {
    const group = document.createElement('div');
    group.style.position = 'relative';
    group.style.width = '100%';
    group.style.height = stemHeight + 'px';

    // Position along stem
    const positionPercent = (index + 1) / (totalBranches + 1);
    const branchY = stemHeight * (1 - positionPercent);
    const branchLength = 20 + Math.random() * 30;

    // Create branch line
    const branch = document.createElement('div');
    branch.className = 'branch';
    branch.style.width = '2px';
    branch.style.height = branchLength + 'px';
    branch.style.backgroundColor = color;
    branch.style.bottom = branchY + 'px';
    branch.style.left = '50%';
    branch.style.marginLeft = '-1px';

    const angle = (index % 2 === 0 ? 1 : -1) * (20 + Math.random() * 20);
    branch.style.transform = `rotate(${angle}deg)`;

    group.appendChild(branch);

    // Add leaves
    const leafCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < leafCount; i++) {
        const leaf = createLeaf(leafType, color);
        leaf.style.position = 'absolute';
        leaf.style.bottom = branchY + (i * 6) + 'px';
        leaf.style.left = '50%';

        const leafOffsetX = (i % 2 === 0 ? -10 : 10);
        const leafOffsetY = i * 5;
        leaf.style.transform = `translateX(${leafOffsetX}px) translateY(${leafOffsetY}px)`;

        group.appendChild(leaf);
    }

    return group;
}

// ========== CREATE SINGLE LEAF ========== 
function createLeaf(leafType, color) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf ' + leafType;
    leaf.style.backgroundColor = color;
    leaf.style.opacity = '0.85';
    return leaf;
}

// ========== CREATE PLANT INFO ========== 
function createPlantInfo(plant) {
    const info = document.createElement('div');
    info.className = 'plant-info';

    const leafTypeLabel = plant.leaf_type.charAt(0).toUpperCase() + plant.leaf_type.slice(1);
    const createdDate = formatDate(plant.created_at);

    info.innerHTML = `
        <p>🍃 ${leafTypeLabel} leaves</p>
        <p>🌱 ${plant.branches} branches</p>
        <p class="plant-created">${createdDate}</p>
    `;

    return info;
}

// ========== FORMAT DATE ========== 
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

// ========== COSMETICS SHOP FUNCTIONS ========== 
async function loadCosmetics() {
    try {
        const token = await getAuthToken();
        const response = await fetch('/cosmetics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to load cosmetics');

        const cosmetics = await response.json();
        cosmeticsCache = Array.isArray(cosmetics) ? cosmetics : (cosmetics.cosmetics || []);
        displayCosmeticsShop(cosmeticsCache);
    } catch (e) {
        console.error('Error loading cosmetics:', e);
        cosmeticsGrid.innerHTML = '<p style="color: #ff6b6b;">Error loading cosmetics</p>';
    }
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

        const ownedClass = cosmetic.owned ? 'opacity: 0.5;' : '';
        const buttonText = cosmetic.owned ? '✓ Owned' : `Buy - ${cosmetic.price}💰`;
        const buttonDisabled = cosmetic.owned ? 'disabled' : '';

        card.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${cosmetic.emoji}</div>
            <h3 style="margin: 0.5rem 0; color: #ff69b4;">${cosmetic.name}</h3>
            <p style="margin: 0 0 1rem 0; color: #a8d5a8; font-size: 0.9rem;">${cosmetic.description}</p>
            <button onclick="purchaseCosmetic(${cosmetic.id})" ${buttonDisabled} style="
                background: ${cosmetic.owned ? '#555' : 'rgba(255, 105, 180, 0.3)'};
                color: ${cosmetic.owned ? '#999' : '#ff69b4'};
                border: 1px solid rgba(255, 105, 180, 0.5);
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: ${cosmetic.owned ? 'default' : 'pointer'};
                font-weight: bold;
                width: 100%;
                transition: all 0.3s;
            ">${buttonText}</button>
        `;

        cosmeticsGrid.appendChild(card);
    });
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

        const purchasedItem = cosmeticsCache.find(c => c.id === cosmeticId);
        if (purchasedItem) {
            const key = purchasedItem.key || purchasedItem.id;
            if (!purchasedCosmetics.includes(key)) {
                purchasedCosmetics.push(key);
                localStorage.setItem('purchasedCosmetics', JSON.stringify(purchasedCosmetics));
            }
            if (purchasedItem.key) {
                localSpentCosmetics[purchasedItem.key] = purchasedItem.price || 0;
                localStorage.setItem('localSpentCosmetics', JSON.stringify(localSpentCosmetics));
            }
        }

        // Reload cosmetics display
        loadCosmetics();

    } catch (e) {
        console.error('Error purchasing cosmetic:', e);
        alert('Purchase failed');
    }
}

// ========== LEADERBOARD FUNCTIONS ========== 
async function loadLeaderboard() {
    try {
        const response = await fetch('/leaderboard');

        if (!response.ok) throw new Error('Failed to load leaderboard');

        const data = await response.json();
        displayLeaderboard(data);
    } catch (e) {
        console.error('Error loading leaderboard:', e);
        document.getElementById('leaderboardByPlants').innerHTML = '<p style="color: #ff6b6b;">Error loading</p>';
    }
}

function displayLeaderboard(data) {
    // Display by plants
    const plantsDiv = document.getElementById('leaderboardByPlants');
    plantsDiv.innerHTML = data.by_plants.map(item => `
        <div style="background: rgba(127, 211, 132, 0.2); padding: 0.75rem; border-radius: 6px; text-align: center;">
            <div style="font-weight: bold; color: #7fd384;">#${item.rank}</div>
            <div style="font-size: 1.5rem; margin: 0.25rem 0;">${item.label}</div>
        </div>
    `).join('');

    // Display by credits
    const creditsDiv = document.getElementById('leaderboardByCredits');
    creditsDiv.innerHTML = data.by_credits.map(item => `
        <div style="background: rgba(255, 193, 7, 0.2); padding: 0.75rem; border-radius: 6px; text-align: center;">
            <div style="font-weight: bold; color: #ffc107;">#${item.rank}</div>
            <div style="font-size: 1.5rem; margin: 0.25rem 0;">${item.label}</div>
        </div>
    `).join('');

    // Display by streaks
    const streaksDiv = document.getElementById('leaderboardByStreaks');
    streaksDiv.innerHTML = data.by_streaks.map(item => `
        <div style="background: rgba(255, 107, 107, 0.2); padding: 0.75rem; border-radius: 6px; text-align: center;">
            <div style="font-weight: bold; color: #ff6b6b;">#${item.rank}</div>
            <div style="font-size: 1.5rem; margin: 0.25rem 0;">${item.label}</div>
        </div>
    `).join('');
}

// ========== SPEED DRAW GAME ========== 
function startSpeedDraw() {
    speedDrawActive = true;
    speedDrawCount = 0;
    minigamesMenuPanel.style.display = 'none';
    speedDrawPanel.style.display = 'block';
    speedDrawCounter.textContent = '0';

    let timeLeft = 60;
    speedDrawTimer.textContent = '60';

    // Store initial plant count
    const initialPlantCount = currentPlants.length;
    localStorage.setItem('speedDrawInitialCount', initialPlantCount);
    localStorage.setItem('speedDrawActive', 'true');

    // Update timer and check plant count every second
    speedDrawInterval = setInterval(async () => {
        timeLeft--;
        speedDrawTimer.textContent = timeLeft;

        // Check if new plants have been added
        await checkSpeedDrawProgress(initialPlantCount);

        if (timeLeft <= 0) {
            endSpeedDraw();
        }
    }, 1000);

    window.speedDrawGameActive = true;
}

async function checkSpeedDrawProgress(initialCount) {
    try {
        // Get fresh plant data
        const response = await fetch('/plants');
        if (response.ok) {
            const data = await response.json();
            const newCount = Math.max(0, (data.plants?.length || 0) - initialCount);
            updateSpeedDrawCounter(newCount);
        }
    } catch (e) {
        console.error('Error checking Speed Draw progress:', e);
    }
}

function stopSpeedDraw() {
    speedDrawActive = false;
    window.speedDrawGameActive = false;
    localStorage.removeItem('speedDrawActive');
    localStorage.removeItem('speedDrawInitialCount');

    if (speedDrawInterval) {
        clearInterval(speedDrawInterval);
        speedDrawInterval = null;
    }
}

function updateSpeedDrawCounter(newCount) {
    if (speedDrawActive) {
        speedDrawCount = newCount;
        speedDrawCounter.textContent = newCount;

        // Check if player won
        if (newCount >= 5) {
            endSpeedDraw(true);
        }
    }
}

async function endSpeedDraw(won = false) {
    stopSpeedDraw();

    if (won) {
        alert('🎉 Congratulations! You completed Speed Draw! +100 credits awarded!');

        try {
            const token = await getAuthToken();
            const response = await fetch('/minigame/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    game: 'speed_draw',
                    score: speedDrawCount,
                    completed: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                const creditsEl = document.getElementById('credits');
                if (creditsEl) {
                    creditsEl.textContent = data.total_credits || currentCredits;
                }
                if (typeof data.total_credits !== 'undefined') {
                    currentCredits = data.total_credits;
                }
                loadGarden();
            } else {
                const err = await response.json();
                console.error('Speed Draw error:', err);
            }
        } catch (e) {
            console.error('Error recording Speed Draw:', e);
        }
    } else {
        alert('⏰ Time\'s up! You drew ' + speedDrawCount + ' plants. Try again!');
    }

    minigamesMenuPanel.style.display = 'block';
    speedDrawPanel.style.display = 'none';
}

// ========== COLOR MATCH GAME ==========
const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa502'];

function startColorMatch() {
    colorMatchActive = true;
    colorMatchLevel = 1;
    colorMatchScore = 0;
    colorMatchSequence = [];
    playerSequence = [];

    colorMatchLevelDisplay.textContent = colorMatchLevel;
    colorMatchScoreDisplay.textContent = colorMatchScore;

    playColorMatchSequence();
}

function stopColorMatch() {
    colorMatchActive = false;
    colorMatchSequence = [];
    playerSequence = [];
    colorMatchDisplay.innerHTML = '';
}

async function playColorMatchSequence() {
    if (!colorMatchActive) return;

    const newColor = colors[Math.floor(Math.random() * colors.length)];
    colorMatchSequence.push(newColor);
    playerSequence = [];

    await new Promise(resolve => setTimeout(resolve, 500));

    for (const color of colorMatchSequence) {
        await new Promise(resolve => {
            const box = document.createElement('div');
            box.style.cssText = `width: 100%; height: 100%; background: ${color}; border-radius: 8px;`;
            playSound('click');
            setTimeout(() => resolve(), 600);
        });
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    renderColorBoxes();
}

function renderColorBoxes() {
    colorMatchDisplay.innerHTML = '';
    colors.forEach(color => {
        const box = document.createElement('div');
        box.style.cssText = `
            width: 60px; height: 60px; background: ${color}; 
            border-radius: 8px; cursor: pointer; transition: transform 0.1s;
            border: 2px solid rgba(255,255,255,0.3);
        `;
        box.onmouseover = () => box.style.transform = 'scale(1.1)';
        box.onmouseout = () => box.style.transform = 'scale(1)';
        box.onclick = () => handleColorClick(color, box);
        colorMatchDisplay.appendChild(box);
    });
}

async function handleColorClick(color, element) {
    if (!colorMatchActive) return;

    playerSequence.push(color);
    element.style.background = 'white';
    playSound('click');

    setTimeout(() => {
        element.style.background = color;
    }, 200);

    for (let i = 0; i < playerSequence.length; i++) {
        if (playerSequence[i] !== colorMatchSequence[i]) {
            endColorMatch(false);
            return;
        }
    }

    if (playerSequence.length === colorMatchSequence.length) {
        colorMatchScore += colorMatchSequence.length * 10;
        colorMatchLevel++;
        colorMatchScoreDisplay.textContent = colorMatchScore;
        colorMatchLevelDisplay.textContent = colorMatchLevel;

        playSound('win');
        await new Promise(resolve => setTimeout(resolve, 800));
        playColorMatchSequence();
    }
}

async function endColorMatch(won) {
    colorMatchActive = false;

    if (won || colorMatchLevel > 1) {
        playSound('achievement');
        showAchievementPopup('Color Match!', `Level: ${colorMatchLevel} | Score: ${colorMatchScore}!`);

        try {
            const token = await getAuthToken();
            const response = await fetch('/minigame/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    game: 'color_match',
                    score: colorMatchScore,
                    completed: true
                })
            });

            if (response.ok) {
                const data = await response.json();
                const creditsEl = document.getElementById('credits');
                if (creditsEl) {
                    creditsEl.textContent = data.total_credits || currentCredits;
                }
                if (typeof data.total_credits !== 'undefined') {
                    currentCredits = data.total_credits;
                }
            } else {
                const err = await response.json();
                console.error('Color Match error:', err);
            }
        } catch (e) {
            console.error('Error recording Color Match:', e);
        }
    } else {
        alert('❌ Wrong! Try again!');
    }

    colorMatchDisplay.innerHTML = '';
    minigamesMenuPanel.style.display = 'block';
    colorMatchPanel.style.display = 'none';
}

// ========== HEIGHT CHALLENGE GAME ==========
async function completeHeightChallenge() {
    heightChallengeActive = false;
    playSound('win');
    playConfetti();
    showAchievementPopup('Height Challenge!', 'You grew a 350px+ tall plant! 🌳');

    try {
        const token = await getAuthToken();
        const response = await fetch('/minigame/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                game: 'height_challenge',
                score: parseInt(document.getElementById('currentHeight').textContent),
                completed: true
            })
        });

        if (response.ok) {
            const data = await response.json();
            const creditsEl = document.getElementById('credits');
            if (creditsEl) {
                creditsEl.textContent = data.total_credits || currentCredits;
            }
            if (typeof data.total_credits !== 'undefined') {
                currentCredits = data.total_credits;
            }
        } else {
            const err = await response.json();
            console.error('Height Challenge error:', err);
        }
    } catch (e) {
        console.error('Error recording Height Challenge:', e);
    }

    setTimeout(() => {
        minigamesMenuPanel.style.display = 'block';
        heightChallengePanel.style.display = 'none';
    }, 3000);
}

function playConfetti() {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const particles = [];

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * 5 + 5,
            life: 1,
            size: Math.random() * 3 + 2,
            color: ['#FFD700', '#FFA500', '#FF6347', '#32CD32'][Math.floor(Math.random() * 4)]
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let anyAlive = false;

        particles.forEach(p => {
            p.y += p.vy;
            p.vy += 0.2;
            p.vx *= 0.98;
            p.life -= 0.02;

            if (p.life > 0) {
                anyAlive = true;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.fillRect(p.x, p.y, p.size, p.size);
                ctx.globalAlpha = 1;
            }
        });

        if (anyAlive) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }

    animate();
}

function showAchievementPopup(title, description) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        padding: 2rem;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        max-width: 90%;
        width: 400px;
    `;

    popup.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
        <div style="font-size: 1.5rem; font-weight: bold; color: white; margin-bottom: 0.5rem;">${title}</div>
        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.9);">${description}</div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes popIn {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.1); }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes popOut {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(popup);

    playConfetti();
    playSound('achievement');

    setTimeout(() => {
        popup.style.animation = 'popOut 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        setTimeout(() => popup.remove(), 500);
    }, 3000);
}

// ========== SOUND SYSTEM ==========
const soundContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {
    achievement: null,
    plant_grow: null,
    click: null,
    win: null,
    timer_warning: null
};

function initSounds() {
    // Simple beep sounds generated programmatically
    sounds.achievement = { frequency: 800, duration: 0.3 };
    sounds.plant_grow = { frequency: 600, duration: 0.5 };
    sounds.click = { frequency: 400, duration: 0.1 };
    sounds.win = { frequency: 1000, duration: 0.2 };
    sounds.timer_warning = { frequency: 700, duration: 0.15 };
}

function playSound(soundName) {
    try {
        const sound = sounds[soundName];
        if (!sound) return;

        const osc = soundContext.createOscillator();
        const gain = soundContext.createGain();

        osc.connect(gain);
        gain.connect(soundContext.destination);

        osc.frequency.value = sound.frequency;
        gain.gain.setValueAtTime(0.3, soundContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, soundContext.currentTime + sound.duration);

        osc.start(soundContext.currentTime);
        osc.stop(soundContext.currentTime + sound.duration);
    } catch (e) {
        console.log('Sound playback skipped:', e);
    }
}

// ========== LOAD ON PAGE LOAD ==========
initSounds();
document.addEventListener('DOMContentLoaded', loadGarden);

