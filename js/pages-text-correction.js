(function () {
  'use strict';

  const input = document.getElementById('text-input');
  const output = document.getElementById('text-output');
  const inputStats = document.getElementById('input-stats');
  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');
  const clearBtn = document.getElementById('clear-btn');

  function updateStats() {
    const text = input.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    inputStats.textContent = `${chars} character${chars === 1 ? '' : 's'} · ${words} word${words === 1 ? '' : 's'} · ${lines} line${lines === 1 ? '' : 's'}`;
  }

  const converters = {
    sentence: (text) => text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase()),
    lower: (text) => text.toLowerCase(),
    upper: (text) => text.toUpperCase(),
    capitalized: (text) => text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
    alternating: (text) => {
      let upper = false;
      return [...text].map((char) => {
        if (/[a-zA-Z]/.test(char)) upper = !upper;
        return /[a-zA-Z]/.test(char) ? (upper ? char.toUpperCase() : char.toLowerCase()) : char;
      }).join('');
    },
    title: (text) => {
      const smallWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of', 'with', 'as']);
      return text.toLowerCase().replace(/\b\w+[\w']*\b/g, (word, offset, source) => {
        if (offset === 0 || /[.!?]\s$/.test(source.slice(0, offset))) return word.charAt(0).toUpperCase() + word.slice(1);
        return smallWords.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1);
      });
    },
    inverse: (text) => [...text].map((char) => {
      if (char.toUpperCase() !== char.toLowerCase()) return char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase();
      return char;
    }).join(''),
    trimspaces: (text) => text.replace(/  +/g, ' ').trim(),
  };

  document.querySelectorAll('.text-correction-case-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (input.value && converters[button.dataset.case]) output.value = converters[button.dataset.case](input.value);
    });
  });

  input.addEventListener('input', () => {
    updateStats();
    output.value = input.value;
  });

  input.addEventListener('paste', (event) => {
    event.preventDefault();
    const plainText = event.clipboardData?.getData('text/plain') || '';
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.setRangeText(plainText, start, end, 'end');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  copyBtn.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.select();
      document.execCommand('copy');
    }
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied';
    setTimeout(() => { copyBtn.textContent = original; }, 1500);
  });

  downloadBtn.addEventListener('click', () => {
    if (!output.value) return;
    const link = document.createElement('a');
    link.download = 'corrected-text.txt';
    link.href = URL.createObjectURL(new Blob([output.value], { type: 'text/plain' }));
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    updateStats();
    input.focus();
  });

  updateStats();
}());
