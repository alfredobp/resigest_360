# Reglas de Proyecto y Calidad - ResiGest 360

## Desarrollo de Nuevas Features y Modificaciones

1. **Pruebas y Cobertura Obligatoria**:
   - Todo nuevo servicio en `src/services/` o validador en `src/lib/validations/` debe incluir su suite de pruebas unitarias correspondiente en `__tests__`.
   - Se debe garantizar un mínimo del **80% de cobertura** en Statements, Branches, Functions y Lines para cada nueva entidad.
   - El nuevo servicio debe registrarse en `collectCoverageFrom` y `coverageThreshold` en [jest.config.js](file:///c:/Users/Alfredo/Desktop/resigest_360/jest.config.js).
   - Seguir las directrices de la skill [feature-quality-and-testing](file:///c:/Users/Alfredo/Desktop/resigest_360/.agents/skills/feature-quality-and-testing/SKILL.md).

2. **Aislamiento Multi-Tenancy**:
   - Toda consulta a Supabase debe filtrar por `user_id` o pertenencia a las empresas del tenant (`getTenantContext()`).

3. **Verificación Previa a Commit/Push**:
   - Antes de finalizar cualquier tarea, deben ejecutarse y pasar limpiamente:
     - `npm run typecheck`
     - `npm run lint`
     - `npm run test:ci`
