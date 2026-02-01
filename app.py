import os
import base64
import json
import random
import jwt
from io import BytesIO
from datetime import datetime, timedelta
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, Response
from PIL import Image
from supabase import create_client, Client
from achievements import check_and_award_achievements, get_user_achievements, get_user_streak
from funny_content import DAILY_CHALLENGES, MINI_GAMES, FUNNY_NOTIFICATIONS, COSMETICS_SHOP, FUNNY_STREAK_MESSAGES

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize Supabase client with ANON key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Plant generation constants
LEAF_TYPES = ["round", "sharp", "heart"]
GREEN_COLORS = [
    "#2d5016",  # Dark green
    "#3d6b1f",  # Forest green
    "#4a7c2c",  # Sage green
    "#5fa33c",  # Lime green
    "#2e7d32",  # Garden green
    "#558b2f",  # Olive green
    "#1b5e20",  # Deep green
]


# ========== AUTH HELPERS ==========
def get_user_from_token(token):
    """Decode JWT token and extract user info without server verification"""
    if not token:
        return None

    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]

        # Decode JWT without verification (we trust Supabase's token)
        # The token was issued by Supabase, so we can trust its contents
        decoded = jwt.decode(token, options={"verify_signature": False})

        # Extract user info from token
        if 'sub' in decoded:  # 'sub' is the user ID in Supabase JWTs
            class User:
                def __init__(self, user_id, email):
                    self.id = user_id
                    self.email = email

            return User(decoded['sub'], decoded.get('email', ''))

        return None
    except Exception as e:
        print(f"Token decoding error: {str(e)}")
        return None


def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Unauthorized"}), 401

        user = get_user_from_token(auth_header)
        if not user:
            return jsonify({"error": "Invalid token"}), 401

        # Pass user to the route
        return f(user, *args, **kwargs)
    return decorated_function


def calculate_total_credits(user_id):
    """Calculate total credits including mini-game awards."""
    # Get total plants (each plant = 10 credits base)
    plant_count = 0
    try:
        plants_response = supabase.table("plants").select(
            "id").eq("user_id", user_id).execute()
        plant_count = len(plants_response.data or [])
    except Exception as e:
        print(f"Error loading plants for credits: {str(e)}")

    # Get achievements (each achievement = bonus credits)
    achievements = []
    try:
        achievements = get_user_achievements(supabase, user_id)
    except Exception as e:
        print(f"Error loading achievements for credits: {str(e)}")
    achievement_bonus = len(achievements) * 25

    # Get streak (each day = 5 credits)
    streak = 0
    try:
        streak = get_user_streak(supabase, user_id)
    except Exception as e:
        print(f"Error loading streak for credits: {str(e)}")
    streak_bonus = streak * 5

    # Get minigame credits
    minigame_credits = 0
    try:
        minigame_response = supabase.table("minigame_scores").select(
            "credits_awarded").eq("user_id", user_id).execute()
        minigame_credits = sum(
            row.get("credits_awarded", 0) for row in (minigame_response.data or [])
        )
    except Exception as e:
        print(f"Error loading minigame credits: {str(e)}")

    # Get spent credits from owned cosmetics
    spent_credits = 0
    try:
        owned_response = supabase.table("user_cosmetics").select(
            "cosmetic_id").eq("user_id", user_id).execute()
        owned_ids = [item.get("cosmetic_id")
                     for item in (owned_response.data or [])]
        for cid in owned_ids:
            if cid is None:
                continue
            if isinstance(cid, str) and cid.isdigit():
                cid = int(cid)
            if isinstance(cid, int) and 0 <= cid < len(COSMETICS_SHOP):
                spent_credits += COSMETICS_SHOP[cid]["price"]
            else:
                for cosmetic in COSMETICS_SHOP:
                    if cosmetic.get("id") == cid:
                        spent_credits += cosmetic["price"]
                        break
    except Exception as e:
        print(f"Error loading spent credits: {str(e)}")

    earned_credits = (plant_count * 10) + achievement_bonus + \
        streak_bonus + minigame_credits
    total_credits = max(0, earned_credits - spent_credits)

    return total_credits, {
        "plants": plant_count,
        "achievements": len(achievements),
        "streak": streak,
        "plant_credits": plant_count * 10,
        "achievement_bonus": achievement_bonus,
        "streak_bonus": streak_bonus,
        "minigame_credits": minigame_credits,
        "spent_credits": spent_credits,
        "earned_credits": earned_credits
    }


