import forge from 'node-forge';
import {
  InvalidPadesSignatureError,
  extractSpanishNifFromCertificate,
  inspectSignedPdf,
} from '@/lib/pdf/padesInspector';

function createTestPkcs7Hex(options?: {
  cn?: string;
  serialNumberAttr?: string;
  issuerCn?: string;
  includeCert?: boolean;
  includeCaChain?: boolean;
  signedPayload?: Buffer;
}): { hex: string; cert: forge.pki.Certificate } {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01AB23CD';
  cert.validity.notBefore = new Date('2025-01-01T00:00:00Z');
  cert.validity.notAfter = new Date('2028-01-01T00:00:00Z');

  const subjectAttrs: forge.pki.CertificateField[] = [
    { name: 'commonName', value: options?.cn ?? 'EMPRESA GESTORA DEMO S.L.' },
  ];
  if (options?.serialNumberAttr) {
    subjectAttrs.push({ type: '2.5.4.5', value: options.serialNumberAttr });
  }

  cert.setSubject(subjectAttrs);
  cert.setIssuer([
    { name: 'commonName', value: options?.issuerCn ?? 'AC Representación FNMT' },
  ]);
  cert.setExtensions([{ name: 'basicConstraints', cA: false }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p7 = forge.pkcs7.createSignedData();
  p7.content = options?.signedPayload
    ? forge.util.createBuffer(options.signedPayload.toString('binary'), 'raw')
    : forge.util.createBuffer('pdf-byte-range-digest', 'utf8');

  if (options?.includeCaChain) {
    const caCert = forge.pki.createCertificate();
    caCert.publicKey = keys.publicKey;
    caCert.serialNumber = '99';
    caCert.validity.notBefore = new Date('2020-01-01T00:00:00Z');
    caCert.validity.notAfter = new Date('2035-01-01T00:00:00Z');
    caCert.setSubject([{ name: 'commonName', value: 'AC Raíz FNMT' }]);
    caCert.setIssuer([{ name: 'commonName', value: 'AC Raíz FNMT' }]);
    caCert.setExtensions([{ name: 'basicConstraints', cA: true }]);
    caCert.sign(keys.privateKey, forge.md.sha256.create());
    p7.addCertificate(caCert);
  }

  if (options?.includeCert !== false) {
    p7.addCertificate(cert);
  }

  p7.addSigner({
    key: keys.privateKey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
    ],
  });
  p7.sign({ detached: true });

  const derBytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
  const hex = Buffer.from(derBytes, 'binary').toString('hex');
  return { hex, cert };
}

function buildRealSignedPdf(
  signerConfigs: Array<Parameters<typeof createTestPkcs7Hex>[0]>,
  options?: { trailingGarbage?: string; padZeros?: number }
): Buffer {
  let content = '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n';

  for (let i = 0; i < signerConfigs.length; i++) {
    const cfg = signerConfigs[i] || {};
    const placeholderLen = 8192;
    const prefix = `${content}2 ${i} obj << /Type /Sig /SubFilter /ETSI.CAdES.detached /ByteRange [0 `;
    const suffixStart = `] /Contents `;
    const tail = ` >> endobj\n%%EOF\n`;

    let b = 0;
    let c = 0;
    let d = tail.length;
    for (let iter = 0; iter < 4; iter++) {
      const rangeStr = `${b} ${c} ${d}`;
      const beforeContents = `${prefix}${rangeStr}${suffixStart}`;
      b = beforeContents.length;
      c = b + placeholderLen + 2; // < + hex + >
      d = tail.length;
    }

    const beforeContents = `${prefix}${b} ${c} ${d}${suffixStart}`;
    const signedPayload = Buffer.concat([
      Buffer.from(beforeContents, 'latin1'),
      Buffer.from(tail, 'latin1'),
    ]);
    const { hex } = createTestPkcs7Hex({ ...cfg, signedPayload });
    const paddedHex = hex.padEnd(placeholderLen, '0');
    content = `${beforeContents}<${paddedHex}>${tail}`;
  }

  if (options?.trailingGarbage) {
    content += options.trailingGarbage;
  }

  return Buffer.from(content, 'latin1');
}

function buildSyntheticSignedPdf(
  pkcs7HexList: string[],
  options?: { trailingGarbage?: string; padZeros?: number }
): Buffer {
  let content = '%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n';

  for (let i = 0; i < pkcs7HexList.length; i++) {
    const hex = pkcs7HexList[i] + '00'.repeat(options?.padZeros ?? 4);
    const prefix = `${content}2 ${i} obj << /Type /Sig /SubFilter /ETSI.CAdES.detached /ByteRange [0 `;
    const suffixStart = `] /Contents `;
    const contentsBlock = `<${hex}>`;
    const tail = ` >> endobj\n%%EOF\n`;

    // Calcular offsets exactos iterando una vez para longitud de dígitos estable
    let b = 0;
    let c = 0;
    let d = tail.length;
    for (let iter = 0; iter < 3; iter++) {
      const rangeStr = `${b} ${c} ${d}`;
      const beforeContents = `${prefix}${rangeStr}${suffixStart}`;
      b = beforeContents.length;
      c = b + contentsBlock.length;
      d = tail.length;
    }

    content = `${prefix}${b} ${c} ${d}${suffixStart}${contentsBlock}${tail}`;
  }

  if (options?.trailingGarbage) {
    content += options.trailingGarbage;
  }

  return Buffer.from(content, 'latin1');
}

describe('padesInspector', () => {
  it('inspecciona un PDF firmado PAdES-BES válido y extrae CN, NIF e issuer', () => {
    const pdf = buildRealSignedPdf([
      {
        cn: 'ALFREDO PRUEBA',
        serialNumberAttr: 'IDCES-12345678Z',
        issuerCn: 'AC FNMT Usuarios',
        includeCaChain: true,
      },
    ]);

    const result = inspectSignedPdf(pdf);

    expect(result.signatureCount).toBe(1);
    expect(result.signatureLevel).toBe('PAdES-BES');
    expect(result.signerCn).toBe('ALFREDO PRUEBA');
    expect(result.signerNif).toBe('12345678Z');
    expect(result.issuerCn).toBe('AC FNMT Usuarios');
    expect(result.certificateSerial.toUpperCase()).toBe('01AB23CD');
    expect(result.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.fileSizeBytes).toBe(pdf.length);
  });

  it('rechaza un PDF manipulado cuyo contenido no coincide con el messageDigest del PKCS#7', () => {
    const pdf = buildRealSignedPdf([{ cn: 'ALFREDO PRUEBA' }]);
    // Alterar un byte dentro del rango firmado (en la cabecera del catálogo)
    const tampered = Buffer.from(pdf);
    const idx = tampered.indexOf('Catalog');
    tampered[idx] = 'X'.charCodeAt(0);
    expect(() => inspectSignedPdf(tampered)).toThrow(/integridad criptográfica/i);
  });

  it('soporta co-firma secuencial (2 firmas) y toma los datos de la última firma', () => {
    const pdf = buildRealSignedPdf([
      {
        cn: 'PRODUCTOR UNO',
        serialNumberAttr: 'VATES-B11111111',
      },
      {
        cn: 'GESTOR DOS - NIF 87654321X',
      },
    ]);
    const result = inspectSignedPdf(pdf);

    expect(result.signatureCount).toBe(2);
    expect(result.signerCn).toBe('GESTOR DOS - NIF 87654321X');
    expect(result.signerNif).toBe('87654321X');
  });

  it('extrae NIF como null si el certificado no contiene serialNumber ni NIF en CN', () => {
    const { cert } = createTestPkcs7Hex({ cn: 'SIN IDENTIFICADOR' });
    expect(extractSpanishNifFromCertificate(cert)).toBeNull();
  });

  it('rechaza buffer vacío o que no empiece por %PDF-', () => {
    expect(() => inspectSignedPdf(Buffer.alloc(0))).toThrow(InvalidPadesSignatureError);
    expect(() => inspectSignedPdf(Buffer.from('NOT-A-PDF'))).toThrow(InvalidPadesSignatureError);
  });

  it('rechaza PDF sin /ByteRange', () => {
    const unsignedPdf = Buffer.from('%PDF-1.4\n1 0 obj << >> endobj\n%%EOF', 'latin1');
    expect(() => inspectSignedPdf(unsignedPdf)).toThrow(/no contiene ninguna firma/i);
  });

  it('rechaza PDF con datos añadidos tras la última firma', () => {
    const { hex } = createTestPkcs7Hex();
    const tampered = buildSyntheticSignedPdf([hex], {
      trailingGarbage: '\n%%TAMPERED_CONTENT_AFTER_SIGNATURE',
    });

    expect(() => inspectSignedPdf(tampered)).toThrow(/datos añadidos después/i);
  });

  it('rechaza PDF con bloque PKCS#7 corrupto', () => {
    const brokenPdf = buildSyntheticSignedPdf(['deadbeef'.repeat(10)]);
    expect(() => inspectSignedPdf(brokenPdf)).toThrow(/corrupto/i);
  });

  it('rechaza PDF con /ByteRange manipulado fuera de rango', () => {
    const badRange = Buffer.from(
      '%PDF-1.4\n/ByteRange [0 10 20 99999] /Contents <' + 'aa'.repeat(20) + '>\n%%EOF',
      'latin1'
    );
    expect(() => inspectSignedPdf(badRange)).toThrow(InvalidPadesSignatureError);
  });

  it('rechaza PDF que excede el tamaño máximo permitido', () => {
    const oversized = Buffer.alloc(15 * 1024 * 1024 + 10);
    oversized.write('%PDF-', 0, 'latin1');
    expect(() => inspectSignedPdf(oversized)).toThrow(/tamaño máximo/i);
  });

  it('rechaza PDF sin bloque /Contents hexadecimal o demasiado corto', () => {
    const noHex = Buffer.from(
      '%PDF-1.4\n/ByteRange [0 32 42 5] NO_HEX_HERE\n%%EOF',
      'latin1'
    );
    expect(() => inspectSignedPdf(noHex)).toThrow(/contenedor criptográfico/i);

    const exactShortHex = buildSyntheticSignedPdf(['abcdef01'], { padZeros: 0 });
    expect(() => inspectSignedPdf(exactShortHex)).toThrow(/vacío o incompleto/i);
  });

  it('rechaza PKCS#7 que no incluye certificado del firmante', () => {
    const pdf = buildRealSignedPdf([{ includeCert: false }]);
    expect(() => inspectSignedPdf(pdf)).toThrow(/no incluye el certificado/i);
  });
});

