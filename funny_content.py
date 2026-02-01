"""Funny challenges and mini-games for Virtual Doodle Garden"""

DAILY_CHALLENGES = [
    {
        "id": "dark_doodle",
        "name": "🌑 Dark Doodle",
        "emoji": "🌑",
        "description": "Draw something really dark (scary plant coming!)",
        "reward": 50,
        "condition": lambda plant: plant.get("height", 0) > 250
    },
    {
        "id": "light_touch",
        "name": "✨ Light Touch",
        "emoji": "✨",
        "description": "Draw something delicate and light",
        "reward": 50,
        "condition": lambda plant: plant.get("height", 0) < 150
    },
    {
        "id": "branch_master",
        "name": "🌳 Branch Master",
        "emoji": "🌳",
        "description": "Create a plant with 5 branches",
        "reward": 75,
        "condition": lambda plant: plant.get("branches", 0) == 5
    },
    {
        "id": "tiny_dancer",
        "name": "💃 Tiny Dancer",
        "emoji": "💃",
        "description": "Create the shortest plant (<120px)",
        "reward": 60,
        "condition": lambda plant: plant.get("height", 0) < 120
    },
    {
        "id": "rainbow_collector",
        "name": "🌈 Rainbow Collector",
        "emoji": "🌈",
        "description": "Create plants in 3 different colors today",
        "reward": 100,
        "condition": lambda plants: len(set(p.get("color") for p in plants)) >= 3
    },
    {
        "id": "leaf_explorer",
        "name": "🍃 Leaf Explorer",
        "emoji": "🍃",
        "description": "Use all 3 leaf types in one day",
        "reward": 80,
        "condition": lambda plants: len(set(p.get("leaf_type") for p in plants)) >= 3
    },
]

MINI_GAMES = [
    {
        "id": "speed_draw",
        "name": "⚡ Speed Draw",
        "emoji": "⚡",
        "description": "Draw 5 plants in 60 seconds",
        "reward": 200,
        "requirement": 5,
        "time_limit": 60
    },
    {
        "id": "color_match",
        "name": "🎨 Color Match",
        "emoji": "🎨",
        "description": "Create plants matching specific colors in order",
        "reward": 150,
        "requirement": 4
    },
    {
        "id": "height_challenge",
        "name": "📏 Height Challenge",
        "emoji": "📏",
        "description": "Create the tallest plant without exceeding 350px",
        "reward": 175,
        "requirement": 350
    },
    {
        "id": "accuracy_drill",
        "name": "🎯 Accuracy Drill",
        "emoji": "🎯",
        "description": "Create 3 identical-looking plants",
        "reward": 120,
        "requirement": 3
    },
]

FUNNY_STREAK_MESSAGES = {
    0: "🌱 Let's get started!",
    1: "🔥 One day strong!",
    2: "🌿 Two days? You're committed!",
    3: "🔥 Three-day warrior!",
    4: "🌳 Fourth dimension unlocked!",
    5: "🎉 FIVE DAYS! You're a legend!",
    7: "🏆 ONE WEEK! Seriously, go outside! 😄",
    10: "👑 TEN DAYS! You're obsessed (we love it)",
    14: "🤯 TWO WEEKS! Plant god status!",
    30: "🚀 ONE MONTH! You need a medal!",
    60: "💎 TWO MONTHS! Are you okay? (jk you're amazing)",
    100: "👽 THREE+ MONTHS! You've transcended!",
}

FUNNY_ACHIEVEMENT_REACTIONS = {
    "first_bloom": "🎉 Your first plant! Welcome to the crazy club!",
    "green_thumb": "👍 10 plants?! You're actually doing this!",
    "master_gardener": "🌳 50 plants! You've created an ecosystem!",
    "color_collector": "🎨 All colors?! You're a rainbow wizard!",
    "leaf_scientist": "🔬 All leaf types! PhD in doodle science!",
    "consistent_grower": "🔥 7-day streak! You're literally a robot!",
    "tower_builder": "🏢 300px+ plant! That's taller than me!",
    "tiny_gardener": "🌿 100 plants! Your forest > my yard!",
}

COSMETICS_SHOP = [
    {
        "id": "glow_plant",
        "name": "✨ Glowing Plants",
        "emoji": "✨",
        "price": 100,
        "description": "Plants glow in the dark"
    },
    {
        "id": "neon_brush",
        "name": "💡 Neon Brush",
        "emoji": "💡",
        "price": 75,
        "description": "Draw with neon colors"
    },
    {
        "id": "golden_leaves",
        "name": "💰 Golden Leaves",
        "emoji": "💰",
        "price": 150,
        "description": "All leaves become gold"
    },
    {
        "id": "rainbow_pot",
        "name": "🌈 Rainbow Garden",
        "emoji": "🌈",
        "price": 200,
        "description": "Rainbow background theme"
    },
    {
        "id": "robot_plant",
        "name": "🤖 Robot Plants",
        "emoji": "🤖",
        "price": 120,
        "description": "Mechanical plant aesthetic"
    },
    {
        "id": "crystal_stems",
        "name": "💎 Crystal Stems",
        "emoji": "💎",
        "price": 180,
        "description": "Crystalline plant stems"
    },
]

FUNNY_NOTIFICATIONS = [
    "🌱 A wild plant appeared!",
    "🎉 Plot twist: Your plant is BEAUTIFUL!",
    "✨ Your imagination is ✨ S P E C I A L ✨",
    "🤔 Is it a plant? Is it art? It's MAGIC!",
    "🌿 The garden approves! ✓",
    "🎨 Picasso could never.",
    "💪 Your doodle has POWER!",
    "🚀 Plant + You = ❤️",
]

LEADERBOARD_TITLES = {
    1: "👑 Plant Emperor",
    2: "🥈 Silver Cultivator",
    3: "🥉 Bronze Gardener",
    10: "🌟 Rising Star",
    50: "💫 Plant Champion",
    100: "🚀 Legendary Gardener",
}