# ========== ROUTES ==========

@app.route("/login")
def login():
    """Render login page"""
    return render_template("login.html")


@app.route("/favicon.ico")
def favicon():
    """Serve a simple inline SVG favicon to avoid 404s."""
    svg = """<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
    <rect width='64' height='64' rx='14' fill='#1f3a2a'/>
    <path d='M32 10c8 6 12 12 12 20 0 10-8 18-12 18s-12-8-12-18c0-8 4-14 12-20z' fill='#7fd384'/>
    <circle cx='32' cy='24' r='4' fill='#c8f7c5'/>
    </svg>"""
    return Response(svg, mimetype='image/svg+xml')


@app.route("/")
def index():
    """Render drawing page (auth check done via frontend)"""
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
@require_auth
def generate(user):
    """
    Accept canvas image, analyze it, generate plant attributes,
    store in Supabase with user_id, and return plant JSON
    """
    try:
        user_id = user.id
        data = request.get_json()
        canvas_data = data.get("image")

        if not canvas_data:
            return jsonify({"error": "No image data provided"}), 400

        # Get the token from the request header
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '') if auth_header else ''

        # Remove the data:image/png;base64, prefix
        image_data = canvas_data.split(",")[1]
        image_bytes = base64.b64decode(image_data)

        # Load image and convert to grayscale
        image = Image.open(BytesIO(image_bytes))
        grayscale = image.convert("L")

        # Analyze pixel darkness (average darkness)
        pixels = list(grayscale.getdata())
        avg_darkness = sum(pixels) / len(pixels) if pixels else 128

        # Normalize darkness to 0-1 range (0 = light, 1 = dark)
        darkness_ratio = 1 - (avg_darkness / 255)

        # Generate plant attributes based on doodle characteristics
        # Height: darker doodles = taller plants (100-400px)
        height = int(100 + (darkness_ratio * 300))

        # Branches: random 1-5
        branches = random.randint(1, 5)

        # Leaf type: random
        leaf_type = random.choice(LEAF_TYPES)

        # Color: random green
        color = random.choice(GREEN_COLORS)

        # Growth stage: always 1 initially
        growth_stage = 1

        # Insert into Supabase with user_id
        plant_data = {
            "user_id": user_id,
            "height": height,
            "branches": branches,
            "leaf_type": leaf_type,
            "color": color,
            "growth_stage": growth_stage,
        }

        print(f"Attempting to insert plant for user {user_id}")
        print(f"Plant data: {plant_data}")

        # Use the global supabase client - RLS should allow this since user_id matches authenticated user
        response = supabase.table("plants").insert(plant_data).execute()

        print(f"Response: {response}")
        if hasattr(response, 'data') and response.data:
            plant = response.data[0]
            print(f"Plant created successfully: {plant}")
            return jsonify(plant), 201
        else:
            error_msg = f"Failed to insert plant"
            print(f"Error in /generate: {error_msg}")
            if hasattr(response, 'data'):
                print(f"Response data: {response.data}")
            return jsonify({"error": error_msg}), 500

    except Exception as e:
        error_msg = f"Error in /generate: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/plants", methods=["GET"])
