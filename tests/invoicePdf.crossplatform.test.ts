import { toSafeInvoiceFileName } from '../app/electron/invoice/invoicePdf';

describe('invoice file naming cross-platform safety', () => {
  test('replaces filesystem-reserved characters', () => {
    const safe = toSafeInvoiceFileName('FAC/2026:03*27?A|B\\C');
    expect(safe).toBe('FAC-2026-03-27-A-B-C');
  });

  test('falls back to invoice when value is empty/invalid', () => {
    expect(toSafeInvoiceFileName('   ')).toBe('invoice');
    expect(toSafeInvoiceFileName(null)).toBe('invoice');
  });
});
