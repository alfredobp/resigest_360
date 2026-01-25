# Análisis de Cumplimiento E3L v3.6 para SIRA

## Fecha: 2026-01-25

## Resumen
Este documento analiza el cumplimiento de nuestro XML `wasteDCS` con los esquemas oficiales E3L v3.6 de MITECO.

## Archivos XSD Oficiales Copiados

✅ **e3l-waste.xsd** (111 KB) - Schema principal de residuos
✅ **e3l-wasteSupport.xsd** (834 KB) - Tipos de soporte para residuos
✅ **e3l-common.xsd** (2.4 MB) - Elementos comunes
✅ **xml.xsd** (5.6 KB) - Schema XML estándar

## Namespace Oficial

```xml
xmlns="e3l://eterproject.org/3.0/waste"
xmlns:wassup="e3l://eterproject.org/3.0/wasteSupport"
xmlns:common="e3l://eterproject.org/3.0/common"
```

## Estructura del Elemento `wasteDCS`

### Secuencia de Elementos (según XSD línea 647+)

1. **DCSRepresentationData** (opcional) - Datos del representante
2. **DCSTransferOperatorData** (obligatorio) - Datos del operador del traslado
   - Tipo: `wassup:wasteTransferOperatorCenterEntityType`
3. **DCSProducerData** (obligatorio) - Datos de la instalación de origen
   - Tipo: `wassup:wasteProducerCenterEntityType`
4. **DCSAdresseeData** (obligatorio) - Datos de la instalación de destino
   - Tipo: `wassup:wasteManagerCenterEntityType`
5. **DCSResidueData** (obligatorio, puede ser múltiple) - Datos del residuo
   - **DCSProducerResidueIdentification** - Identificación por el productor
   - **DCSAdresseeResidueIdentification** - Identificación por el destinatario
   - **DCSOtherResidueData** - Otros datos del residuo
     - **DCSDA** - Número del Documento de Aceptación
     - **DCSClearWeight** - Peso neto
     - **dangerousWaste** - Residuo peligroso (S/N)

### Atributos del Elemento `wasteDCS`

Según el schema, los atributos principales son:
- **DCSCode** - Código del documento
- **DCSPhase** - Fase del DCS (R=Remitente, D=Destinatario, T=Transferencia)
  - R: Fase remitente (solo parte A)
  - D: Fase destinatario (parte A+B)
  - T: Gestor actúa en representación del origen
- **DCSYear** - Año del documento
- **DCSDate** - Fecha del documento
- **DCSStartDate** - Fecha de inicio del traslado
- **DCSRegional** - Traslado regional (S/N)
- **DCSSendtoOriginOrDestinationAuthority** - Enviar a autoridad (S/N)

## Estado Actual de Nuestro XML

### ✅ Elementos Correctos

1. Estructura general del `wasteDCS`
2. Atributos principales (DCSCode, DCSPhase, DCSYear, etc.)
3. Secuencia de elementos (Operator → Producer → Adressee → Residue)
4. Uso de valores S/N para booleanos

### ⚠️ Elementos a Verificar

1. **entityId** al inicio - Verificar si es necesario según el schema
2. **Estructura interna de cada entidad** - Verificar tipos complejos
3. **residueBag** - Verificar si es el elemento correcto o si falta información
4. **Namespaces** - Asegurar que se usan los namespaces correctos

## Próximos Pasos

1. ✅ Copiar XSD oficiales a `src/services/`
2. 🔄 Actualizar `siraService.ts` con namespaces correctos
3. 🔄 Crear validador XML contra XSD
4. 🔄 Verificar estructura de tipos complejos (entityId, entityFJ, etc.)
5. 🔄 Probar con SIRA

## Notas Importantes

- El DCS debe ser **monoresiduo** para traslados entre Comunidades Autónomas
- Para traslados internos en una CCAA, consultar si se permite multiresiduo
- La fase "R" (Remitente) es la que usamos actualmente
- Los tipos complejos están definidos en `e3l-wasteSupport.xsd`

## Referencias

- **Documentación oficial**: E3L v3.6 MITECO
- **XSD principal**: `e3l-waste.xsd`
- **Tipos de soporte**: `e3l-wasteSupport.xsd`
- **Elementos comunes**: `e3l-common.xsd`