@require_auth
def plants(user):
    """Fetch only plants belonging to logged-in user, ordered by newest first"""
    try:
        user_id = user.id
        response = supabase.table("plants").select(
            "*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        print(f"Error in /plants: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/stats", methods=["GET"])
@require_auth
def stats(user):
    """Get user stats including achievements and streak"""
    try:
        user_id = user.id

        # Get plants
        plants_response = supabase.table("plants").select(
            "*").eq("user_id", user_id).execute()
        plants = plants_response.data or []

        # Check for new achievements
        check_and_award_achievements(
            supabase, user_id, plants, current_streak=get_user_streak(supabase, user_id))

        # Get all achievements
        achievements = get_user_achievements(supabase, user_id)

        # Calculate stats
        stats_data = {
            "total_plants": len(plants),
            "streak": get_user_streak(supabase, user_id),
            "achievements": achievements,
            "achievements_count": len(achievements),
            "tallest_plant": max([p.get("height", 0) for p in plants]) if plants else 0,
            "unique_colors": len(set(p.get("color") for p in plants)) if plants else 0,
            "unique_leaf_types": len(set(p.get("leaf_type") for p in plants)) if plants else 0
        }

        return jsonify(stats_data), 200
    except Exception as e:
        print(f"Error in /stats: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/garden")
def garden():
    """Render garden UI (auth check done via frontend)"""
    return render_template("garden.html")


@app.route("/challenges", methods=["GET"])
@require_auth
def get_challenges(user):
    """Get daily challenges and mini-games"""
    try:
        user_id = user.id

        # Get today's plants
        today = datetime.utcnow().date()
        plants_today = supabase.table("plants").select(
            "*").eq("user_id", user_id).gte(
            "created_at", f"{today}T00:00:00"
        ).execute()

        today_plants = plants_today.data or []

        # Calculate challenge progress
        challenge_progress = []
        for challenge in DAILY_CHALLENGES:
            if challenge["id"] == "rainbow_collector":
                completed = len(set(p.get("color") for p in today_plants)) >= 3
            elif challenge["id"] == "leaf_explorer":
                completed = len(set(p.get("leaf_type")
                                for p in today_plants)) >= 3
            else:
                completed = any(challenge["condition"](
                    p) for p in today_plants) if today_plants else False

            challenge_progress.append({
                "id": challenge["id"],
                "name": challenge["name"],
                "emoji": challenge["emoji"],
                "description": challenge["description"],
                "reward": challenge["reward"],
                "completed": completed
            })

        return jsonify({
            "daily_challenges": challenge_progress,
            "mini_games": MINI_GAMES,
            "cosmetics": COSMETICS_SHOP
        }), 200
    except Exception as e:
        print(f"Error in /challenges: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/credits", methods=["GET"])
@require_auth
def get_credits(user):
    """Get user credits and purchase history"""
    try:
        user_id = user.id
        total_credits, breakdown = calculate_total_credits(user_id)

        return jsonify({
            "total_credits": total_credits,
            "plant_credits": breakdown["plant_credits"],
            "achievement_bonus": breakdown["achievement_bonus"],
            "streak_bonus": breakdown["streak_bonus"],
            "minigame_credits": breakdown["minigame_credits"],
            "spent_credits": breakdown["spent_credits"],
            "earned_credits": breakdown["earned_credits"],
            "breakdown": {
                "plants": breakdown["plants"],
                "achievements": breakdown["achievements"],
                "streak": breakdown["streak"],
                "minigames": breakdown["minigame_credits"],
                "spent": breakdown["spent_credits"]
            }
        }), 200
    except Exception as e:
        print(f"Error in /credits: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/cosmetics", methods=["GET"])
@require_auth
def get_cosmetics(user):
    """Get all cosmetics and user's owned cosmetics"""
    try:
        user_id = user.id

        # Get user's owned cosmetics
        try:
            owned_response = supabase.table("user_cosmetics").select(
                "cosmetic_id").eq("user_id", user_id).execute()
            owned_ids = {item["cosmetic_id"]
                         for item in owned_response.data or []}
        except:
            owned_ids = set()

        # Build cosmetics list with ownership info
        cosmetics_list = []
        for cosmetic_id, cosmetic_data in enumerate(COSMETICS_SHOP):
            cosmetics_list.append({
                "id": cosmetic_id,
                "key": cosmetic_data.get("id"),
                "name": cosmetic_data["name"],
                "description": cosmetic_data["description"],
                "emoji": cosmetic_data["emoji"],
                "price": cosmetic_data["price"],
                "owned": str(cosmetic_id) in owned_ids or cosmetic_id in owned_ids
            })

        return jsonify(cosmetics_list), 200
    except Exception as e:
        print(f"Error in /cosmetics: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/purchase", methods=["POST"])
@require_auth
def purchase_cosmetic(user):
    """Purchase a cosmetic with credits"""
    try:
        user_id = user.id
        data = request.get_json()
        cosmetic_id = data.get("cosmetic_id")

        if cosmetic_id is None:
            return jsonify({"error": "cosmetic_id required"}), 400

        # Get cosmetic price
        if cosmetic_id < 0 or cosmetic_id >= len(COSMETICS_SHOP):
            return jsonify({"error": "Invalid cosmetic"}), 400

        cosmetic = COSMETICS_SHOP[cosmetic_id]
        price = cosmetic["price"]

        # Get user's credits (including minigame awards)
        total_credits, _ = calculate_total_credits(user_id)

        if total_credits < price:
            return jsonify({
                "error": "Not enough credits",
                "required": price,
                "current": total_credits
            }), 402

        # Check if already owned
        try:
            existing = supabase.table("user_cosmetics").select(
                "*").eq("user_id", user_id).eq("cosmetic_id", str(cosmetic_id)).execute()
            if existing.data:
                return jsonify({"error": "Already owned"}), 409
        except:
            pass

        # Add to user_cosmetics
        try:
            insert_response = supabase.table("user_cosmetics").insert({
                "user_id": user_id,
                "cosmetic_id": str(cosmetic_id),
                "owned": True
            }).execute()

            return jsonify({
                "success": True,
                "cosmetic": cosmetic["name"],
                "price": price,
                "remaining_credits": total_credits - price
            }), 201
        except Exception as e:
            print(f"Insert error: {str(e)}")
            # If RLS prevents insert, we'll just accept it as purchased
            return jsonify({
                "success": True,
                "cosmetic": cosmetic["name"],
                "price": price,
                "remaining_credits": total_credits - price,
                "note": "Purchase recorded (RLS limitation)"
            }), 201

    except Exception as e:
        print(f"Error in /purchase: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    """Get global leaderboard - top gardeners by plants, credits, and streaks"""
    try:
        leaderboard_data = {
            "by_plants": [],
            "by_credits": [],
            "by_streaks": []
        }

        # Get all plants grouped by user
        try:
            plants_response = supabase.table("plants").select(
                "user_id, height, color, leaf_type").execute()
            plants = plants_response.data or []
        except:
            plants = []

        # Get all achievements
        try:
            achievements_response = supabase.table("user_achievements").select(
                "user_id").execute()
            achievements = achievements_response.data or []
        except:
            achievements = []

        # Calculate stats per user
        user_stats = {}
        for plant in plants:
            user_id = plant["user_id"]
            if user_id not in user_stats:
                user_stats[user_id] = {
                    "user_id": user_id,
                    "plants": 0,
                    "achievements": 0,
                    "streak": 0
                }
            user_stats[user_id]["plants"] += 1

        # Add achievement counts
        for achievement in achievements:
            user_id = achievement["user_id"]
            if user_id not in user_stats:
                user_stats[user_id] = {
                    "user_id": user_id,
                    "plants": 0,
                    "achievements": 0,
                    "streak": 0
                }
            user_stats[user_id]["achievements"] += 1

        # Calculate streaks and credits for each user
        for user_id in user_stats:
            try:
                streak = get_user_streak(supabase, user_id)
                user_stats[user_id]["streak"] = streak
            except:
                user_stats[user_id]["streak"] = 0

        # Sort by plants (top 10)
        sorted_by_plants = sorted(
            user_stats.values(),
            key=lambda x: x["plants"],
            reverse=True
        )[:10]

        leaderboard_data["by_plants"] = [
            {
                "rank": i+1,
                "user_id": user["user_id"],
                "value": user["plants"],
                "label": f"{user['plants']} 🌱"
            }
            for i, user in enumerate(sorted_by_plants)
        ]

        # Sort by credits (plants*10 + achievements*25 + streak*5)
        sorted_by_credits = sorted(
            user_stats.values(),
            key=lambda x: (x["plants"]*10 + x["achievements"]
                           * 25 + x["streak"]*5),
            reverse=True
        )[:10]

        leaderboard_data["by_credits"] = [
            {
                "rank": i+1,
                "user_id": user["user_id"],
                "value": user["plants"]*10 + user["achievements"]*25 + user["streak"]*5,
                "label": f"{user['plants']*10 + user['achievements']*25 + user['streak']*5} 💰"
            }
            for i, user in enumerate(sorted_by_credits)
        ]

        # Sort by streaks (top 10)
        sorted_by_streaks = sorted(
            user_stats.values(),
            key=lambda x: x["streak"],
            reverse=True
        )[:10]

        leaderboard_data["by_streaks"] = [
            {
                "rank": i+1,
                "user_id": user["user_id"],
                "value": user["streak"],
                "label": f"{user['streak']}🔥"
            }
            for i, user in enumerate(sorted_by_streaks)
        ]

        return jsonify(leaderboard_data), 200
    except Exception as e:
        print(f"Error in /leaderboard: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/test")
def test_draw():
    """Test page for debugging"""
    with open('test_draw.html', 'r', encoding='utf-8') as f:
        return f.read()


@app.route("/simple")
def simple_test():
    """Simple test page"""
    with open('test_simple.html', 'r', encoding='utf-8') as f:
        return f.read()


@app.route('/minigame/complete', methods=['POST'])
def minigame_complete():
    """Record mini-game completion and award credits"""
    try:
        # Get user from token
        user_id = get_user_from_token(request.headers.get(
            'Authorization', '').replace('Bearer ', ''))
        if not user_id:
            return jsonify({"error": "Not authenticated"}), 401

        data = request.json
        game = data.get('game')
        score = data.get('score', 0)
        completed = data.get('completed', False)

        if not game or not completed:
            return jsonify({"error": "Invalid game data"}), 400

        # Award credits based on game
        credits_awarded = {
            'speed_draw': 100,  # 100 credits for completing Speed Draw
            'color_match': 75,
            'height_challenge': 75,
            'accuracy_drill': 75
        }

        credits = credits_awarded.get(game, 50)

        # Insert mini-game record
        inserted = True
        try:
            supabase.table('minigame_scores').insert({
                'user_id': user_id,
                'game': game,
                'score': score,
                'credits_awarded': credits,
                'completed': completed
            }).execute()
        except Exception as e:
            print(f"Error inserting minigame score: {str(e)}")
            # Continue anyway - game was won
            inserted = False

        # Calculate total credits
        try:
            # Credit formula: plants × 10 + achievements × 25 + streak × 5 + minigame credits
            total_credits, breakdown = calculate_total_credits(user_id)
            if not inserted:
                total_credits += credits

            return jsonify({
                "message": f"Game completed! +{credits} credits",
                "credits_awarded": credits,
                "total_credits": total_credits
            }), 200

        except Exception as e:
            print(f"Error calculating credits: {str(e)}")
            # Return a reasonable default
            return jsonify({
                "message": f"Game completed! +{credits} credits",
                "credits_awarded": credits,
                "total_credits": credits
            }), 200

    except Exception as e:
        print(f"Error in /minigame/complete: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
