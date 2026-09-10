(function (root) {
  'use strict';

  const dictionary = root.BETA_TYPO_DICTIONARY || {};
  const ignoredWords = new Set([
    'alt', 'aria', 'class', 'div', 'html', 'https', 'http', 'jpg', 'jpeg', 'png', 'src', 'style', 'target', 'title', 'www'
  ]);

  function distance(left, right) {
    const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
    for (let column = 1; column <= right.length; column += 1) rows[0][column] = column;
    for (let row = 1; row <= left.length; row += 1) {
      for (let column = 1; column <= right.length; column += 1) {
        rows[row][column] = Math.min(
          rows[row - 1][column] + 1,
          rows[row][column - 1] + 1,
          rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
        );
      }
    }
    return rows[left.length][right.length];
  }

  function isIgnored(word) {
    return word.length < 3
      || ignoredWords.has(word)
      || /^\d+$/.test(word)
      || /[_@./:-]/.test(word)
      || /^(?:krhred|cmpg|unit)\d*$/i.test(word);
  }

  function getCandidate(word) {
    const lower = word.toLowerCase();
    if (isIgnored(lower)) return null;
    if (dictionary[lower]) return { word, suggestion: dictionary[lower], type: 'Dictionary' };

    let best = null;
    for (const [typo, suggestion] of Object.entries(dictionary)) {
      if (Math.abs(typo.length - lower.length) > 1) continue;
      const score = distance(lower, typo);
      if (score <= 1 && (!best || score < best.score)) best = { word, suggestion, type: 'Possible typo', score };
    }
    return best ? { word: best.word, suggestion: best.suggestion, type: best.type } : null;
  }

  function scanText(text) {
    const results = [];
    const seen = new Set();
    String(text || '').match(/[A-Za-z][A-Za-z']*/g)?.forEach((word) => {
      const candidate = getCandidate(word);
      if (!candidate) return;
      const key = `${candidate.word.toLowerCase()}\u0000${candidate.suggestion}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(candidate);
    });
    return results;
  }

  function scanHtml(html) {
    const parser = new DOMParser();
    const document = parser.parseFromString(String(html || ''), 'text/html');
    document.querySelectorAll('script, style, noscript, template').forEach((element) => element.remove());
    const text = document.body?.textContent || document.documentElement.textContent || '';
    const attributes = Array.from(document.querySelectorAll('[alt], [title], [aria-label]'))
      .map((element) => [element.getAttribute('alt'), element.getAttribute('title'), element.getAttribute('aria-label')].filter(Boolean).join(' '))
      .join(' ');
    return scanText(`${text} ${attributes}`);
  }

  root.BetaTypoEngine = { scanHtml, scanText };
}(window));
