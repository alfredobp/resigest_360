import {
  AutoFirmaError,
  arrayBufferToBase64,
  base64ToPdfBlob,
  computeSha256Hex,
  loadAutoFirmaScript,
  mapAutoFirmaError,
  resetAutoFirmaLoaderForTests,
  signPdfWithAutoFirma,
  type AutoScriptGlobal,
} from '@/lib/signature/autoFirmaClient';

describe('autoFirmaClient', () => {
  const originalWindow = global.window;
  const originalDocument = global.document;

  afterEach(() => {
    resetAutoFirmaLoaderForTests();
    (global as any).window = originalWindow;
    (global as any).document = originalDocument;
  });

  describe('mapAutoFirmaError', () => {
    it('mapea cancelación de usuario', () => {
      const err = mapAutoFirmaError('es.gob.afirma.core.AOCancelledOperationException', 'Cancelado');
      expect(err).toBeInstanceOf(AutoFirmaError);
      expect(err.code).toBe('CANCELLED');
    });

    it('mapea ausencia de certificados', () => {
      const err = mapAutoFirmaError('Error', 'No se han encontrado certificados válidos');
      expect(err.code).toBe('NO_CERTIFICATES');
    });

    it('mapea fallo de conexión / AutoFirma no instalado', () => {
      const err = mapAutoFirmaError('WebSocketError', 'No se ha podido conectar con AutoFirma');
      expect(err.code).toBe('NOT_INSTALLED');
    });

    it('mapea error desconocido preservando mensaje', () => {
      const err = mapAutoFirmaError('Other', 'Fallo genérico');
      expect(err.code).toBe('UNKNOWN');
      expect(err.message).toBe('Fallo genérico');
    });
  });

  describe('loadAutoFirmaScript & signPdfWithAutoFirma', () => {
    it('rechaza si se ejecuta fuera del navegador (SSR)', async () => {
      (global as any).window = undefined;
      (global as any).document = undefined;

      await expect(loadAutoFirmaScript()).rejects.toMatchObject({
        code: 'SCRIPT_LOAD',
      });
    });

    it('invoca window.AutoScript.sign y devuelve Base64 firmado', async () => {
      const mockAutoScript: AutoScriptGlobal = {
        cargarAppAfirma: jest.fn(),
        sign: jest.fn((_data, _alg, _fmt, _params, onSuccess) => {
          onSuccess('U0lHTkVEX1BERg==');
        }),
      };

      (global as any).window = { AutoScript: mockAutoScript };
      (global as any).document = { querySelector: jest.fn() };

      const result = await signPdfWithAutoFirma('data:application/pdf;base64,JVBERi0xLjQ=', {
        includeVisualStamp: true,
        reason: 'Prueba',
      });

      expect(result).toBe('U0lHTkVEX1BERg==');
      expect(mockAutoScript.cargarAppAfirma).toHaveBeenCalledTimes(1);
      expect(mockAutoScript.sign).toHaveBeenCalledWith(
        'JVBERi0xLjQ=',
        'SHA256withRSA',
        'PAdES',
        expect.stringContaining('format=PAdES'),
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('propaga error mapeado cuando AutoFirma invoca errorCallback', async () => {
      const mockAutoScript: AutoScriptGlobal = {
        cargarAppAfirma: jest.fn(),
        sign: jest.fn((_data, _alg, _fmt, _params, _onSuccess, onError) => {
          onError('AOCancelledOperationException', 'Operación cancelada');
        }),
      };

      (global as any).window = { AutoScript: mockAutoScript };
      (global as any).document = { querySelector: jest.fn() };

      await expect(signPdfWithAutoFirma('JVBERi0xLjQ=')).rejects.toMatchObject({
        code: 'CANCELLED',
      });
    });

    it('rechaza si el PDF Base64 de entrada está vacío', async () => {
      await expect(signPdfWithAutoFirma('   ')).rejects.toBeInstanceOf(AutoFirmaError);
    });

    it('inyecta etiqueta script en document.head cuando AutoScript aún no está cargado', async () => {
      const mockAutoScript: AutoScriptGlobal = {
        cargarAppAfirma: jest.fn(),
        sign: jest.fn(),
      };

      const fakeScript: any = {
        src: '',
        async: false,
        onload: null,
        onerror: null,
      };

      (global as any).window = {};
      (global as any).document = {
        querySelector: jest.fn().mockReturnValue(null),
        createElement: jest.fn().mockReturnValue(fakeScript),
        head: {
          appendChild: jest.fn(() => {
            (global as any).window.AutoScript = mockAutoScript;
            fakeScript.onload?.();
          }),
        },
      };

      const loaded = await loadAutoFirmaScript();
      expect(loaded).toBe(mockAutoScript);
    });

    it('rechaza cuando el script falla al cargar o no expone window.AutoScript', async () => {
      const fakeScript: any = { onload: null, onerror: null };
      (global as any).window = {};
      (global as any).document = {
        querySelector: jest.fn().mockReturnValue(null),
        createElement: jest.fn().mockReturnValue(fakeScript),
        head: {
          appendChild: jest.fn(() => {
            fakeScript.onerror?.();
          }),
        },
      };

      await expect(loadAutoFirmaScript()).rejects.toMatchObject({ code: 'SCRIPT_LOAD' });

      // Script carga pero no define window.AutoScript
      (global as any).document.head.appendChild = jest.fn(() => {
        fakeScript.onload?.();
      });
      await expect(loadAutoFirmaScript()).rejects.toMatchObject({ code: 'SCRIPT_LOAD' });
    });

    it('reutiliza etiqueta script existente en DOM y maneja load/error', async () => {
      const mockAutoScript: AutoScriptGlobal = {
        cargarAppAfirma: jest.fn(),
        sign: jest.fn(),
      };
      const listeners: Record<string, () => void> = {};
      const existingScript = {
        addEventListener: jest.fn((ev: string, cb: () => void) => {
          listeners[ev] = cb;
        }),
      };

      (global as any).window = {};
      (global as any).document = {
        querySelector: jest.fn().mockReturnValue(existingScript),
      };

      const p1 = loadAutoFirmaScript();
      (global as any).window.AutoScript = mockAutoScript;
      listeners.load();
      await expect(p1).resolves.toBe(mockAutoScript);

      resetAutoFirmaLoaderForTests();
      (global as any).window = {};
      const p2 = loadAutoFirmaScript();
      listeners.error();
      await expect(p2).rejects.toMatchObject({ code: 'SCRIPT_LOAD' });
    });

    it('rechaza si AutoFirma devuelve firma vacía o lanza excepción síncrona', async () => {
      (global as any).window = {
        AutoScript: {
          cargarAppAfirma: jest.fn(),
          sign: jest.fn((_d, _a, _f, _p, onSuccess) => onSuccess('')),
        },
      };
      (global as any).document = { querySelector: jest.fn() };
      await expect(signPdfWithAutoFirma('JVBERi0=')).rejects.toMatchObject({ code: 'UNKNOWN' });

      (global as any).window = {
        AutoScript: {
          cargarAppAfirma: jest.fn(() => {
            throw new Error('WebSocket refused');
          }),
          sign: jest.fn(),
        },
      };
      await expect(signPdfWithAutoFirma('JVBERi0=')).rejects.toMatchObject({
        code: 'NOT_INSTALLED',
      });
    });
  });

  describe('binary helpers', () => {
    it('convierte ArrayBuffer <-> Base64 <-> Blob y calcula SHA-256', async () => {
      const raw = new TextEncoder().encode('%PDF-1.4 test');
      const b64 = arrayBufferToBase64(raw.buffer);
      expect(b64).toBe(Buffer.from('%PDF-1.4 test').toString('base64'));

      const blob = base64ToPdfBlob(`data:application/pdf;base64,${b64}`);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBe(raw.byteLength);

      const hash = await computeSha256Hex(raw.buffer);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

