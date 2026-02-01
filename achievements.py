import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from funny_content import FUNNY_STREAK_MESSAGES, FUNNY_ACHIEVEMENT_REACTIONS

load_dotenv()

# Supabase client will be passed in as parameter
supabase = None

# Achievement definitions
ACHIEVEMENTS = {
    "first_bloom": {
        "name": "First Bloom",
        "description": "Create your first plant",
        "emoji": "🌱",
        "condition": lambda plants: len(plants) >= 1
    },
    "green_thumb": {
        "name": "Green Thumb",
        "description": "Create 10 plants",
        "emoji": "👍",
        "condition": lambda plants: len(plants) >= 10
    },
    "master_gardener": {
        "name": "Master Gardener",
        "description": "Create 50 plants",
        "emoji": "🌳",
        "condition": lambda plants: len(plants) >= 50
    },
    "color_collector": {
        "name": "Color Collector",
        "description": "Collect all 7 colors",
        "emoji": "🎨",
        "condition": lambda plants: len(set(p.get("color") for p in plants)) >= 7
    },
    "leaf_scientist": {
        "name": "Leaf Scientist",
        "description": "Unlock all 3 leaf types",
        "emoji": "🔬",
        "condition": lambda plants: len(set(p.get("leaf_type") for p in plants)) >= 3
    },
    "consistent_grower": {
        "name": "Consistent Grower",
        "description": "Maintain 7-day streak",
        "emoji": "🔥",
        "condition": lambda plants, streak=None: streak >= 7 if streak else False
    },
    "tower_builder": {
        "name": "Tower Builder",
        "description": "Create a plant taller than 300px",
        "emoji": "🏢",
        "condition": lambda plants: any(p.get("height", 0) >= 300 for p in plants)
    },
    "tiny_gardener": {
        "name": "Tiny Gardener",
        "description": "Create 100 plants",
        "emoji": "🌿",
        "condition": lambda plants: len(plants) >= 100
    }
}


def get_user_achievements(sb, user_id):
    """Get all achievements for a user"""
    try:
        response = sb.table("user_achievements").select(
            "*").eq("user_id", user_id).execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching achievements: {str(e)}")
        return []


def check_and_award_achievements(sb, user_id, plants, current_streak=0):
    """Check which achievements user qualifies for and award new ones"""
    try:
        # Get existing achievements
        existing = get_user_achievements(sb, user_id)
        existing_ids = {a["achievement_id"] for a in existing}

        # Get current plants for calculations
        user_plants = plants if isinstance(plants, list) else []

        new_achievements = []

        for achievement_id, achievement_info in ACHIEVEMENTS.items():
            # Skip if already earned
            if achievement_id in existing_ids:
                continue

            # Check condition
            try:
                if achievement_id == "consistent_grower":
                    condition_met = achievement_info["condition"](
                        user_plants, streak=current_streak)
                else:
                    condition_met = achievement_info["condition"](user_plants)
            except:
                condition_met = False

            # Award if condition met
            if condition_met:
                new_achievements.append({
                    "user_id": user_id,
                    "achievement_id": achievement_id,
                    "name": achievement_info["name"],
                    "description": achievement_info["description"],
                    "emoji": achievement_info["emoji"],
                    "earned_at": datetime.utcnow().isoformat()
                })

        # Insert new achievements
        if new_achievements:
            sb.table("user_achievements").insert(
                new_achievements).execute()

        return new_achievements
    except Exception as e:
        print(f"Error awarding achievements: {str(e)}")
        return []


def get_user_streak(sb, user_id):
    """Calculate user's current streak"""
    try:
        response = sb.table("plants").select(
            "created_at").eq("user_id", user_id).order("created_at", desc=True).execute()

        if not response.data:
            return 0

        plants = response.data
        today = datetime.utcnow().date()
        current_streak = 0

        for plant in plants:
            plant_date = datetime.fromisoformat(
                plant["created_at"].replace("Z", "+00:00")).date()
            expected_date = today - timedelta(days=current_streak)

            if plant_date == expected_date:
                current_streak += 1
            elif current_streak > 0:
                break

        return current_streak
    except Exception as e:
        print(f"Error calculating streak: {str(e)}")
        return 0


def create_achievements_table():
    """Initialize achievements table if it doesn't exist"""
    try:
        # This would need to be run in Supabase SQL Editor
        sql = """
        CREATE TABLE IF NOT EXISTS user_achievements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            achievement_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            emoji TEXT NOT NULL,
            earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, achievement_id)
        );
        
        ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own achievements"
            ON user_achievements FOR SELECT
            USING (auth.uid() = user_id);
        """
        print("Run this in Supabase SQL Editor:")
        print(sql)
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    create_achievements_table()
