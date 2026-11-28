import {
  buildAutoFirmaExtraParams,
  type AutoFirmaSignOptions,
} from '@/lib/validations/digitalSignature';

export const AUTOFIRMA_SCRIPT_PATH = '/vendor/autoscript.js';
export const AUTOFIRMA_DOWNLOAD_URL =
  'https://firmaelectronica.gob.es/Home/Descargas.html';

export interface AutoScriptGlobal {
  cargarAppAfirma: (base?: string) => void;
  sign: (
    dataB64: string,
    algorithm: string,
    format: string,
    params: string,
    successCallback: (signatureB64: string, certificateB64?: string) => void,
    errorCallback: (type: string, message: string) => void
  ) => void;
  coSign?: (
    signB64: string,
    dataB64: string | null,
    algorithm: string,
    format: string,
    params: string,
    successCallback: (signatureB64: string, certificateB64?: string) => void,
    errorCallback: (type: string, message: string) => void
  ) => void;
}

declare global {
  interface Window {
    AutoScript?: AutoScriptGlobal;
  }
}

export class AutoFirmaError extends Error {
  readonly code: 'CANCELLED' | 'NOT_INSTALLED' | 'NO_CERTIFICATES' | 'SCRIPT_LOAD' | 'UNKNOWN';

  constructor(
    message: string,
    code: 'CANCELLED' | 'NOT_INSTALLED' | 'NO_CERTIFICATES' | 'SCRIPT_LOAD' | 'UNKNOWN' = 'UNKNOWN'
  ) {
    super(message);
    this.name = 'AutoFirmaError';
    this.code = code;
  }
}

/**
 * Traduce los códigos/mensajes de error de AutoFirma a mensajes claros en español.
 */
export function mapAutoFirmaError(type: string, message: string): AutoFirmaError {
  const combined = `${type || ''} ${message || ''}`.toLowerCase();

  if (
    combined.includes('aocancelledoperationexception') ||
    combined.includes('cancelad') ||
    combined.includes('cancelled')
  ) {
    return new AutoFirmaError(
      'Operación cancelada por el usuario en AutoFirma.',
      'CANCELLED'
    );
  }

  if (
    combined.includes('nocertificates') ||
    combined.includes('no se han encontrado certificados') ||
    combined.includes('sin certificados')
  ) {
    return new AutoFirmaError(
      'No se encontraron certificados digitales válidos en el almacén de tu equipo.',
      'NO_CERTIFICATES'
    );
  }

  if (
    combined.includes('timeout') ||
    combined.includes('connection') ||
    combined.includes('websocket') ||
    combined.includes('no se ha podido conectar') ||
    combined.includes('refused')
  ) {
    return new AutoFirmaError(
      'No se pudo conectar con AutoFirma. Comprueba que la aplicación esté instalada en tu equipo y acepta abrir el enlace "afirma://" en el navegador.',
      'NOT_INSTALLED'
    );
  }

  return new AutoFirmaError(
    message?.trim() || 'Error inesperado durante la firma electrónica con AutoFirma.',
    'UNKNOWN'
  );
}

let scriptLoadPromise: Promise<AutoScriptGlobal> | null = null;

/**
 * Permite resetear el caché interno en tests unitarios.
 */
export function resetAutoFirmaLoaderForTests(): void {
  scriptLoadPromise = null;
}

/**
 * Carga bajo demanda `/vendor/autoscript.js` en el navegador.
 */
export function loadAutoFirmaScript(): Promise<AutoScriptGlobal> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(
      new AutoFirmaError('AutoFirma solo puede ejecutarse en el navegador.', 'SCRIPT_LOAD')
    );
  }

  if (window.AutoScript) {
    return Promise.resolve(window.AutoScript);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise<AutoScriptGlobal>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${AUTOFIRMA_SCRIPT_PATH}"]`
    );

    if (existing) {
      if (window.AutoScript) {
        resolve(window.AutoScript);
        return;
      }
      existing.addEventListener('load', () => {
        if (window.AutoScript) {
          resolve(window.AutoScript);
        } else {
          scriptLoadPromise = null;
          reject(
            new AutoFirmaError(
              'El script de AutoFirma se cargó pero no expuso window.AutoScript.',
              'SCRIPT_LOAD'
            )
          );
        }
      });
      existing.addEventListener('error', () => {
        scriptLoadPromise = null;
        reject(
          new AutoFirmaError(
            'No se pudo cargar el cliente de AutoFirma (/vendor/autoscript.js).',
            'SCRIPT_LOAD'
          )
        );
      });
      return;
    }

    const script = document.createElement('script');
    script.src = AUTOFIRMA_SCRIPT_PATH;
    script.async = true;
    script.onload = () => {
      if (window.AutoScript) {
        resolve(window.AutoScript);
      } else {
        scriptLoadPromise = null;
        reject(
          new AutoFirmaError(
            'El script de AutoFirma se cargó pero no inicializó AutoScript.',
            'SCRIPT_LOAD'
          )
        );
      }
    };
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(
        new AutoFirmaError(
          'No se pudo cargar el cliente de AutoFirma (/vendor/autoscript.js).',
          'SCRIPT_LOAD'
        )
      );
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Invoca AutoFirma en el equipo del usuario para firmar (o co-firmar) un PDF en formato PAdES.
 * Devuelve el PDF firmado codificado en Base64.
 */
export async function signPdfWithAutoFirma(
  pdfBase64: string,
  options?: AutoFirmaSignOptions
): Promise<string> {
  const cleanB64 = pdfBase64.replace(/^data:application\/pdf;base64,/i, '').trim();
  if (!cleanB64) {
    throw new AutoFirmaError('No se proporcionó ningún PDF válido para firmar.', 'UNKNOWN');
  }

  const autoScript = await loadAutoFirmaScript();
  const extraParams = buildAutoFirmaExtraParams(options);

  return new Promise<string>((resolve, reject) => {
    try {
      autoScript.cargarAppAfirma();

      const onSuccess = (signedB64: string) => {
        if (!signedB64 || !signedB64.trim()) {
          reject(
            new AutoFirmaError(
              'AutoFirma finalizó sin devolver el documento firmado.',
              'UNKNOWN'
            )
          );
          return;
        }
        resolve(signedB64.trim());
      };

      const onError = (type: string, message: string) => {
        reject(mapAutoFirmaError(type, message));
      };

      // En PAdES, AutoScript.sign sobre un PDF ya firmado añade una nueva firma incremental
      // preservando las anteriores; usamos sign con algoritmo SHA256withRSA y formato PAdES.
      autoScript.sign(cleanB64, 'SHA256withRSA', 'PAdES', extraParams, onSuccess, onError);
    } catch (err) {
      reject(
        mapAutoFirmaError(
          'JSException',
          err instanceof Error ? err.message : 'Error al invocar AutoFirma'
        )
      );
    }
  });
}

/**
 * Calcula el hash SHA-256 en hexadecimal de un ArrayBuffer usando Web Crypto API.
 */
export async function computeSha256Hex(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return '';
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convierte un ArrayBuffer en Base64 sin desbordar la pila de llamadas.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...slice));
  }
  return btoa(chunks.join(''));
}

/**
 * Convierte una cadena Base64 de un PDF en un Blob `application/pdf`.
 */
export function base64ToPdfBlob(base64: string): Blob {
  const clean = base64.replace(/^data:application\/pdf;base64,/i, '').trim();
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'application/pdf' });
}

