
const assert = require('node:assert/strict');
const test = require('node:test');
const React = require('react');
const { JSDOM } = require('jsdom');
const { loadRenderedComponent } = require('./render-test-helpers.cjs');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://twistedcustomleather.com/' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'MutationObserver', 'File', 'FormData']) {
  global[key] = dom.window[key];
}
global.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0);
global.cancelAnimationFrame = (handle) => clearTimeout(handle);
global.IS_REACT_ACT_ENVIRONMENT = true;
const { act, cleanup, fireEvent, render, screen, waitFor } = require('@testing-library/react');

function installDom(url) {
  cleanup();
  dom.window.history.replaceState({}, '', url);
  dom.window.localStorage.clear();
  dom.window.sessionStorage.clear();
  dom.window.document.body.innerHTML = '';
}

function restoreDom() {
  cleanup();
}

test.after(() => { dom.window.close(); });

test('same-page Bible navigation consumes only order parameters, preserves campaign/hash, scrolls, and focuses', async () => {
  installDom('https://twistedcustomleather.com/?campaign=header#custom-order');
  const scrolls = [];
  dom.window.HTMLElement.prototype.scrollIntoView = function scrollIntoView(options) { scrolls.push({ element: this, options }); };
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '';
  try {
    const Assistant = await loadRenderedComponent('src/components/custom-order/CustomOrderAssistant.tsx');
    const view = render(React.createElement(Assistant));
    assert.equal(screen.getByLabelText(/Custom Wallet/i).checked, true);

    act(() => {
      dom.window.history.pushState({}, '', '/?campaign=header&product=bible-cover#custom-order');
      view.rerender(React.createElement(Assistant));
    });

    await waitFor(() => assert.equal(screen.getByLabelText(/Bible Or Book Cover/i).checked, true));
    assert.equal(dom.window.location.pathname, '/');
    assert.equal(dom.window.location.search, '?campaign=header');
    assert.equal(dom.window.location.hash, '#custom-order');
    await waitFor(() => assert.equal(scrolls.length, 1));
    assert.equal(scrolls[0].element.id, 'custom-order');
    const stepHeading = screen.getByRole('heading', { name: /Choose your piece/i });
    await waitFor(() => assert.equal(dom.window.document.activeElement, stepHeading));

    view.rerender(React.createElement(Assistant));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(scrolls.length, 1);
    assert.equal(screen.getByLabelText(/Bible Or Book Cover/i).checked, true);
  } finally {
    restoreDom();
  }
});

