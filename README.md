# KrishiMitra — Smart Farm-to-Buyer Digital Marketplace (SIH26033)

KrishiMitra is a full-stack, AI-driven agricultural commerce platform that directly connects farmers with wholesale buyers, retailers, and APMC mandis. It eliminates middleman commissions while offering live APMC mandi benchmarks, AI price forecasting, computer-vision produce quality grading, Vehicle Routing Problem (VRP) logistics consolidation, and escrow-secured payouts.

---

## 📥 How to Download This Project from Google AI Studio

You can download the complete project codebase to your local system anytime:

1. **Download as ZIP**:
   - In the top-right header menu of the AI Studio interface, click on the **Settings (⚙️) / Project Menu**.
   - Click **Export to ZIP** or **Download Code**.
   - Extract the downloaded `.zip` file into a folder on your computer.

2. **Or Export to GitHub**:
   - In the same menu, click **Export to GitHub**.
   - Choose your repository name and clone it to your machine using:
     ```bash
     git clone <your-github-repo-url>
     cd krishimitra
     ```

---

## 💻 Prerequisites for Running Locally

Before running the application on your computer, ensure you have:
- **Node.js** (v18.0.0 or higher / recommended: Node.js 20 LTS): [Download Node.js](https://nodejs.org/)
- **npm** (comes packaged with Node.js) or **yarn** / **pnpm** / **bun**
- A modern web browser (Google Chrome, Firefox, Safari, Edge)

---

## ⚡ Quick 1-Click Launch Scripts

We have provided automated start scripts that automatically install dependencies and launch the dev server:

### For macOS / Linux:
```bash
chmod +x start.sh
./start.sh
```

### For Windows:
Double-click `start.bat` or run in Command Prompt / PowerShell:
```cmd
start.bat
```

---

## 🛠️ Step-by-Step Manual Setup

If you prefer to run commands manually:

### 1. Open Terminal / Command Prompt
Navigate to the extracted project root folder:
```bash
cd /path/to/krishimitra
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# On macOS / Linux
cp .env.example .env

# On Windows (Command Prompt)
copy .env.example .env
```

*(Optional)* If you want live Gemini AI quality assessment and price analysis, add your Gemini API key in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Note**: Even without an API key, the system has built-in local heuristic fallback engines for quality inspection, VRP route optimization, and price forecasts.

### 3. Install Project Dependencies
```bash
npm install
```

### 4. Start the Application in Development Mode
```bash
npm run dev
```

### 5. Access the Web Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🚀 Building & Running for Production

To create an optimized, bundled standalone production build:

```bash
# 1. Build client bundle and compiled server
npm run build

# 2. Start production server
npm start
```
The production server will serve both the backend API and frontend SPA at `http://localhost:3000`.

---

## 🔑 Pre-Configured Test Accounts (1-Tap Login)

You can sign in using OTP verification (Default test code: **`1234`**) or use the 1-Tap quick entry buttons on the login screen:

| Role | Name | Phone / Login | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **👨‍🌾 Farmer** | Rameshwar Patidar | `+91 98260 12345` | Sell harvest, view APMC rates, AI quality grader, incoming orders & bank payouts |
| **🛒 Wholesale Buyer** | Bhopal Fresh Mart | `+91 98261 44556` | Wholesale produce catalog, instant escrow checkout, VRP route & delivery planner |
| **⚖️ APMC Admin** | MP Mandi Board | `+91 75525 00000` | State mandi rates supervision, logistics fleet dispatch, trade audits |

---

## 🚀 Deploying to Vercel (1-Click Ready)

KrishiMitra is fully configured out-of-the-box for seamless Vercel deployment:

1. **Push to GitHub**:
   - Push this repository to your GitHub account (or export via AI Studio Settings -> Export to GitHub).
2. **Import into Vercel**:
   - In [Vercel Dashboard](https://vercel.com), click **Add New... -> Project** and select your KrishiMitra repo.
   - Vercel will automatically detect `vercel.json` with the Vite framework, `dist` output directory, and the `/api/index.ts` serverless function.
3. **Set Environment Variables**:
   - Under **Project Settings -> Environment Variables**, add:
     - `GEMINI_API_KEY`: Your Gemini API key (from [Google AI Studio](https://aistudio.google.com/app/apikey)).
     - `JWT_SECRET`: Any secure random string (e.g., `krishimitra-jwt-secret-2026`).
     - `DATA_GOV_IN_API_KEY`: *(Optional)* If syncing live from data.gov.in.
4. **Deploy**:
   - Click **Deploy**. Both the Vite client-side SPA and the `/api` serverless backend will build and deploy instantly with full route rewrites, CORS support, and built-in ICAR agronomist engine fallback.

---

## 📁 Key Project Architecture

```text
├── index.html               # Main entry HTML
├── metadata.json            # AI Studio applet specifications
├── package.json             # Scripts & dependencies
├── server.ts                # Express backend + Vite middleware entry point
├── server/
│   ├── routes/              # Modular backend REST API endpoints
│   │   ├── api.ts           # Mandi rates, listings, orders, AI endpoints
│   │   └── vrp.ts           # Vehicle Routing Problem optimization engine
│   └── data/                # Mandi benchmarks & seed database
├── src/
│   ├── App.tsx              # Root Router with strict role guards
│   ├── components/          # Reusable UI widgets, Navbar, Badges
│   ├── context/             # AuthContext with role isolation
│   ├── pages/               # Application view modules:
│   │   ├── LoginPage.tsx          # Role declaration & phone auth
│   │   ├── HarvestPlacementPage.tsx # Farmer 1-tap produce listing
│   │   ├── BuyerBrowsePage.tsx    # Wholesale produce marketplace
│   │   ├── ListingDetailPage.tsx  # Product details & escrow purchase
│   │   ├── MandiRatesPage.tsx     # Live Agmarknet mandi rates
│   │   ├── RouteOptimizerPage.tsx # VRP logistics & delivery map
│   │   ├── PricePredictorPage.tsx # 30-day AI price forecasting
│   │   ├── QualityPredictorPage.tsx # AI camera grading module
│   │   └── OrdersPage.tsx         # Escrow order management
│   └── types.ts             # Shared TypeScript schemas
├── start.sh                 # Linux/macOS 1-click startup script
└── start.bat                # Windows 1-click startup script
```

---

## 🤝 Support & License

Built with ❤️ for direct farm-to-table commerce, APMC transparency, and zero-commission farmer empowerment.
