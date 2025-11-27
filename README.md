# EB Automation - Essential Blocks Accessibility Testing Suite

**Automated accessibility snapshot testing and visual regression monitoring for Essential Blocks WordPress plugin demo pages.**

---

## 📋 Overview

EB Automation is a Playwright-based testing framework designed to capture, validate, and monitor accessibility snapshots and full-page screenshots of 75+ Essential Blocks demo pages. The system ensures accessibility compliance and detects visual/structural regressions across all block demos.

### Key Features

- ✅ **Accessibility Tree Snapshots** - Captures browser accessibility state using Playwright's native API
- 📸 **Full-Page Screenshots** - Visual documentation of all demo pages (1920x1080 viewport)
- 🧊 **Animation Stabilization** - Freezes CSS animations/transitions for consistent snapshots
- 🔄 **Batch Processing** - Automated processing of all 75 demo URLs
- ✅ **Regression Detection** - Validates current state against baseline snapshots
- 🚀 **Smart Loading Strategy** - Multi-tier page loading with image/font/lazy-load handling

---

## 🏗️ Project Structure

```
EB automation/
├── snapshot_script.js          # Core snapshot generation script
├── validate_snapshots.js       # Snapshot validation & comparison script
├── update_snapshot.sh          # Batch processing shell script
├── urls.txt                    # 75 Essential Blocks demo URLs
├── package.json                # Node.js dependencies
├── snapshots/                  # Generated snapshots directory
│   ├── *_accessibility_snapshot.txt  # Accessibility tree JSON files
│   └── *_screenshot.png              # Full-page PNG screenshots
└── README.md                   # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Setup

```bash
# Install dependencies
npm install

# Make shell script executable
chmod +x update_snapshot.sh
```

---

## 📖 Usage

### 1. Generate Snapshot for Single URL

```bash
node snapshot_script.js "https://essential-blocks.com/demo/button/"
```

**Output:**
- `snapshots/essential-blocks_com_demo_button__accessibility_snapshot.txt`
- `snapshots/essential-blocks_com_demo_button__screenshot.png`

### 2. Generate Snapshots for All URLs

```bash
./update_snapshot.sh
```

**Processes all 75 URLs from `urls.txt` with 1-second pause between requests.**

### 3. Validate Snapshots (Detect Changes)

```bash
node validate_snapshots.js
```

**Compares current accessibility snapshots with saved baselines and reports differences.**

### 4. Custom URL File

```bash
# Use a different URL list
URL_FILE=custom_urls.txt ./update_snapshot.sh
URL_FILE=custom_urls.txt node validate_snapshots.js
```

---

## 🔧 Technical Details

### Snapshot Generation Process

1. **Multi-Tier Page Loading**
   - Primary: `networkidle` (waits until no network requests for 500ms)
   - Fallback: `domcontentloaded` (DOM ready)
   - Final: `load` (basic load event)

2. **Content Stabilization**
   - ✅ Wait for all images to load (3s timeout per image)
   - ✅ Wait for web fonts to load (2s timeout)
   - ✅ Trigger lazy-loaded content via scrolling
   - ✅ Wait for dynamic JavaScript content (2s)

3. **Animation Freeze**
   - Disables all CSS animations and transitions
   - Pauses animation playState on all elements
   - Ensures consistent snapshots for animated blocks

4. **Capture**
   - Accessibility tree snapshot (JSON format)
   - Full-page screenshot (PNG, 1920x1080 viewport)

### File Naming Convention

URLs are sanitized to create consistent filenames:

```
https://essential-blocks.com/demo/button/
  ↓
