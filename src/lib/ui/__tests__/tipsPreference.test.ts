import { isUiTipsEnabled, shouldRenderUiHint } from '../tipsPreference';

describe('tipsPreference', () => {
  describe('isUiTipsEnabled', () => {
    it('devuelve false por defecto cuando la empresa es null o undefined', () => {
      expect(isUiTipsEnabled(null)).toBe(false);
      expect(isUiTipsEnabled(undefined)).toBe(false);
    });

    it('devuelve false cuando mostrar_ayudas_ui no está definido, es null o es false', () => {
      expect(isUiTipsEnabled({})).toBe(false);
      expect(isUiTipsEnabled({ mostrar_ayudas_ui: undefined })).toBe(false);
      expect(isUiTipsEnabled({ mostrar_ayudas_ui: null })).toBe(false);
      expect(isUiTipsEnabled({ mostrar_ayudas_ui: false })).toBe(false);
    });

    it('devuelve true únicamente cuando mostrar_ayudas_ui es true', () => {
      expect(isUiTipsEnabled({ mostrar_ayudas_ui: true })).toBe(true);
    });
  });

  describe('shouldRenderUiHint', () => {
    it('oculta ayudas en modo simplificado cuando alwaysShow no se especifica o es false', () => {
      expect(shouldRenderUiHint(false)).toBe(false);
      expect(shouldRenderUiHint(false, false)).toBe(false);
    });

    it('muestra ayudas cuando showUiTips es true', () => {
      expect(shouldRenderUiHint(true)).toBe(true);
      expect(shouldRenderUiHint(true, false)).toBe(true);
    });

    it('muestra el contenido siempre cuando alwaysShow es true', () => {
      expect(shouldRenderUiHint(false, true)).toBe(true);
      expect(shouldRenderUiHint(true, true)).toBe(true);
    });
  });
});
