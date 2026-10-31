(() => {
  'use strict';

  const host = document.getElementById('risk-terminal');
  if (!host) return;

  const STORAGE_KEY = 'koundinya-risk-terminal-v1';
  const demo = {
    capital: 2500000,
    margin: 1900000,
    premium: 26250,
    spot: 26000,
    lots: 6,
    eventRisk: 'high',
    marketMove: -4,
    ivChange: 20,
    days: 1,
    positionScenario: -1,
    positions: [
      { strike: 25700, type: 'PE', side: 'SELL', qty: 450 },
      { strike: 26300, type: 'CE', side: 'SELL', qty: 450 },
      { strike: 24900, type: 'PE', side: 'BUY', qty: 450 },
      { strike: 27100, type: 'CE', side: 'BUY', qty: 450 }
    ]
  };

  const normalizePositions = positions => Array.isArray(positions) ? positions.slice(0, 20).map(position => ({
    strike: Math.max(0, Math.round(Number(position?.strike) || 0)),
    type: position?.type === 'CE' ? 'CE' : 'PE',
    side: position?.side === 'BUY' ? 'BUY' : 'SELL',
    qty: Math.max(1, Math.round(Number(position?.qty) || 1))
  })) : [];
  const cloneDemo = () => ({ ...demo, positions: normalizePositions(demo.positions) });

  const loadState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return cloneDemo();
      return {
        ...cloneDemo(),
        ...saved,
        positionScenario: [-1, 0, 1].includes(Number(saved.positionScenario)) ? Number(saved.positionScenario) : -1,
        positions: normalizePositions(Array.isArray(saved.positions) ? saved.positions : demo.positions)
      };
    } catch {
      return cloneDemo();
    }
  };

  let state = loadState();

  host.innerHTML = `
    <div class="rt-wrap">
      <header class="rt-header">
        <div>
          <div class="rt-eyebrow">Decision intelligence · F&amp;O risk</div>
          <h2 class="rt-title" id="risk-title">Know the risk<br><em>before it knows you.</em></h2>
        </div>
        <div>
          <p class="rt-intro">A private, scenario-led view of margin pressure, tail exposure and portfolio resilience. Built for disciplined Indian derivatives traders.</p>
          <div class="rt-privacy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
            Inputs stay in this browser
          </div>
        </div>
      </header>

      <div class="rt-toolbar">
        <div class="rt-demo-label"><span class="rt-live-dot" aria-hidden="true"></span> Illustrative NIFTY short-strangle portfolio</div>
        <div class="rt-actions">
          <button class="rt-ghost-btn" type="button" id="rt-reset">Reset demo</button>
          <button class="rt-primary-btn" type="button" id="rt-analyse">Analyse portfolio</button>
        </div>
      </div>

      <div class="rt-layout">
        <div class="rt-sidebar">
          <aside class="rt-panel rt-form-panel" aria-label="Portfolio inputs">
          <div class="rt-panel-head">
            <div><span class="rt-panel-kicker">Portfolio setup</span><h3>Risk inputs</h3></div>
            <span class="rt-saved" id="rt-saved" aria-live="polite">Saved locally</span>
          </div>
          <form class="rt-form" id="rt-form" novalidate>
            <div class="rt-field-grid">
              <div class="rt-field rt-span-2">
                <label for="rt-capital">Trading capital <button class="rt-tip" type="button" aria-label="About trading capital" data-tooltip="Total liquid capital allocated to this strategy, including available cash and pledged collateral.">i</button></label>
                <div class="rt-input-wrap"><span class="rt-prefix">₹</span><input class="has-prefix" id="rt-capital" name="capital" type="number" min="100000" step="50000" inputmode="numeric" aria-describedby="rt-capital-guide rt-capital-error" required></div>
                <div class="rt-number-guide" id="rt-capital-guide" aria-live="polite"></div>
                <div class="rt-error" id="rt-capital-error"></div>
              </div>
              <div class="rt-field">
                <label for="rt-margin">Margin blocked <button class="rt-tip" type="button" aria-label="About margin blocked" data-tooltip="Approximate total margin currently used by open positions. This is entered manually and is not connected to a broker.">i</button></label>
                <div class="rt-input-wrap"><span class="rt-prefix">₹</span><input class="has-prefix" id="rt-margin" name="margin" type="number" min="0" step="10000" inputmode="numeric" aria-describedby="rt-margin-guide rt-margin-error" required></div>
                <div class="rt-number-guide" id="rt-margin-guide" aria-live="polite"></div>
                <div class="rt-error" id="rt-margin-error"></div>
              </div>
              <div class="rt-field">
                <label for="rt-premium">Net credit</label>
                <div class="rt-input-wrap"><span class="rt-prefix">₹</span><input class="has-prefix" id="rt-premium" name="premium" type="number" min="0" step="500" inputmode="numeric" aria-describedby="rt-premium-guide rt-premium-error" required></div>
                <div class="rt-number-guide" id="rt-premium-guide" aria-live="polite"></div>
                <div class="rt-error" id="rt-premium-error"></div>
              </div>
              <div class="rt-field">
                <label for="rt-spot">NIFTY spot</label>
                <input id="rt-spot" name="spot" type="number" min="1000" step="50" inputmode="numeric" required>
                <div class="rt-error" id="rt-spot-error"></div>
              </div>
              <div class="rt-field">
                <label for="rt-lots">Strategy lots</label>
                <input id="rt-lots" name="lots" type="number" min="1" max="100" step="1" inputmode="numeric" required>
                <div class="rt-error" id="rt-lots-error"></div>
              </div>
              <div class="rt-field rt-span-2">
                <label for="rt-event">Overnight / event risk <button class="rt-tip" type="button" aria-label="About event risk" data-tooltip="Use High around major policy decisions, elections, results or when carrying concentrated short-volatility exposure overnight.">i</button></label>
                <select id="rt-event" name="eventRisk"><option value="low">Low — routine session</option><option value="medium">Medium — elevated uncertainty</option><option value="high">High — event / overnight exposure</option></select>
                <div class="rt-error" id="rt-event-error"></div>
              </div>
            </div>
            <p class="rt-form-note">Use approximate values from your broker statement. No account connection, order placement or market-data feed is used.</p>
          </form>
          </aside>
          <section class="rt-panel rt-guidance-panel" aria-labelledby="rt-guidance-heading">
            <div class="rt-panel-head"><div><span class="rt-panel-kicker">Action framework</span><h3 id="rt-guidance-heading">Hedge guidance</h3></div></div>
            <ol class="rt-guidance-list" id="rt-guidance"></ol>
          </section>
        </div>

        <div class="rt-dashboard" id="rt-dashboard" aria-live="polite">
          <div class="rt-metrics">
            <article class="rt-metric">
              <div class="rt-risk">
                <div class="rt-score-ring" id="rt-score-ring"><strong id="rt-score">64</strong></div>
                <div><div class="rt-metric-label">Risk score <button class="rt-tip" type="button" aria-label="About risk score" data-tooltip="A directional 0–100 indicator based on margin use, event risk, position size and premium concentration. Higher means more fragile.">i</button></div><div class="rt-metric-sub" id="rt-risk-band">Elevated risk</div></div>
              </div>
            </article>
            <article class="rt-metric">
              <div class="rt-metric-label">Margin utilisation <button class="rt-tip" type="button" aria-label="About margin utilisation" data-tooltip="Margin blocked as a percentage of total allocated capital.">i</button></div>
              <div class="rt-metric-value" id="rt-utilisation">76%</div>
              <div class="rt-meter"><span id="rt-util-meter"></span></div>
              <div class="rt-metric-sub" id="rt-util-copy">Above preferred 65% ceiling</div>
            </article>
            <article class="rt-metric">
              <div class="rt-metric-label">Cash buffer</div>
              <div class="rt-metric-value" id="rt-buffer">₹6.0L</div>
              <div class="rt-metric-sub" id="rt-buffer-copy">24% of capital remains</div>
            </article>
            <article class="rt-metric">
              <div class="rt-metric-label">Crash scenario <button class="rt-tip" type="button" aria-label="About crash scenario" data-tooltip="Illustrative one-day loss under the Scenario Lab settings. It is not VaR and not a forecast.">i</button></div>
              <div class="rt-metric-value" id="rt-crash">−₹3.8L</div>
              <div class="rt-metric-sub" id="rt-crash-copy">15.2% of allocated capital</div>
            </article>
          </div>

          <div class="rt-dashboard-grid">
            <section class="rt-panel rt-scenario-panel" aria-labelledby="rt-scenario-heading">
              <div class="rt-panel-head"><div><span class="rt-panel-kicker">What happens if…</span><h3 id="rt-scenario-heading">Scenario Lab</h3></div></div>
              <div class="rt-scenario-body">
                <div class="rt-control">
                  <div class="rt-control-row"><label for="rt-move">NIFTY move</label><output id="rt-move-output" for="rt-move">−4.0%</output></div>
                  <input id="rt-move" type="range" min="-10" max="10" step="0.5">
                  <div class="rt-scale"><span>−10%</span><span>Flat</span><span>+10%</span></div>
                </div>
                <div class="rt-control">
                  <div class="rt-control-row"><label for="rt-iv">Implied volatility</label><output id="rt-iv-output" for="rt-iv">+20%</output></div>
                  <input id="rt-iv" type="range" min="-40" max="80" step="5">
                  <div class="rt-scale"><span>Crush</span><span>Unchanged</span><span>Spike</span></div>
                </div>
                <div class="rt-control">
                  <div class="rt-control-row"><label for="rt-days">Days elapsed</label><output id="rt-days-output" for="rt-days">1 day</output></div>
                  <input id="rt-days" type="range" min="0" max="7" step="1">
                  <div class="rt-scale"><span>Today</span><span>+3</span><span>+7 days</span></div>
                </div>
                <div class="rt-scenario-result">
                  <div class="rt-scenario-result-label">Estimated portfolio impact</div>
                  <div class="rt-scenario-result-value" id="rt-scenario-pnl">−₹3.8L</div>
                  <p id="rt-scenario-caption">Illustrative model impact before slippage and gap risk.</p>
                </div>
              </div>
            </section>

            <section class="rt-panel rt-health-panel" aria-labelledby="rt-health-heading">
              <div class="rt-panel-head"><div><span class="rt-panel-kicker">Portfolio health</span><h3 id="rt-health-heading">Resilience check</h3></div><strong id="rt-health-score">41 / 100</strong></div>
              <div class="rt-health-body">
                <div class="rt-health-row"><strong>Liquidity reserve</strong><output id="rt-health-liquidity">48%</output><div class="rt-health-bar"><span id="rt-health-liquidity-bar"></span></div></div>
                <div class="rt-health-row"><strong>Margin discipline</strong><output id="rt-health-margin">24%</output><div class="rt-health-bar"><span id="rt-health-margin-bar"></span></div></div>
                <div class="rt-health-row"><strong>Stress resilience</strong><output id="rt-health-stress">45%</output><div class="rt-health-bar"><span id="rt-health-stress-bar"></span></div></div>
                <div class="rt-health-row"><strong>Hedge quality</strong><output>58%</output><div class="rt-health-bar"><span style="width:58%"></span></div></div>
                <div class="rt-alert"><span class="rt-alert-icon">△</span><span id="rt-health-alert">The portfolio can survive the modelled shock, but the margin buffer is too narrow for a disorderly gap.</span></div>
              </div>
            </section>
          </div>

        </div>
      </div>

      <section class="rt-panel rt-positions-panel rt-position-workspace" aria-labelledby="rt-positions-heading">
        <div class="rt-panel-head rt-position-head">
          <div><span class="rt-panel-kicker">Your NIFTY positions</span><h3 id="rt-positions-heading">Position stress map &amp; payoff</h3></div>
          <button class="rt-add-position" type="button" id="rt-add-position"><span aria-hidden="true">＋</span> Add position</button>
        </div>
        <div class="rt-position-workspace-body">
          <div class="rt-position-editor">
            <div class="rt-position-tools">
              <span>Test NIFTY move</span>
              <div class="rt-scenario-tabs" id="rt-position-tabs" role="tablist" aria-label="Position stress scenario">
                <button type="button" role="tab" data-position-scenario="-1">−1%</button>
                <button type="button" role="tab" data-position-scenario="0">Flat</button>
                <button type="button" role="tab" data-position-scenario="1">+1%</button>
              </div>
            </div>
            <div class="rt-table-wrap"><table class="rt-table rt-position-table"><thead><tr><th>Strike</th><th>Type</th><th>Side</th><th>Quantity</th><th>Est. impact</th><th><span class="rt-sr-only">Remove</span></th></tr></thead><tbody id="rt-position-rows"></tbody></table></div>
            <div class="rt-position-summary"><div><span>Combined directional impact</span><strong id="rt-position-total">₹0</strong></div><p>Illustrative delta-based estimate only. It excludes premium, IV, theta, slippage and live Greeks.</p></div>
          </div>
          <div class="rt-payoff-panel">
            <div class="rt-payoff-head">
              <div><span class="rt-panel-kicker">Expiry view</span><h4>Payoff chart</h4></div>
              <output id="rt-payoff-active">−1% · ₹0</output>
            </div>
            <div class="rt-payoff-chart-wrap">
              <svg id="rt-payoff-chart" viewBox="0 0 640 300" role="img" aria-labelledby="rt-payoff-title rt-payoff-desc">
                <title id="rt-payoff-title">Estimated NIFTY options payoff chart</title>
                <desc id="rt-payoff-desc">Expiry-style payoff from negative six to positive six percent NIFTY movement, using the entered strikes, quantities and net credit.</desc>
                <defs><linearGradient id="rt-payoff-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c9a9" stop-opacity=".24"/><stop offset="1" stop-color="#86c9a9" stop-opacity="0"/></linearGradient></defs>
                <g id="rt-payoff-grid" aria-hidden="true"></g>
                <path id="rt-payoff-area" fill="url(#rt-payoff-fill)" aria-hidden="true"></path>
                <path id="rt-payoff-line" fill="none" stroke="#e0c07a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"></path>
                <line id="rt-payoff-marker-line" stroke="#e0c07a" stroke-width="1" stroke-dasharray="4 5" aria-hidden="true"></line>
                <circle id="rt-payoff-marker" r="5" fill="#f5f4f0" stroke="#c9a44c" stroke-width="3" aria-hidden="true"></circle>
              </svg>
            </div>
            <div class="rt-payoff-legend"><span><i class="is-profit"></i>Profit</span><span><i class="is-loss"></i>Loss</span><strong id="rt-payoff-range">Range −6% to +6%</strong></div>
            <p class="rt-payoff-note">Expiry-style estimate using net credit and intrinsic value. It excludes brokerage, taxes, slippage and early-exit Greeks.</p>
          </div>
        </div>
      </section>

      <div class="rt-disclaimer"><strong>Important:</strong> This is an educational, deterministic scenario tool—not investment advice, a broker terminal, a pricing engine, VaR, or a promise of performance. Outputs use simplified assumptions and can differ materially from real option P&amp;L, margin requirements, liquidity, taxes, slippage and gap behaviour. Verify decisions independently with your broker and a qualified adviser.</div>
    </div>`;

  const $ = selector => host.querySelector(selector);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const inr = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const compactInr = value => {
    const sign = value < 0 ? '−' : '';
    const amount = Math.abs(value);
    if (amount >= 10000000) return `${sign}₹${(amount / 10000000).toFixed(amount >= 100000000 ? 0 : 1)}Cr`;
    if (amount >= 100000) return `${sign}₹${(amount / 100000).toFixed(amount >= 1000000 ? 1 : 2)}L`;
    if (amount >= 1000) return `${sign}₹${(amount / 1000).toFixed(0)}K`;
    return `${sign}${inr(amount)}`;
  };
  const signedPercent = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)}%`;

  const amountInWords = value => {
    const number = Math.trunc(Math.abs(Number(value)));
    if (!Number.isSafeInteger(number)) return '';
    if (number === 0) return 'zero';

    const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const belowHundred = amount => amount < 20 ? ones[amount] : `${tens[Math.floor(amount / 10)]}${amount % 10 ? `-${ones[amount % 10]}` : ''}`;
    const convert = amount => {
      if (amount < 100) return belowHundred(amount);
      if (amount < 1000) return `${ones[Math.floor(amount / 100)]} hundred${amount % 100 ? ` ${convert(amount % 100)}` : ''}`;
      if (amount < 100000) return `${convert(Math.floor(amount / 1000))} thousand${amount % 1000 ? ` ${convert(amount % 1000)}` : ''}`;
      if (amount < 10000000) return `${convert(Math.floor(amount / 100000))} lakh${amount % 100000 ? ` ${convert(amount % 100000)}` : ''}`;
      return `${convert(Math.floor(amount / 10000000))} crore${amount % 10000000 ? ` ${convert(amount % 10000000)}` : ''}`;
    };

    return convert(number);
  };

  const renderNumberGuide = key => {
    const input = fields[key];
    const guide = $(`#rt-${key}-guide`);
    if (!input || !guide) return;
    const rawValue = input.value.trim();
    if (!rawValue) {
      guide.textContent = 'Start typing to see the amount in words.';
      guide.classList.add('is-placeholder');
      return;
    }
    const value = Number(rawValue);
    const words = amountInWords(value);
    if (!Number.isFinite(value) || value < 0 || !words) {
      guide.textContent = 'Enter a valid whole-rupee amount.';
      guide.classList.add('is-placeholder');
      return;
    }
    const spokenAmount = `${words.charAt(0).toUpperCase()}${words.slice(1)} rupees`;
    guide.textContent = `${inr(Math.trunc(value))} · ${spokenAmount}`;
    guide.classList.remove('is-placeholder');
  };

  const renderNumberGuides = () => ['capital', 'margin', 'premium'].forEach(renderNumberGuide);

  const fields = {
    capital: $('#rt-capital'), margin: $('#rt-margin'), premium: $('#rt-premium'),
    spot: $('#rt-spot'), lots: $('#rt-lots'), eventRisk: $('#rt-event'),
    marketMove: $('#rt-move'), ivChange: $('#rt-iv'), days: $('#rt-days')
  };

  const syncFields = () => {
    Object.entries(fields).forEach(([key, element]) => { element.value = state[key]; });
    renderNumberGuides();
  };

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $('#rt-saved').textContent = 'Saved locally';
    } catch {
      $('#rt-saved').textContent = 'Local save unavailable';
    }
  };

  const readForm = () => {
    state = {
      ...state,
      capital: Number(fields.capital.value), margin: Number(fields.margin.value),
      premium: Number(fields.premium.value), spot: Number(fields.spot.value),
      lots: Number(fields.lots.value), eventRisk: fields.eventRisk.value,
      marketMove: Number(fields.marketMove.value), ivChange: Number(fields.ivChange.value),
      days: Number(fields.days.value)
    };
  };

  const validate = () => {
    readForm();
    const errors = {
      capital: state.capital >= 100000 ? '' : 'Enter capital of at least ₹1,00,000.',
      margin: state.margin >= 0 && state.margin <= state.capital * 1.25 ? '' : 'Margin must be between ₹0 and 125% of capital.',
      premium: state.premium >= 0 && state.premium <= state.capital ? '' : 'Enter a realistic non-negative credit.',
      spot: state.spot >= 1000 ? '' : 'Enter a valid index level.',
      lots: Number.isInteger(state.lots) && state.lots >= 1 && state.lots <= 100 ? '' : 'Use a whole number from 1 to 100.'
    };
    Object.entries(errors).forEach(([key, message]) => {
      fields[key].setAttribute('aria-invalid', String(Boolean(message)));
      const error = $(`#rt-${key}-error`);
      if (error) error.textContent = message;
    });
    const firstError = Object.keys(errors).find(key => errors[key]);
    if (firstError) fields[firstError].focus();
    return !firstError;
  };

  const estimatePnl = (move = state.marketMove, iv = state.ivChange, days = state.days) => {
    const utilisation = clamp(state.margin / state.capital, 0, 1.5);
    const magnitude = Math.abs(move) / 100;
    const directionFactor = move < 0 ? 1 : .84;
    const directionalLoss = state.capital * magnitude * (2.35 + utilisation) * directionFactor;
    const gammaLoss = state.capital * magnitude * magnitude * 7.5;
    const volImpact = state.capital * (iv / 100) * .072;
    const thetaGain = state.premium * clamp(days / 7, 0, 1) * .42;
    const flatBenefit = magnitude < .006 ? state.premium * .25 : 0;
    return Math.round(flatBenefit + thetaGain - directionalLoss - gammaLoss - volImpact);
  };

  const healthColor = score => score < 38 ? 'var(--rt-danger)' : score < 65 ? 'var(--rt-warning)' : 'var(--rt-positive)';
  const setHealth = (id, score) => {
    const normalized = Math.round(clamp(score, 0, 100));
    $(`#rt-health-${id}`).textContent = `${normalized}%`;
    const bar = $(`#rt-health-${id}-bar`);
    bar.style.width = `${normalized}%`;
    bar.style.background = healthColor(normalized);
  };

  const estimatePositionImpact = (position, scenario = state.positionScenario) => {
    const spot = Number(fields.spot.value) || state.spot;
    const strike = Number(position.strike);
    const qty = Number(position.qty);
    if (spot <= 0 || strike <= 0 || qty <= 0 || scenario === 0) return 0;
    const spotChange = spot * (scenario / 100);
    const moneyness = position.type === 'CE' ? (spot - strike) / spot : (strike - spot) / spot;
    const deltaMagnitude = clamp(.32 + moneyness * 4, .08, .9);
    const optionDelta = position.type === 'CE' ? deltaMagnitude : -deltaMagnitude;
    const sideMultiplier = position.side === 'BUY' ? 1 : -1;
    return Math.round(spotChange * optionDelta * qty * sideMultiplier);
  };

  const estimateExpiryPayoff = scenario => {
    const spot = Number(fields.spot.value) || state.spot;
    const targetSpot = spot * (1 + scenario / 100);
    return Math.round(state.positions.reduce((total, position) => {
      const strike = Number(position.strike);
      const qty = Number(position.qty);
      if (strike <= 0 || qty <= 0) return total;
      const intrinsic = position.type === 'CE' ? Math.max(0, targetSpot - strike) : Math.max(0, strike - targetSpot);
      return total + intrinsic * qty * (position.side === 'BUY' ? 1 : -1);
    }, Number(fields.premium.value) || state.premium || 0));
  };

  const renderPayoffChart = () => {
    const chart = $('#rt-payoff-chart');
    if (!chart) return;
    const width = 640, height = 300, left = 56, right = 18, top = 22, bottom = 42;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const scenarios = Array.from({ length: 49 }, (_, index) => -6 + index * .25);
    const values = scenarios.map(estimateExpiryPayoff);
    let minValue = Math.min(0, ...values), maxValue = Math.max(0, ...values);
    if (minValue === maxValue) { minValue -= 1; maxValue += 1; }
    const padding = Math.max((maxValue - minValue) * .12, 1);
    minValue -= padding;
    maxValue += padding;
    const x = scenario => left + ((scenario + 6) / 12) * plotWidth;
    const y = value => top + ((maxValue - value) / (maxValue - minValue)) * plotHeight;
    const points = scenarios.map((scenario, index) => [x(scenario), y(values[index])]);
    const linePath = points.map(([px, py], index) => `${index ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`).join(' ');
    const zeroY = y(0);
    const areaPath = `${linePath} L${points.at(-1)[0].toFixed(2)} ${zeroY.toFixed(2)} L${points[0][0].toFixed(2)} ${zeroY.toFixed(2)} Z`;
    $('#rt-payoff-line').setAttribute('d', linePath);
    $('#rt-payoff-area').setAttribute('d', areaPath);

    const grid = $('#rt-payoff-grid');
    const xTicks = [-6, -3, 0, 3, 6];
    const yTicks = [maxValue, (maxValue + minValue) / 2, minValue];
    grid.innerHTML = [
      ...xTicks.map(tick => `<line x1="${x(tick)}" y1="${top}" x2="${x(tick)}" y2="${height - bottom}" class="rt-chart-grid-line"/><text x="${x(tick)}" y="${height - 15}" text-anchor="middle" class="rt-chart-label">${tick > 0 ? '+' : ''}${tick}%</text>`),
      ...yTicks.map(tick => `<line x1="${left}" y1="${y(tick)}" x2="${width - right}" y2="${y(tick)}" class="rt-chart-grid-line${Math.abs(tick) < padding ? ' is-zero' : ''}"/><text x="${left - 8}" y="${y(tick) + 4}" text-anchor="end" class="rt-chart-label">${compactInr(tick)}</text>`)
    ].join('');

    const activeScenario = state.positionScenario;
    const activePayoff = estimateExpiryPayoff(activeScenario);
    const markerX = x(activeScenario), markerY = y(activePayoff);
    const markerLine = $('#rt-payoff-marker-line');
    markerLine.setAttribute('x1', markerX); markerLine.setAttribute('x2', markerX);
    markerLine.setAttribute('y1', top); markerLine.setAttribute('y2', height - bottom);
    const marker = $('#rt-payoff-marker');
    marker.setAttribute('cx', markerX); marker.setAttribute('cy', markerY);
    const activeOutput = $('#rt-payoff-active');
    activeOutput.textContent = `${activeScenario > 0 ? '+' : activeScenario < 0 ? '−' : ''}${Math.abs(activeScenario)}% · ${compactInr(activePayoff)}`;
    activeOutput.classList.toggle('rt-pnl-negative', activePayoff < 0);
    activeOutput.classList.toggle('rt-pnl-positive', activePayoff >= 0);
    $('#rt-payoff-desc').textContent = `Estimated expiry payoff from a negative six to positive six percent NIFTY move. The selected ${activeScenario}% scenario is ${inr(activePayoff)}.`;
  };

  const refreshPositionImpacts = () => {
    let total = 0;
    state.positions.forEach((position, index) => {
      const impact = estimatePositionImpact(position);
      total += impact;
      const output = $(`[data-position-impact="${index}"]`);
      if (output) {
        output.textContent = impact === 0 ? '₹0' : compactInr(impact);
        output.classList.toggle('rt-pnl-negative', impact < 0);
        output.classList.toggle('rt-pnl-positive', impact > 0);
      }
    });
    const totalOutput = $('#rt-position-total');
    totalOutput.textContent = total === 0 ? '₹0' : compactInr(total);
    totalOutput.classList.toggle('rt-pnl-negative', total < 0);
    totalOutput.classList.toggle('rt-pnl-positive', total > 0);
    renderPayoffChart();
  };

  const renderPositions = () => {
    const rows = state.positions.map((position, index) => `
      <tr data-position-index="${index}">
        <td><input class="rt-position-input" data-position-field="strike" type="number" min="1" step="50" inputmode="numeric" aria-label="Strike price for position ${index + 1}" value="${position.strike || ''}"></td>
        <td><select class="rt-position-select" data-position-field="type" aria-label="Option type for position ${index + 1}"><option value="PE"${position.type === 'PE' ? ' selected' : ''}>PE</option><option value="CE"${position.type === 'CE' ? ' selected' : ''}>CE</option></select></td>
        <td><select class="rt-position-select" data-position-field="side" aria-label="Side for position ${index + 1}"><option value="BUY"${position.side === 'BUY' ? ' selected' : ''}>BUY</option><option value="SELL"${position.side === 'SELL' ? ' selected' : ''}>SELL</option></select></td>
        <td><input class="rt-position-input rt-position-qty" data-position-field="qty" type="number" min="1" step="1" inputmode="numeric" aria-label="Quantity for position ${index + 1}" value="${position.qty}"></td>
        <td><output class="rt-position-impact" data-position-impact="${index}">₹0</output></td>
        <td><button class="rt-remove-position" type="button" data-remove-position="${index}" aria-label="Remove position ${index + 1}">×</button></td>
      </tr>`).join('');
    $('#rt-position-rows').innerHTML = rows || '<tr><td class="rt-position-empty" colspan="6">No positions yet. Add a NIFTY option leg to begin.</td></tr>';
    $('#rt-position-tabs').querySelectorAll('[data-position-scenario]').forEach(button => {
      const active = Number(button.dataset.positionScenario) === state.positionScenario;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    refreshPositionImpacts();
  };

  const renderGuidance = (utilisation, bufferRatio, stressLoss) => {
    const reduce = Math.max(1, Math.ceil(state.lots * Math.max(0, utilisation - .62)));
    const hedgeBudget = Math.round(state.capital * .006 / 500) * 500;
    const guidance = [
      utilisation > .65
        ? [`Release margin`, `Reduce roughly ${reduce} short lot${reduce === 1 ? '' : 's'} or add collateral before carrying the book overnight.`]
        : [`Protect the buffer`, `Current utilisation is within the model ceiling; preserve at least 30% deployable capital.`],
      [`Define the left tail`, `Price a further OTM put spread with an illustrative budget near ${compactInr(hedgeBudget)}; compare protection gained, not only premium paid.`],
      stressLoss > state.capital * .12
        ? [`Pre-commit an exit`, `The selected shock consumes ${Math.round(stressLoss / state.capital * 100)}% of capital. Set a loss and margin trigger before the next session.`]
        : [`Retest after changes`, `Re-run the −4% / +20% IV case after every size or hedge adjustment.`]
    ];
    $('#rt-guidance').innerHTML = guidance.map((item, index) => `<li><span class="rt-guidance-num">0${index + 1}</span><div><strong>${item[0]}</strong><p>${item[1]}</p></div></li>`).join('');
  };

  const render = () => {
    const utilisation = clamp(state.margin / state.capital, 0, 1.5);
    const utilPercent = utilisation * 100;
    const buffer = state.capital - state.margin;
    const bufferRatio = buffer / state.capital;
    const eventPoints = { low: 1, medium: 5, high: 10 }[state.eventRisk] || 5;
    const premiumConcentration = state.premium / state.capital * 100;
    const score = Math.round(clamp(12 + utilPercent * .45 + eventPoints + state.lots * 1.2 + premiumConcentration, 0, 100));
    const pnl = estimatePnl();
    const stressLoss = Math.max(0, -pnl);
    const riskBand = score < 35 ? 'Controlled risk' : score < 60 ? 'Moderate risk' : score < 78 ? 'Elevated risk' : 'Critical risk';

    $('#rt-score').textContent = score;
    $('#rt-score-ring').style.setProperty('--score', score);
    $('#rt-risk-band').textContent = riskBand;
    $('#rt-utilisation').textContent = `${utilPercent.toFixed(0)}%`;
    $('#rt-util-meter').style.width = `${clamp(utilPercent, 0, 100)}%`;
    $('#rt-util-copy').textContent = utilPercent > 65 ? 'Above preferred 65% ceiling' : 'Within the model ceiling';
    $('#rt-buffer').textContent = compactInr(buffer);
    $('#rt-buffer-copy').textContent = `${Math.round(bufferRatio * 100)}% of capital remains`;
    $('#rt-crash').textContent = compactInr(pnl);
    $('#rt-crash-copy').textContent = `${(stressLoss / state.capital * 100).toFixed(1)}% of allocated capital`;

    $('#rt-move-output').textContent = signedPercent(state.marketMove);
    $('#rt-iv-output').textContent = `${state.ivChange > 0 ? '+' : state.ivChange < 0 ? '−' : ''}${Math.abs(state.ivChange)}%`;
    $('#rt-days-output').textContent = `${state.days} ${state.days === 1 ? 'day' : 'days'}`;
    $('#rt-scenario-pnl').textContent = compactInr(pnl);
    $('#rt-scenario-pnl').classList.toggle('rt-pnl-positive', pnl >= 0);
    $('#rt-scenario-pnl').style.color = pnl >= 0 ? 'var(--rt-positive)' : 'var(--rt-danger)';
    $('#rt-scenario-caption').textContent = pnl < 0
      ? `Modelled drawdown: ${(stressLoss / state.capital * 100).toFixed(1)}% of capital before slippage and gap risk.`
      : 'Premium decay offsets the selected directional and volatility assumptions in this simplified model.';

    const liquidityHealth = clamp(bufferRatio * 200, 0, 100);
    const marginHealth = clamp(100 - utilPercent, 0, 100);
    const stressHealth = clamp(100 - stressLoss / state.capital * 360, 0, 100);
    setHealth('liquidity', liquidityHealth);
    setHealth('margin', marginHealth);
    setHealth('stress', stressHealth);
    const totalHealth = Math.round((liquidityHealth + marginHealth + stressHealth + 58) / 4);
    $('#rt-health-score').textContent = `${totalHealth} / 100`;
    $('#rt-health-score').style.color = healthColor(totalHealth);
    $('#rt-health-alert').textContent = utilPercent > 70
      ? 'The margin buffer is narrow. A gap or volatility expansion can force decisions before the modelled loss is reached.'
      : 'The book has usable liquidity, but scenario outputs should still be tested against actual broker margins.';

    renderPositions();
    renderGuidance(utilisation, bufferRatio, stressLoss);
    saveState();
  };

  const updateScenario = () => {
    readForm();
    render();
  };

  Object.entries(fields).forEach(([key, field]) => {
    const eventName = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      if (['capital', 'margin', 'premium'].includes(key)) renderNumberGuide(key);
      if (field.type === 'range') updateScenario();
      else {
        $('#rt-saved').textContent = 'Changes not analysed';
        if (field.getAttribute('aria-invalid') === 'true') validate();
      }
    });
  });

  $('#rt-add-position').addEventListener('click', () => {
    if (state.positions.length >= 20) {
      $('#rt-saved').textContent = 'Maximum 20 positions';
      return;
    }
    const spot = Number(fields.spot.value) || state.spot;
    state.positions.push({ strike: Math.round(spot / 50) * 50, type: 'CE', side: 'SELL', qty: Math.max(1, state.lots * 75) });
    renderPositions();
    saveState();
    const addedRow = $('#rt-position-rows').lastElementChild;
    addedRow?.querySelector('input')?.focus();
  });

  $('#rt-position-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-position-scenario]');
    if (!button) return;
    state.positionScenario = Number(button.dataset.positionScenario);
    renderPositions();
    saveState();
  });

  const updatePosition = event => {
    const control = event.target.closest('[data-position-field]');
    const row = event.target.closest('[data-position-index]');
    if (!control || !row) return;
    const index = Number(row.dataset.positionIndex);
    const field = control.dataset.positionField;
    const position = state.positions[index];
    if (!position) return;
    if (field === 'strike' || field === 'qty') position[field] = Math.max(field === 'qty' ? 1 : 0, Math.round(Number(control.value) || 0));
    else position[field] = control.value;
    refreshPositionImpacts();
    saveState();
  };
  $('#rt-position-rows').addEventListener('input', updatePosition);
  $('#rt-position-rows').addEventListener('change', updatePosition);
  $('#rt-position-rows').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-position]');
    if (!button) return;
    state.positions.splice(Number(button.dataset.removePosition), 1);
    renderPositions();
    saveState();
  });

  $('#rt-analyse').addEventListener('click', () => {
    if (!validate()) return;
    const button = $('#rt-analyse');
    const dashboard = $('#rt-dashboard');
    button.disabled = true;
    button.classList.add('is-loading');
    button.textContent = 'Analysing';
    dashboard.setAttribute('aria-busy', 'true');
    window.setTimeout(() => {
      render();
      dashboard.setAttribute('aria-busy', 'false');
      button.disabled = false;
      button.classList.remove('is-loading');
      button.textContent = 'Analysis updated';
      window.setTimeout(() => { button.textContent = 'Analyse portfolio'; }, 1800);
    }, 620);
  });

  $('#rt-reset').addEventListener('click', () => {
    state = cloneDemo();
    syncFields();
    validate();
    render();
    $('#rt-saved').textContent = 'Demo restored';
  });

  syncFields();
  render();
})();
