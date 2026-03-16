// --------- Formula Database (Static, from MVP) ------------------
const FORMULA_DB = [
    {
        field: "Heat Transfer",
        name: "Fourier's Law of Heat Conduction",
        formula: "Q = k * A * dT / L",
        description: "Heat transfer rate through a plane wall.",
        variables: [
            {symbol: "Q", name: "Heat transfer rate", unit: "watt"},
            {symbol: "k", name: "Thermal conductivity", unit: "watt / meter / kelvin"},
            {symbol: "A", name: "Area", unit: "m^2"},
            {symbol: "dT", name: "Temperature difference", unit: "kelvin"},
            {symbol: "L", name: "Thickness or length", unit: "meter"},
        ]
    },
    {
        field: "Mathematics",
        name: "Quadratic Formula",
        formula: "x = (-b + sqrt(b^2 - 4*a*c)) / (2*a)",
        description: "Solution to ax² + bx + c = 0 (only x₁ branch).",
        variables: [
            {symbol: "a", name: "Quadratic coefficient", unit: ""},
            {symbol: "b", name: "Linear coefficient", unit: ""},
            {symbol: "c", name: "Constant term", unit: ""},
            {symbol: "x", name: "Root", unit: ""},
        ]
    },
    {
        field: "Fluid Mechanics",
        name: "Reynolds Number",
        formula: "Re = rho * v * D / mu",
        description: "Dimensionless Reynolds number for pipe flow.",
        variables: [
            {symbol: "Re", name: "Reynolds number", unit: ""},
            {symbol: "rho", name: "Density", unit: "kg / m^3"},
            {symbol: "v", name: "Velocity", unit: "m / s"},
            {symbol: "D", name: "Pipe diameter", unit: "meter"},
            {symbol: "mu", name: "Dynamic viscosity", unit: "Pa * s"},
        ]
    },
    {
        field: "Electrical Engineering",
        name: "Ohm's Law",
        formula: "V = I * R",
        description: "Basic Ohm's Law: Voltage, Current, Resistance",
        variables: [
            {symbol: "V", name: "Voltage", unit: "volt"},
            {symbol: "I", name: "Current", unit: "ampere"},
            {symbol: "R", name: "Resistance", unit: "ohm"},
        ]
    },
    {
        field: "Thermodynamics",
        name: "Ideal Gas Law",
        formula: "P * V = n * R * T",
        description: "Relates pressure, volume, and temperature of an ideal gas.",
        variables: [
            {symbol: "P", name: "Pressure", unit: "pascal"},
            {symbol: "V", name: "Volume", unit: "m^3"},
            {symbol: "n", name: "Moles of gas", unit: "mole"},
            {symbol: "R", name: "Gas constant", unit: "joule / mole / kelvin"},
            {symbol: "T", name: "Temperature", unit: "kelvin"},
        ]
    }
];

function uniq(arr) { return [...new Set(arr)]; }

function listFields() {
    return uniq(FORMULA_DB.map(f => f.field)).sort();
}

function formulasForField(field) {
    return FORMULA_DB.filter(f => f.field === field);
}

function texifyFormulaForDisplay(formula, variables) {
    // Only for pretty printing. For MVP show as text but sub numbers.
    let s = formula;
    variables.forEach(v => {
        if (v.symbol.length === 1 || !(/[a-z]/.test(v.symbol[1]||''))) return;
        // for things like dT, optionally bold
        s = s.replaceAll(v.symbol, `<span style="color:var(--neo2)">${v.symbol}</span>`);
    });
    return s.replaceAll('*', '×').replaceAll('/', '÷');
}

// ----------------- UI Population ------------------------
const fieldSel = document.getElementById('fieldsel');
const forSel = document.getElementById('forsel');
const formulaDesc = document.getElementById('formula-desc');
const formulaStr = document.getElementById('formula-str');
const varsForm = document.getElementById('varsform');
const varsInputs = document.getElementById('varsinputs');
const varsErr = document.getElementById('vars-err');
const resultBox = document.getElementById('resultbox');

const convBox = document.getElementById('conv-box');
const convInput = document.getElementById('convunit');
const convBtn = document.getElementById('convgo');
const convErr = document.getElementById('conv-err');
const convResult = document.getElementById('conv-result');

