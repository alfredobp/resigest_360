import { rateLimit, clientIp, resetRateLimit } from '../rateLimit';

describe('rateLimit', () => {
  beforeEach(() => resetRateLimit());

  it('usa límite 5/min y reloj real por defecto', () => {
    for (let i = 0; i < 5; i++) expect(rateLimit('def')).toBe(true);
    expect(rateLimit('def')).toBe(false);
  });

  it('permite hasta el límite y bloquea después', () => {
    for (let i = 0; i < 3; i++) expect(rateLimit('k', 3, 1000, 0)).toBe(true);
    expect(rateLimit('k', 3, 1000, 10)).toBe(false);
  });

  it('libera tras la ventana y separa claves', () => {
    for (let i = 0; i < 3; i++) rateLimit('k', 3, 1000, 0);
    expect(rateLimit('k', 3, 1000, 1500)).toBe(true);
    expect(rateLimit('otra', 3, 1000, 10)).toBe(true);
  });

  it('limpia entradas antiguas cuando el mapa crece, conservando las vigentes', () => {
    for (let i = 0; i < 5001; i++) rateLimit(`ip-${i}`, 1, 1000, 0);
    rateLimit('vigente', 1, 100_000, 4900);
    for (let i = 0; i < 5001; i++) rateLimit(`b-${i}`, 1, 100_000, 4900);
    expect(rateLimit('nueva', 1, 1000, 5000)).toBe(true);
    expect(rateLimit('vigente', 1, 100_000, 5000)).toBe(false);
  });

  it('clientIp usa la primera IP de x-forwarded-for o unknown', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
