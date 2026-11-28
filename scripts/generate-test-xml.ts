import { siraService } from '../src/services/siraService';
import * as fs from 'fs';
import * as path from 'path';

const sampleDoc = {
  id: 999,
  numero_documento: 'DCS04999999999920260000001',
  fecha_recogida: '2026-02-15',
  peligrosidad: 'peligroso',
  codigo_ler: '15 01 10*',
  descripcion_residuo: 'Envases contaminados con disolventes',
  cantidad: 1250.5,
  operacion_tratamiento: 'R13',
  company: {
    cif: 'B12345678',
    razon_social: 'EcoGestión 360 SL',
    nima: '2800012345',
    domicilio_instalacion: 'Polígono Industrial Nave 1',
    provincia_instalacion: 'Sevilla',
    telefono: '954000111',
    email: 'info@ecogestion360.es'
  },
  productor_cif: 'B12345678',
  productor_razon_social: 'EcoGestión 360 SL',
  productor_nima: '2800012345',
  productor_direccion: 'Polígono Industrial Nave 1',
  productor_codigo_postal: '41001',
  productor_municipio: 'Sevilla',
  productor_provincia: 'Sevilla',
  productor_telefono: '954000111',
  gestor_cif: 'A87654321',
  gestor_razon_social: 'Tratamientos del Sur SA',
  gestor_nima: '4100098765',
  gestor_direccion: 'Carretera Isla Menor Km 4',
  gestor_codigo_postal: '41014',
  gestor_municipio: 'Dos Hermanas',
  gestor_provincia: 'Sevilla',
  gestor_telefono: '955999888',
  transportista_cif: 'B99887766',
  transportista_razon_social: 'TransEco Andalucía SL',
  transportista_nima: '4100055443',
  transportista_direccion: 'Avenida del Transporte 12',
  transportista_codigo_postal: '41020',
  transportista_municipio: 'Sevilla',
  transportista_provincia: 'Sevilla',
  transportista_telefono: '954332211'
};

const xml = siraService.generateDIXml(sampleDoc);
const outPath = path.join(__dirname, 'sample-generated-di.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log('✅ XML generado correctamente en:', outPath);
console.log('--- Contenido XML generado ---');
console.log(xml);