essential-blocks_com_demo_button__accessibility_snapshot.txt
essential-blocks_com_demo_button__screenshot.png
```

---

## 📊 Snapshot Statistics

- **Total URLs**: 75 Essential Blocks demo pages
- **Accessibility Snapshots**: 75 JSON files
- **Screenshots**: 75 PNG files
- **Total Snapshots**: 150 files

---

## 🛠️ Configuration

### Viewport Settings

Default viewport: **1920x1080** (desktop)

To change, edit both `snapshot_script.js` and `validate_snapshots.js`:

```javascript
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 }
});
```

### Timeouts

- **Default timeout**: 30 seconds
- **Navigation timeout**: 30 seconds
- **Networkidle timeout**: 15 seconds
- **Domcontentloaded timeout**: 10 seconds
- **Image load timeout**: 3 seconds per image
- **Font load timeout**: 2 seconds

### Animation Freeze

CSS injected to disable animations:

```css
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  animation-play-state: paused !important;
  transition-duration: 0s !important;
  animation-duration: 0s !important;
}
```

---

## 🧪 Testing Workflow

### Initial Baseline Creation

```bash
# Generate baseline snapshots for all URLs
./update_snapshot.sh
```

### Continuous Validation

```bash
# After code changes, validate against baseline
node validate_snapshots.js
```

**Output Examples:**
- ✅ `Snapshot is valid for https://essential-blocks.com/demo/button/`
- ❌ `Snapshot is different for https://essential-blocks.com/demo/accordion/`
- ⚠️ `No snapshot found for https://essential-blocks.com/demo/new-block/`

### Updating Baselines

```bash
# Regenerate specific URL
node snapshot_script.js "https://essential-blocks.com/demo/accordion/"

# Or regenerate all
./update_snapshot.sh
```

---

## 📝 URL Management

### Adding New URLs

Edit `urls.txt`:

```bash
# Add new demo URL
echo "https://essential-blocks.com/demo/new-block/" >> urls.txt
```

### URL File Format

- One URL per line
- Lines starting with `#` are treated as comments
- Empty lines are skipped
- Leading/trailing whitespace is trimmed

**Example:**

```
# Essential Blocks Core Demos
https://essential-blocks.com/demo/button/
https://essential-blocks.com/demo/accordion/

# Advanced Blocks
https://essential-blocks.com/demo/advanced-heading/
```

---

## 🐛 Troubleshooting

### Issue: "Snapshot is different" for animated blocks

**Solution:** The animation freeze feature should handle this. If issues persist:

1. Regenerate the baseline snapshot:
   ```bash
   node snapshot_script.js "https://essential-blocks.com/demo/advanced-heading/"
   ```

2. Validate again:
   ```bash
   echo "https://essential-blocks.com/demo/advanced-heading/" > test.txt
   URL_FILE=test.txt node validate_snapshots.js
   ```

### Issue: Timeout errors

**Solution:** Increase timeouts in both scripts:

```javascript
page.setDefaultTimeout(60000);  // 60 seconds
page.setDefaultNavigationTimeout(60000);
```

### Issue: Images not loading

**Solution:** The script already handles this with fallback strategies. Check network connectivity.

---

## 🔍 Use Cases

### 1. Accessibility Regression Testing
Monitor accessibility tree changes across Essential Blocks updates.

### 2. Visual Regression Testing
Compare screenshots to detect unintended visual changes.

### 3. WCAG Compliance Monitoring
Ensure accessibility structure remains compliant with WCAG standards.

### 4. Documentation
Visual and structural documentation of all Essential Blocks demos.

### 5. QA Automation
Automated testing as part of CI/CD pipeline for Essential Blocks releases.

---

## 📦 Dependencies

- **playwright** (^1.55.0) - Browser automation framework

---

## 🔐 Security Notes

- No sensitive data is stored in snapshots
- All URLs are public Essential Blocks demo pages
- No authentication required
- Safe for CI/CD environments

---

## 📄 License

ISC

---

## 👤 Author

WordPress Security Engineer & QA Professional

---

## 🤝 Contributing

This is an internal QA automation tool for Essential Blocks accessibility testing.

---

## 📞 Support

For issues or questions, contact the Essential Blocks QA team.

---

**Last Updated:** 2025-11-27
