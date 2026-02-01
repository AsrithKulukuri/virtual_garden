# Virtual Doodle Garden 🌿

A fully functional, production-ready mobile-first web application where users draw doodles on a canvas, which are analyzed by an AI-like algorithm and converted into unique digital plants stored in a Supabase database.

## Features

✨ **Canvas Drawing** - Touch-enabled drawing with mouse and touch support
📱 **Mobile-First Design** - Responsive layout optimized for smartphones and tablets
🌱 **AI Plant Generation** - Doodles are analyzed and converted to unique digital plants
🗄️ **Supabase Integration** - Persistent plant storage with PostgreSQL backend
🎨 **Nature-Inspired UI** - Calm green palette with smooth animations
⚡ **Production Ready** - Complete, deployable application with no placeholders

## Tech Stack

- **Backend**: Python, Flask 3.1
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Drawing**: HTML5 Canvas with touch/mouse support
- **Database**: Supabase PostgreSQL
- **Image Processing**: Pillow (PIL)
- **Environment**: python-dotenv

## Project Structure

```
virtual-garden/
├── app.py                 # Flask backend with routes
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables (Supabase credentials)
├── .gitignore            # Git ignore rules
│
├── templates/
│   ├── index.html        # Drawing page
│   └── garden.html       # Garden display page
│
└── static/
    ├── css/
    │   └── style.css     # Mobile-first responsive styling
    └── js/
        ├── draw.js       # Canvas drawing logic
        └── garden.js     # Plant display & visualization
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Supabase account with a PostgreSQL database

### Step 1: Create Supabase Table

In your Supabase dashboard, run this SQL to create the plants table:

```sql
CREATE TABLE plants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    height INT NOT NULL,
    branches INT NOT NULL,
    leaf_type TEXT NOT NULL,
    color TEXT NOT NULL,
    growth_stage INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Set Up Environment

1. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Copy your **Project URL** (Supabase URL)
   - Copy your **service_role key** (starts with `sb_secret_`)

2. Update `.env` file in the project root:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=sb_secret_your_key_here
```

### Step 3: Install Dependencies

```bash
# Navigate to project directory
cd virtual-garden

# Create virtual environment (optional but recommended)
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Run the Application

```bash
python app.py
```

The app will start on `http://127.0.0.1:5000`

## How It Works

### Drawing Flow
1. User visits `/` (drawing page)
2. User draws on the canvas using mouse or touch
3. User clicks **"Plant 🌿"** button
4. Canvas image is sent to backend as Base64

### Backend Processing
1. Flask endpoint `/generate` receives the Base64 image
2. Pillow converts image to grayscale
3. Algorithm analyzes pixel darkness:
   - **Height**: Darker doodles → Taller plants (100-400px)
   - **Branches**: Random 1-5 branches per plant
   - **Leaf Type**: Random choice (round, sharp, or heart)
   - **Color**: Random shade of green
   - **Growth Stage**: Always 1 (initial growth)
4. Plant data is inserted into Supabase
5. Plant JSON is returned to frontend

### Garden Display
1. User is redirected to `/garden` page
2. JavaScript fetches all plants via `/plants` endpoint
3. Plants are rendered with CSS-based visualizations:
   - Stem height matches the `height` attribute
   - Branches are positioned along the stem
   - Leaves are styled based on `leaf_type`
   - Colors are applied from the `color` attribute
4. Plants are displayed in a responsive grid

## API Endpoints

### GET `/`
Returns the drawing page (index.html)

### GET `/garden`
Returns the garden page (garden.html)

### POST `/generate`
Generates and stores a new plant from a doodle

**Request Body:**
```json
{
    "image": "data:image/png;base64,iVBORw0KGgoAAAAN..."
}
```

**Response (201 Created):**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "height": 245,
    "branches": 3,
    "leaf_type": "round",
    "color": "#3d6b1f",
    "growth_stage": 1,
    "created_at": "2026-02-01T21:20:00Z"
}
```

### GET `/plants`
Returns all plants ordered by newest first

**Response (200 OK):**
```json
[
    {
        "id": "...",
        "height": 200,
        "branches": 2,
        "leaf_type": "sharp",
        "color": "#2d5016",
        "growth_stage": 1,
        "created_at": "2026-02-01T21:15:00Z"
    },
    ...
]
```

## Responsive Design

- **Mobile (< 768px)**: Single column, touch-optimized buttons, full-width canvas
- **Tablet (768px - 1024px)**: 2-column grid, adjusted spacing
- **Desktop (> 1024px)**: 3-column grid, optimized font sizes

## Leaf Types

The algorithm generates three types of leaves using CSS:
- **Round**: Circular leaves (most organic)
- **Sharp**: Pointed leaf shape (energetic)
- **Heart**: Heart-shaped leaves (cute)

## Green Color Palette

Plants are randomly assigned from 7 nature-inspired green shades:
- `#2d5016` - Dark green
- `#3d6b1f` - Forest green
- `#4a7c2c` - Sage green
- `#5fa33c` - Lime green
- `#2e7d32` - Garden green
- `#558b2f` - Olive green
- `#1b5e20` - Deep green

## Security

✅ **Supabase Secret Key Protection**
- Only backend uses the secret key
- Frontend never accesses `sb_secret_` credentials
- `.env` file is gitignored

✅ **Environment Variables**
- All secrets are loaded from `.env`
- Never hardcoded in the application
- Safe for deployment

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Troubleshooting

### Server won't start
```bash
# Make sure port 5000 is not in use
# Check if all dependencies are installed
pip install -r requirements.txt
```

### Plants not saving
1. Check `.env` file has correct Supabase credentials
2. Verify `plants` table exists in Supabase
3. Check browser console for error messages

### Canvas not drawing
1. Ensure JavaScript is enabled
2. Try refreshing the page
3. Check browser console for errors

### CORS issues
The backend serves both frontend and API on the same origin, so CORS is not needed.

## Performance Tips

- Canvas drawing is optimized for smooth performance
- Image processing uses Pillow's efficient algorithms
- Database queries are indexed on `created_at`
- CSS animations use GPU acceleration

## Future Enhancements

- 🌤️ Plant growth stages over time
- 🎯 User authentication & personal gardens
- 💾 Plant sharing & export
- 🤖 ML-based doodle analysis
- 🌐 WebSocket real-time garden updates
- 📊 Statistics and achievements

## License

MIT License - Feel free to use and modify!

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify Supabase table structure
4. Check `.env` file configuration

---

**Happy gardening! 🌿**
