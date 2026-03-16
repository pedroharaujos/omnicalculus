## OMNICALCULUS

Universal engineering calculator with a **Matrix-style UI**, built as a single-page web app around a small library of classic formulas (heat transfer, fluid mechanics, thermodynamics, math, and basic electrical engineering).

### Live View / Usage

- **Open** `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
- Make sure `math.js` (from [math.js](https://mathjs.org)) is available next to `index.html` or served from a CDN.
  - Example CDN include:
  
```html
<script src="https://cdn.jsdelivr.net/npm/mathjs@11/lib/browser/math.js"></script>
```

### Features

- **Field selection**: pick a field like Heat Transfer, Fluid Mechanics, Thermodynamics, Electrical Engineering, or Mathematics.
- **Formula selection**: choose a formula from the curated list for that field (e.g. Fourier’s Law, Reynolds Number, Ideal Gas Law, Ohm’s Law, Quadratic formula).
- **Smart inputs**:
  - Enter values with or without units (e.g. `5 W/m·K`, `2 m^2`, `10 bar`, `25 °C`, etc.) using math.js unit syntax.
  - Leave exactly **one** variable blank to solve for it.
- **Unit-aware solving**:
  - Uses math.js to parse units, solve the equation, and report results in sensible base units.
  - Shows dimensionless outputs where appropriate (e.g. Reynolds number).
- **Result unit conversion**:
  - After solving, you can convert the result into another unit (e.g. `kW`, `mm²`, `bar`, `psi`) using the conversion input.
- **Matrix rain aesthetic**:
  - Full-screen green “matrix rain” background, scanlines, and CRT-style glow inspired by terminal UIs.

### Project Structure

- `index.html` – main SPA containing:
  - UI layout, CSS for Matrix/CRT theme.
  - Embedded JavaScript app, including:
    - `FORMULA_DB`: list of supported formulas and variables.
    - Input handling, validation, and math.js-based solving logic.
    - Result formatting and unit conversion helpers.
    - Matrix rain background renderer.
- `math.js` – external dependency (math.js browser bundle, not committed here).

### Development Notes

- **No build step**: everything is plain HTML + JS + CSS. You can:
  - Double-click `index.html`, or
  - Serve with a static server (e.g. `npx serve .`, `python -m http.server`, etc.) for cleaner local testing.
- **Adding new formulas**:
  - Extend the `FORMULA_DB` array in `index.html` with new entries:
    - `field`: category (string).
    - `name`: human-readable formula name.
    - `formula`: string expression using variables and `=` as needed.
    - `variables`: array of `{ symbol, name, unit }`.
  - Ensure:
    - Variable symbols in `formula` match `variables[*].symbol`.
    - `unit` values use valid math.js unit names (e.g. `watt`, `m^2`, `kg / m^3`, etc.).

### Tech Stack

- **Frontend**: vanilla HTML, CSS, and JavaScript (no framework).
- **Math engine**: [math.js](https://mathjs.org) for parsing expressions, units, and solving.

### Future Ideas

- More engineering domains (controls, structural, materials).
- Multi-solution handling for equations with multiple roots (e.g. full quadratic support).
- Presets and bookmarks for frequently used calculations.
- Optional dark/light theme variations of the Matrix UI.