test('Turnstile expiry defeats a late upload response and checkout submits recovered phone/notes without stale images', async () => {
  installDom('https://twistedcustomleather.com/#custom-order');
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key';
  let turnstileOptions;
  const resetCalls = [];
  dom.window.turnstile = {
    render: (_container, options) => { turnstileOptions = options; return 'widget-1'; },
    reset: (id) => { resetCalls.push(id); },
    remove: () => {},
  };
  const requests = [];
  let resolveUpload;
  let checkoutBody;
  const originalFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === '/api/order-intent') {
      return Response.json({ orderIntentToken: `intent-token-${requests.length}`, expiresAt: new Date(Date.now() + 300_000).toISOString() });
    }
    if (url === '/api/order-assets' && options.method === 'POST') {
      return new Promise((resolve) => { resolveUpload = resolve; });
    }
    if (url === '/api/checkout') {
      checkoutBody = JSON.parse(options.body);
      return Response.json({ error: 'test stops before redirect' }, { status: 500 });
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const Assistant = await loadRenderedComponent('src/components/custom-order/CustomOrderAssistant.tsx');
    render(React.createElement(Assistant));
    fireEvent.click(screen.getByRole('button', { name: /Continue to customization/i }));
    await waitFor(() => assert.ok(turnstileOptions));
    assert.equal(turnstileOptions.appearance, 'interaction-only');
    act(() => turnstileOptions.callback('turnstile-token-1'));
    const file = new File(['image bytes'], 'sketch.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/Choose reference images/i), { target: { files: [file] } });
    await waitFor(() => assert.equal(typeof resolveUpload, 'function'));

    act(() => turnstileOptions['expired-callback']());
    assert.match(screen.getByRole('status').textContent, /Verification expired/i);
    await act(async () => {
      resolveUpload(Response.json({ files: [{ name: 'sketch.jpg', url: '/api/order-assets/signed', contentType: 'image/jpeg' }] }));
      await Promise.resolve();
    });
    assert.match(screen.getByRole('status').textContent, /Verification expired/i);
    assert.equal(screen.queryByAltText('Reference image: sketch.jpg'), null);
    assert.ok(resetCalls.includes('widget-1'));

    fireEvent.change(screen.getByLabelText(/Wallet style or layout/i), { target: { value: 'Bifold' } });
    fireEvent.change(screen.getByLabelText(/Primary leather color/i), { target: { value: 'Brown' } });
    fireEvent.change(screen.getByLabelText(/Leather material/i), { target: { value: 'Cowhide' } });
    fireEvent.change(screen.getByLabelText(/Tooling design/i), { target: { value: 'Floral' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue to review/i }));

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Ada Lovelace' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '5'.repeat(40) } });
    fireEvent.change(screen.getByLabelText('Extra notes'), { target: { value: 'n'.repeat(300) } });
    fireEvent.click(screen.getByLabelText(/I understand that I am paying/i));
    assert.equal(screen.getByText('40/40').id, 'customer-phone-count');
    assert.equal(screen.getByText('300/300').id, 'order-notes-count');

    act(() => turnstileOptions.callback('turnstile-token-2'));
    fireEvent.click(screen.getByRole('button', { name: /Continue To Secure Square Checkout/i }));
    await waitFor(() => assert.ok(checkoutBody));
    assert.deepEqual(checkoutBody.referenceImages, []);
    assert.equal(checkoutBody.phone, '5'.repeat(40));
    assert.equal(checkoutBody.notes, 'n'.repeat(300));
  } finally {
    global.fetch = originalFetch;
    restoreDom();
  }
});

test('rendered review errors wire ARIA, summary links, and first-invalid focus', async () => {
  installDom('https://twistedcustomleather.com/#custom-order');
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '';
  try {
    const Assistant = await loadRenderedComponent('src/components/custom-order/CustomOrderAssistant.tsx');
    render(React.createElement(Assistant));
    fireEvent.click(screen.getByRole('button', { name: /Continue to customization/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue to review/i }));
    const customizationSummary = screen.getByText('Please fix the following before continuing:').closest('[role="alert"]');
    assert.ok(customizationSummary);
    await waitFor(() => assert.ok(
      dom.window.document.activeElement === customizationSummary,
      `Expected customization summary focus, received ${dom.window.document.activeElement?.outerHTML?.slice(0, 120) ?? 'none'}`,
    ));
    assert.match(customizationSummary.querySelector('a').getAttribute('href'), /^#customization-/u);

    for (const [label, value] of [
      [/Wallet style or layout/i, 'Bifold'],
      [/Primary leather color/i, 'Brown'],
      [/Leather material/i, 'Cowhide'],
      [/Tooling design/i, 'Floral'],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: /Continue to review/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue To Secure Square Checkout/i }));
    const reviewSummary = screen.getByText('Please fix the following before continuing:').closest('[role="alert"]');
    assert.ok(reviewSummary);
    await waitFor(() => assert.ok(
      dom.window.document.activeElement === reviewSummary,
      `Expected review summary focus, received ${dom.window.document.activeElement?.outerHTML?.slice(0, 120) ?? 'none'}`,
    ));
    const name = screen.getByLabelText('Your name');
    assert.equal(name.getAttribute('aria-invalid'), 'true');
    assert.equal(name.getAttribute('aria-describedby'), 'customer-name-error');
    assert.equal(reviewSummary.querySelector('a').getAttribute('href'), '#customer-name');
  } finally {
    restoreDom();
  }
});
