/** Speech-only notation expansion. Never apply this to captions or board data. */
export function normalizeSpokenText(input: string): string {
  const smallNumbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const numberName = (n: number): string => n < 20 ? smallNumbers[n] : `${['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'][Math.floor(n / 10)]}${n % 10 ? ` ${smallNumbers[n % 10]}` : ''}`;
  let text = input
    // Numeric references followed by a full stop can be read as decimals by
    // conversational TTS. Spell out references without altering decimal values.
    .replace(/\b(page|problem|question|phase|step|lecture|figure|equation)\s+(\d{1,2})(?!\d|\.\d)/gi, (_, label, value) => `${label} ${numberName(Number(value))}`)
    .replace(/\\frac\{(m|cm|km)\}\{s(?:\^\{?2\}?)?\}/g, (raw, unit) => `${unit === "cm" ? "centimeters" : unit === "km" ? "kilometers" : "meters"} per second${raw.includes("2") ? " squared" : ""}`)
    .replace(/\\(?:mathrm|text|operatorname)\{([^{}]+)\}/g, '$1')
    .replace(/\\(?:left|right)/g, '')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1) divided by ($2)')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'square root of $1')
    .replace(/\\(?:cdot|times)/g, ' times ')
    .replace(/\\(?:approx|simeq)/g, ' approximately ')
    .replace(/\\(?:theta|alpha|beta|gamma|omega|Delta|delta|pi)\b/g, value => value.slice(1))
    .replace(/\$|\\[()[\]]/g, '')
    .replace(/\*\*|`/g, '')
    .replace(/[−–]/g, '-')
    .replace(/—/g, ', ')
    .replace(/⁻¹/g, '^-1').replace(/⁻²/g, '^-2')
    .replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/\^\{(-?\d+)\}/g, '^$1');

  // Match compound units before individual units. Unit symbols are case-sensitive.
  text = text
    .replace(/\b(m|cm|km)\s*(?:\/\s*s|[·\s]+s\^-1)(?:\^2)?\b/g, (unit) => {
      const distance = unit.startsWith('cm') ? 'centimeters' : unit.startsWith('km') ? 'kilometers' : 'meters';
      return `${distance} per second${unit.includes('^2') ? ' squared' : ''}`;
    })
    .replace(/\b(m|cm|km)[·\s]+s\^-2\b/g, (_, unit) => `${unit === 'cm' ? 'centimeters' : unit === 'km' ? 'kilometers' : 'meters'} per second squared`)
    .replace(/\bkm\s*\/\s*h\b/g, 'kilometers per hour');

  const units: Record<string, string> = {
    m: 'meters', cm: 'centimeters', mm: 'millimeters', km: 'kilometers',
    s: 'seconds', ms: 'milliseconds', kg: 'kilograms', g: 'grams',
    N: 'newtons', J: 'joules', W: 'watts', Hz: 'hertz', Pa: 'pascals',
  };
  // A lone variable m or g must remain a variable. Expand only after a number.
  text = text.replace(/(\d(?:[\d.,]*\d)?)\s*(cm|mm|km|ms|kg|Hz|Pa|m|s|g|N|J|W)(\^[23])?\b/g,
    (_, number, unit, power) => `${number} ${units[unit]}${power === '^2' ? ' squared' : power === '^3' ? ' cubed' : ''}`);
  const symbols: Record<string, string> = { θ: 'theta', α: 'alpha', β: 'beta', ω: 'omega', Δ: 'delta', π: 'pi', '≈': ' approximately ', '≠': ' is not equal to ', '≤': ' is less than or equal to ', '≥': ' is greater than or equal to ', '×': ' times ', '·': ' times ', '÷': ' divided by ', '°': ' degrees ' };
  text = text.replace(/[θαβωΔπ≈≠≤≥×·÷°]/g, symbol => symbols[symbol]);
  const subscripts: Record<string, string> = { '₀': 'zero', '₁': 'one', '₂': 'two', 'ₓ': 'x', 'ᵧ': 'y' };
  return text
    .replace(/[₀₁₂ₓᵧ]/g, symbol => ` sub ${subscripts[symbol]} `)
    .replace(/(?<![\d.])1 (meters|centimeters|millimeters|kilometers|seconds|milliseconds|kilograms|grams|newtons|joules|watts)\b/g, (_, unit) => `1 ${unit.slice(0, -1)}`)
    .replace(/([A-Za-z])_\{?([A-Za-z0-9]+)\}?/g, '$1 sub $2')
    .replace(/\^2\b/g, ' squared').replace(/\^3\b/g, ' cubed')
    .replace(/\^(-?\d+)\b/g, ' to the power $1')
    .replace(/=/g, ' equals ').replace(/\+/g, ' plus ')
    .replace(/(?<=\s|^|\()-(?=\d)/g, 'negative ')
    .replace(/\s-\s/g, ' minus ')
    .replace(/\s+/g, ' ').trim();
}