// Fill fields
function populateFields() {
    fieldSel.innerHTML = "";
    for (const f of listFields()) {
        const opt = document.createElement('option');
        opt.value = f; opt.textContent = f;
        fieldSel.appendChild(opt);
    }
}
function populateFormulas() {
    forSel.innerHTML = "";
    formulasForField(fieldSel.value).forEach((form, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = form.name;
        forSel.appendChild(opt);
    });
}
function updateFormulaDetails() {
    const form = formulasForField(fieldSel.value)[forSel.value];
    formulaDesc.textContent = form.description || "";
    formulaStr.innerHTML = texifyFormulaForDisplay(form.formula, form.variables);
    // Build variables
    varsInputs.innerHTML = "";
    resultBox.textContent = "";
    convBox.style.display = "none";
    convErr.style.display = "none";
    convResult.textContent = "";
    for (const v of form.variables) {
        const row = document.createElement('div');
        row.style.marginBottom = "7px";
        row.innerHTML = `
          <label for="var_${v.symbol}">
             <span class="omni-varname">${v.name}</span> [${v.symbol}]
          </label>
          <input id="var_${v.symbol}" name="var_${v.symbol}" type="text"
                placeholder="value${v.unit ? ' ('+v.unit+')' : ''}" style="width:90%;">
        `;
        varsInputs.appendChild(row);
    }
    varsErr.style.display = "none";
}

// Ensure at most one variable is missing
function getFormValues(form) {
    // Return: known: {symbol: mathjs unit/number}, unknown: [symbol]
    let values = {}, unknowns = [];
    const vars = formulasForField(fieldSel.value)[forSel.value].variables;
    for (const v of vars) {
        let val = form['var_' + v.symbol].value.trim();
        if (!val) { unknowns.push(v.symbol); continue; }
        try {
            values[v.symbol] = v.unit ?
                math.unit(val) : 
                parseFloat(val); // for dimensionless
        } catch(e) {
            throw new Error(`Invalid value or unit for ${v.symbol}: "${val}"`);
        }
    }
    return {values, unknowns};
}

// ------- CALCULATION CORE (Solve for unknown using math.js) ------
function solveFormula() {
    resultBox.innerHTML = '';
    varsErr.style.display = "none";
    convBox.style.display = "none";
    convErr.style.display = "none";
    convResult.textContent = "";
    const field = fieldSel.value;
    const formula = formulasForField(field)[forSel.value].formula;
    const vars = formulasForField(field)[forSel.value].variables;

    // Get values and unknowns
    let vals, unknowns;
    try {
        ({ values: vals, unknowns } = getFormValues(varsForm));
    } catch(e) {
        varsErr.textContent = e.message;
        varsErr.style.display = "block";
        return false;
    }
    if (unknowns.length !== 1) {
        varsErr.textContent = "Exactly one variable should be left blank as unknown.";
        varsErr.style.display = "block";
        return false;
    }
    const unknown = unknowns[0];
    // Compose an equation for math.js: substitute knowns, solve for unknown
    // We'll treat '=' as equality, and parse for left/right of '='
    let eqLHS, eqRHS;
    if (formula.includes('=')) {
        [eqLHS, eqRHS] = formula.split('=').map(x => x.trim());
    } else {
        eqLHS = unknown;
        eqRHS = formula;
    }
    let eqn = `${eqLHS} - (${eqRHS})`; // so that eqn == 0
    try {
        // substitute knowns into eqn
        // Prepare scope: known variables as number if dimensionless, as unit if not
        let scope = {};
        for (const v of vars) {
            if (vals[v.symbol] !== undefined) {
                scope[v.symbol] = vals[v.symbol];
            }
        }
        // math.js: solve symbolically
        // Only one unknown supported per call. Use mathjs' "solve".
        // For unit support, convert all input units into SI
        let numericEqn = eqn;
        for (const v of vars) {
            if (v.symbol !== unknown && vals[v.symbol] !== undefined) {
                if (v.unit) {
                    // Substitute with SI (math.evaluate handles math.unit objects)
                    // mathjs auto-units if operated
                    numericEqn = numericEqn.replaceAll(
                        new RegExp(`\\b${v.symbol}\\b`, "g"),
                        `(${vals[v.symbol].toString()})`
                    );
                } else {
                    numericEqn = numericEqn.replaceAll(
                        new RegExp(`\\b${v.symbol}\\b`, "g"),
                        vals[v.symbol]
                    );
                }
            }
        }
        // Now, solve for unknown
        // Use math.simplify if needed, then isolate unknown
        // For quadratic: use directly mathjs' 'solve' on the original equation if unknown on both sides.
        let result;
        if (formula.includes('sqrt') || /(b|a|c)[^a-z]/.test(unknown)) {
            // This handles quadratic, use math.js 'solve'
            result = math
                .evaluate(`solve(${eqn}, ${unknown})`);
            // Choose first real solution
            if (Array.isArray(result)) {
                result = result.find(sol => !sol.im || sol.im===0) || result[0];
            }
        } else {
            // Otherwise, evaluate
            let solved = math.simplify(math.parse(numericEqn));
            // Move all to one side (should be linear or rearrangable)
            result = math.solveLinearSystem(solved, unknown);
            if (Array.isArray(result)) {
                result = result[0];
            }
        }
        // For units: assign variable unit back
        let outvar = vars.find(v => v.symbol === unknown);
        let resUnitStr = outvar.unit || '';
        let mag = result, displayNum = '', asUnit = '';
        if (resUnitStr) {
            try {
                // Infer unit from mathjs expression explenation: we can try to parse in units of target
                let finalval = math.unit(mag, resUnitStr);
                displayNum = `${Number(finalval.toNumber(resUnitStr)).toPrecision(7)} ${finalval.formatUnits()}`;
                asUnit = finalval;
            } catch(e) {
                // could not apply declared unit, fallback to number only
                displayNum = `${Number(mag).toPrecision(6)} (units: ${resUnitStr})`;
                asUnit = null;
            }
        } else {
            displayNum = `${Number(mag).toPrecision(7)} (dimensionless)`;
            asUnit = mag;
        }
        resultBox.innerHTML = `<b>${unknown}</b> (${outvar.name}): <span style="color:var(--neo2)">${displayNum}</span>`;
        // Enable conversion box:
        if (asUnit && resUnitStr) {
            convBox.style.display = "";
            convBox.dataset.lastval = asUnit.toString();
            convBox.dataset.baseunit = resUnitStr;
            convResult.textContent = "";
            convInput.value = "";
        }
    } catch(e) {
        varsErr.textContent = "Error: " + (e.message || e);
        varsErr.style.display = "block";
        return false;
    }
    return false; // prevent form submit
}

