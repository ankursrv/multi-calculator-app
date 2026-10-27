# Multi Calculator & Kirana Smart App 📱✨

An all-in-one modern, high-performance mobile and web calculator app built with **React Native** and **Expo**. Features a specialized Kirana / Bhav (Price ↔ Weight) calculator alongside everyday mathematical and financial utility tools.

---

## 🌟 Key Features

### 1. 🛍️ Kirana / Bhav Calculator (Price ↔ Weight)
- **₹ ➔ Wazan (Price to Weight)**: Calculate exact grams for any budget (e.g., Sugar @ ₹60/kg, ₹10 budget = **166.67g**).
- **Wazan ➔ ₹ (Weight to Price)**: Get instant pricing for any weight (e.g., 250g @ ₹60/kg = **₹15.00**).
- **Packet Deal Comparison (Sasta Kaun Sa?)**: Compare two packet sizes & prices to see which gives more value and calculate % savings.
- **Shopping Cart / Bill Estimate**: Save items as you calculate to track your total shopping cart bill.

### 2. 🔢 Standard Calculator
- Clean, responsive glassmorphism/dark theme keypad.
- Supports addition, subtraction, multiplication, division, percentage, sign toggle, brackets, and full calculation history.

### 3. 🏷️ Discount & GST Calculator
- Calculate discounted price from MRP with instant savings banner.
- Add or evaluate GST brackets (0%, 5%, 12%, 18%, 28%).
- Quick % chips for fast calculation.

### 4. ⚖️ Unit Converter
- **Weight**: kg, g, mg, lb, oz, quintal.
- **Length**: km, m, cm, mm, ft, in, yard.
- **Volume**: L, ml, gallon.
- Instant 1-tap swap feature.

### 5. 🏦 Loan & EMI Calculator
- Calculate monthly EMI, total interest, and total payable amount.
- Visual breakdown ratio bar of Principal vs Interest.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/ankursrv/multi-calculator-app.git

# Navigate to project folder
cd multi-calculator-app

# Install dependencies
npm install
```

### Running Locally

#### 📱 Mobile (Expo Go)
```bash
npm start
```
Scan the QR code displayed in the terminal with the **Expo Go** app on your Android or iOS device.

#### 🌐 Web Browser
```bash
npm run web
```
Opens the app directly in your browser at `http://localhost:8081`.

---

## 📦 Building Standalone APK (Android)

Using EAS (Expo Application Services) Cloud Build:
```bash
npx eas-cli build -p android --profile preview
```

---

## 🛠️ Built With
- **React Native** & **Expo SDK 58**
- **Expo Vector Icons** (Ionicons, MaterialCommunityIcons)
- **React Native Safe Area Context**
- **React Native Web**

---

## 📄 License
MIT License


 ## 📄 Direct installable Android APK build trigger karna.
 🚀 npx eas-cli build -p android --profile preview --no-wait

 # Note: Agar aapko terminal me hi wait karna hai jab tak build complete na ho:
npx eas-cli build -p android --profile preview