varsForm.onsubmit = (e) => { e.preventDefault(); solveFormula(); };
fieldSel.onchange = () => {
    populateFormulas();
    forSel.selectedIndex = 0;
    updateFormulaDetails();
};
forSel.onchange = updateFormulaDetails;

// --------- Conversion logic ---------
convBtn.onclick = (e) => {
    e.preventDefault();
    convErr.style.display = "none";
    convResult.textContent = "";
    const inputUnit = convInput.value.trim();
    if (!inputUnit) return;
    const lastVal = convBox.dataset.lastval;
    const baseUnit = convBox.dataset.baseunit;
    try {
        let v = math.unit(lastVal);
        let out = v.to(inputUnit);
        convResult.textContent = v.format({precision: 7}) + " = "
            + out.format({precision: 7});
    } catch(err) {
        convErr.textContent = "Could not convert unit: " + err.message;
        convErr.style.display = "block";
    }
};

// ----------- Init UI ---------------
populateFields();
populateFormulas();
updateFormulaDetails();

// --------------- Matrix Rain Background (OMNICODEX-style) ---------------
(function matrixRain() {
    const canvas = document.getElementById('matrixRain');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    let running = true;
    let fontSize = 16;
    let columns = 0;
    let drops = [];
    let speeds = [];

    function resize() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        fontSize = Math.max(12, Math.min(16, Math.floor(window.innerWidth / 110)));
        columns = Math.ceil(window.innerWidth / fontSize);
        drops = new Array(columns).fill(0).map(() => Math.random() * (window.innerHeight / fontSize));
        speeds = new Array(columns).fill(0).map(() => 0.18 + Math.random() * 0.35);
        ctx.font = fontSize + 'px ' + getComputedStyle(document.body).fontFamily;
    }

    function draw() {
        if (!running) return;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.055)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        const styles = getComputedStyle(document.body);
        ctx.fillStyle = styles.getPropertyValue('--rain-main').trim() || 'rgba(47, 255, 0, 0.30)';
        ctx.shadowColor = styles.getPropertyValue('--rain-shadow').trim() || 'rgba(0, 255, 154, 0.28)';
        ctx.shadowBlur = 14;

        for (let i = 0; i < columns; i++) {
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            for (let k = 0; k < 2; k++) {
                const digit = (Math.random() * 10) | 0;
                ctx.fillText(String(digit), x, y - (k * fontSize * 1.25));
            }
            drops[i] += speeds[i];
            if (y > window.innerHeight && Math.random() > 0.94) {
                drops[i] = 0;
                speeds[i] = 0.18 + Math.random() * 0.35;
            }
        }
        ctx.shadowBlur = 0;
        requestAnimationFrame(draw);
    }

    function setRunning(next) {
        running = next;
        if (running) {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    if (reducedMotion && reducedMotion.matches) {
        setRunning(false);
        reducedMotion.addEventListener('change', function(e) { setRunning(!e.matches); });
    } else {
        requestAnimationFrame(draw);
    }
})();

