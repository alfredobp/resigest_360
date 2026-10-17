-- =====================================================
-- MIGRATION: Catálogo Completo LER (Lista Europea de Residuos)
-- Decisión 2000/532/CE / Orden MAM/304/2002
-- Generado automáticamente con todos los códigos oficiales (837 códigos)
-- =====================================================

-- 1. Asegurar columnas de categorización completa en public.waste_types
ALTER TABLE public.waste_types ADD COLUMN IF NOT EXISTS peligroso BOOLEAN DEFAULT false;
ALTER TABLE public.waste_types ADD COLUMN IF NOT EXISTS capitulo_codigo VARCHAR(10);
ALTER TABLE public.waste_types ADD COLUMN IF NOT EXISTS capitulo_titulo TEXT;
ALTER TABLE public.waste_types ADD COLUMN IF NOT EXISTS subcapitulo_codigo VARCHAR(10);
ALTER TABLE public.waste_types ADD COLUMN IF NOT EXISTS subcapitulo_titulo TEXT;

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_waste_types_peligroso ON public.waste_types(peligroso);
CREATE INDEX IF NOT EXISTS idx_waste_types_capitulo ON public.waste_types(capitulo_codigo);
CREATE INDEX IF NOT EXISTS idx_waste_types_activo ON public.waste_types(activo);

-- 2. Inserción / Actualización del Catálogo Completo LER

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 01 01',
  'Residuos de la extracción de minerales metálicos',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 01',
  'Residuos de la extracción de minerales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 01 02',
  'Residuos de la extracción de minerales no metálicos',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 01',
  'Residuos de la extracción de minerales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 03 04*',
  'Estériles que generan ácido procedentes de la transformación de sulfuros',
  'peligroso',
  true,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 03',
  'Residuos de la transformación física y química de minerales metálicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 03 05*',
  'Otros estériles que contienen sustancias peligrosas',
  'peligroso',
  true,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 03',
  'Residuos de la transformación física y química de minerales metálicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 03 06',
  'Estériles distintos de los mencionados en los códigos 01 03 04 y 01 03 05',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 03',
  'Residuos de la transformación física y química de minerales metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 03 07*',
  'Otros residuos que contienen sustancias peligrosas procedentes de la transformación física y química de minerales metálicos',
  'peligroso',
  true,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 03',
  'Residuos de la transformación física y química de minerales metálicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 03 08',
  'Residuos de polvo y arenilla distintos de los mencionados en el código 01 03 07',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 03',
  'Residuos de la transformación física y química de minerales metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 03 09',
  'Lodos rojos de la producción de alúmina distintos de los mencionados en el código 01 03 07',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 03',
  'Residuos de la transformación física y química de minerales metálicos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 03 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 03',
  'Residuos de la transformación física y química de minerales metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 07*',
  'Residuos que contienen sustancias peligrosas procedentes de la transformación física y química de minerales no metálicos',
  'peligroso',
  true,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 08',
  'Residuos de grava y rocas trituradas distintos de los mencionados en el código 01 04 07',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 09',
  'Residuos de arena y arcillas',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 10',
  'Residuos de polvo y arenilla distintos de los mencionados en el código 01 04 07',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 11',
  'Residuos de la transformación de potasa y sal gema distintos de los mencionados en el código 01 04 07',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 12',
  'Estériles y otros residuos del lavado y limpieza de minerales distintos de los mencionados en el código 01 04 07 y 01 04 11',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 13',
  'Residuos del corte y serrado de piedra distintos de los mencionados en el código 01 04 07',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 04 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 04',
  'Residuos de la transformación física y química de minerales no metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 05 04',
  'Lodos y residuos de perforaciones que contienen agua dulce',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 05',
  'Lodos y otros residuos de perforaciones',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 05 05*',
  'Lodos y residuos de perforaciones que contienen hidrocarburos',
  'peligroso',
  true,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 05',
  'Lodos y otros residuos de perforaciones',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 05 06*',
  'Lodos y otros residuos de perforaciones que contienen sustancias peligrosas',
  'peligroso',
  true,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 05',
  'Lodos y otros residuos de perforaciones',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 05 07',
  'Lodos y residuos de perforaciones que contienen sales de bario distintos de los mencionados en los códigos 01 05 05 y 01 05 06',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 05',
  'Lodos y otros residuos de perforaciones',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 05 08',
  'Lodos y residuos de perforaciones que contienen cloruros distintos de los mencionados en los códigos 01 05 05 y 01 05 06',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 05',
  'Lodos y otros residuos de perforaciones',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '01 05 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '01',
  'Residuos de la prospección, extracción de minas y canteras y tratamientos físicos y químicos de minerales',
  '01 05',
  'Lodos y otros residuos de perforaciones',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 01',
  'Lodos de lavado y limpieza',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 02',
  'Residuos de tejidos de animales',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 03',
  'Residuos de tejidos de vegetales',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 04',
  'Residuos de plásticos (excepto embalajes)',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 06',
  'Heces de animales, orina y estiércol (incluida paja podrida) y efluentes recogidos selectivamente y tratados fuera del lugar donde se generan',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 07',
  'Residuos de la silvicultura',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 08*',
  'Residuos agroquímicos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 09',
  'Residuos agroquímicos distintos de los mencionados en el código 02 01 08',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 10',
  'Residuos metálicos',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 01',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 02 01',
  'Lodos de lavado y limpieza',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 02',
  'Residuos de la preparación y elaboración de carne, pescado y otros alimentos de origen animal',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 02 02',
  'Residuos de tejidos de animales',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 02',
  'Residuos de la preparación y elaboración de carne, pescado y otros alimentos de origen animal',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 02 03',
  'Materiales inadecuados para el consumo o la elaboración',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 02',
  'Residuos de la preparación y elaboración de carne, pescado y otros alimentos de origen animal',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 02 04',
  'Lodos del tratamiento in situ de efluentes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 02',
  'Residuos de la preparación y elaboración de carne, pescado y otros alimentos de origen animal',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 02',
  'Residuos de la preparación y elaboración de carne, pescado y otros alimentos de origen animal',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 03 01',
  'Lodos de lavado, limpieza, pelado, centrifugado y separación',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 03',
  'Residuos de la preparación y elaboración de frutas, hortalizas, cereales, aceites comestibles, cacao, café, té y tabaco; producción de conservas; producción de levadura y extracto de levadura, preparación y fermentación de melazas',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 03 02',
  'Residuos de conservantes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 03',
  'Residuos de la preparación y elaboración de frutas, hortalizas, cereales, aceites comestibles, cacao, café, té y tabaco; producción de conservas; producción de levadura y extracto de levadura, preparación y fermentación de melazas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 03 03',
  'Residuos de la extracción con disolventes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 03',
  'Residuos de la preparación y elaboración de frutas, hortalizas, cereales, aceites comestibles, cacao, café, té y tabaco; producción de conservas; producción de levadura y extracto de levadura, preparación y fermentación de melazas',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 03 04',
  'Materiales inadecuados para el consumo o la elaboración',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 03',
  'Residuos de la preparación y elaboración de frutas, hortalizas, cereales, aceites comestibles, cacao, café, té y tabaco; producción de conservas; producción de levadura y extracto de levadura, preparación y fermentación de melazas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 03 05',
  'Lodos del tratamiento in situ de efluentes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 03',
  'Residuos de la preparación y elaboración de frutas, hortalizas, cereales, aceites comestibles, cacao, café, té y tabaco; producción de conservas; producción de levadura y extracto de levadura, preparación y fermentación de melazas',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 03 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 03',
  'Residuos de la preparación y elaboración de frutas, hortalizas, cereales, aceites comestibles, cacao, café, té y tabaco; producción de conservas; producción de levadura y extracto de levadura, preparación y fermentación de melazas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 04 01',
  'Tierra procedente de la limpieza y lavado de la remolacha',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 04',
  'Residuos de la elaboración de azúcar',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 04 02',
  'Carbonato cálcico fuera de especificación',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 04',
  'Residuos de la elaboración de azúcar',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 04 03',
  'Lodos del tratamiento in situ de efluentes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 04',
  'Residuos de la elaboración de azúcar',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 04 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 04',
  'Residuos de la elaboración de azúcar',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 05 01',
  'Materiales inadecuados para el consumo o la elaboración',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 05',
  'Residuos de la industria de productos lácteos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 05 02',
  'Lodos del tratamiento in situ de efluentes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 05',
  'Residuos de la industria de productos lácteos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 05 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 05',
  'Residuos de la industria de productos lácteos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 06 01',
  'Materiales inadecuados para el consumo o la elaboración',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 06',
  'Residuos de la industria de panadería y pastelería',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 06 02',
  'Residuos de conservantes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 06',
  'Residuos de la industria de panadería y pastelería',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 06 03',
  'Lodos del tratamiento in situ de efluentes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 06',
  'Residuos de la industria de panadería y pastelería',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 06 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 06',
  'Residuos de la industria de panadería y pastelería',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 07 01',
  'Residuos de lavado, limpieza y reducción mecánica de materias primas',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 07',
  'Residuos de la producción de bebidas alcohólicas y no alcohólicas (excepto café, té y cacao)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 07 02',
  'Residuos de la destilación de alcoholes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 07',
  'Residuos de la producción de bebidas alcohólicas y no alcohólicas (excepto café, té y cacao)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 07 03',
  'Residuos del tratamiento químico',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 07',
  'Residuos de la producción de bebidas alcohólicas y no alcohólicas (excepto café, té y cacao)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 07 04',
  'Materiales inadecuados para el consumo o la elaboración',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 07',
  'Residuos de la producción de bebidas alcohólicas y no alcohólicas (excepto café, té y cacao)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 07 05',
  'Lodos del tratamiento in situ de efluentes',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 07',
  'Residuos de la producción de bebidas alcohólicas y no alcohólicas (excepto café, té y cacao)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '02 07 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '02',
  'Residuos de la agricultura, horticultura, acuicultura, silvicultura, caza y pesca; residuos de la preparación y elaboración de alimentos',
  '02 07',
  'Residuos de la producción de bebidas alcohólicas y no alcohólicas (excepto café, té y cacao)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 01 01',
  'Residuos de corteza y corcho',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 01',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 01 04*',
  'Serrín, virutas, recortes, madera, tableros de partículas y chapas que contienen sustancias peligrosas',
  'peligroso',
  true,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 01',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 01 05',
  'Serrín, virutas, recortes, madera, tableros de partículas y chapas distintos de los mencionados en el código 03 01 04',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 01',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 01',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 02 01*',
  'Conservantes de la madera orgánicos no halogenados',
  'peligroso',
  true,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 02',
  'Residuos de los tratamientos de conservación de la madera',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 02 02*',
  'Conservantes de la madera organoclorados',
  'peligroso',
  true,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 02',
  'Residuos de los tratamientos de conservación de la madera',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 02 03*',
  'Conservantes de la madera organometálicos',
  'peligroso',
  true,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 02',
  'Residuos de los tratamientos de conservación de la madera',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 02 04*',
  'Conservantes de la madera inorgánicos',
  'peligroso',
  true,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 02',
  'Residuos de los tratamientos de conservación de la madera',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 02 05*',
  'Otros conservantes de la madera que contienen sustancias peligrosas',
  'peligroso',
  true,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 02',
  'Residuos de los tratamientos de conservación de la madera',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 02 99',
  'Conservantes de la madera no especificados en otra categoría',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 02',
  'Residuos de los tratamientos de conservación de la madera',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 01',
  'Residuos de corteza y madera',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 02',
  'Lodos de lejías verdes (procedentes de la recuperación de lejías de cocción)',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 05',
  'Lodos de destintado procedentes del reciclado de papel',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 07',
  'Desechos, separados mecánicamente, de pasta elaborada a partir de residuos de papel y cartón',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 08',
  'Residuos procedentes de la clasificación de papel y cartón destinados al reciclado',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 09',
  'Residuos de lodos calizos',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 10',
  'Desechos de fibras y lodos de fibras, de materiales de carga y de estucado, obtenidos por separación mecánica',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 11',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 03 03 10',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '03 03 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '03',
  'Residuos de la transformación de la madera y de la producción de tableros y muebles, pasta de papel, papel y cartón',
  '03 03',
  'Residuos de la producción y transformación de pasta de papel, papel y cartón',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 01',
  'Carnazas y serrajes de encalado',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 02',
  'Residuos de encalado',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 03*',
  'Residuos de desengrasado que contienen disolventes sin fase líquida',
  'peligroso',
  true,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 04',
  'Residuos líquidos de curtición que contienen cromo',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 05',
  'Residuos líquidos de curtición que no contienen cromo',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 06',
  'Lodos, en particular los procedentes del tratamiento in situ de efluentes, que contienen cromo',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 07',
  'Lodos, en particular los procedentes del tratamiento in situ de efluentes, que no contienen cromo',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 08',
  'Residuos de piel curtida (serrajes, rebajaduras, recortes, polvo de esmerilado) que contienen cromo',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 09',
  'Residuos de confección y acabado',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 01',
  'Residuos de las industrias del cuero y de la piel',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 09',
  'Residuos de materiales compuestos (tejidos impregnados, elastómeros, plastómeros)',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 10',
  'Materia orgánica de productos naturales (por ejemplo grasa, cera)',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 14*',
  'Residuos del acabado que contienen disolventes orgánicos',
  'peligroso',
  true,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 15',
  'Residuos del acabado distintos de los especificados en el código 04 02 14',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 16*',
  'Colorantes y pigmentos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 17',
  'Colorantes y pigmentos distintos de los mencionados en el código 04 02 16',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 19*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 20',
  'Lodos del tratamiento in situ de efluentes distintos de los mencionados en el código 04 02 19',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 21',
  'Residuos de fibras textiles no procesadas',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 22',
  'Residuos de fibras textiles procesadas',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '04 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '04',
  'Residuos de las industrias del cuero, de la piel y textil',
  '04 02',
  'Residuos de la industria textil',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 02*',
  'Lodos de desalación',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 03*',
  'Lodos de fondos de tanques',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 04*',
  'Lodos de alquil ácido',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 05*',
  'Derrames de hidrocarburos',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 06*',
  'Lodos oleosos procedentes de operaciones de mantenimiento de plantas o equipos',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 07*',
  'Alquitranes ácidos',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 08*',
  'Otros alquitranes',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 09*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 10',
  'Lodos del tratamiento in situ de efluentes distintos de los mencionados en el código 05 01 09',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 11*',
  'Residuos procedentes de la limpieza de combustibles con bases',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 12*',
  'Hidrocarburos que contienen ácidos',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 13',
  'Lodos procedentes del agua de alimentación de calderas',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 14',
  'Residuos de columnas de refrigeración',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 15*',
  'Arcillas de filtración usadas',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 16',
  'Residuos que contienen azufre procedentes de la desulfuración del petróleo',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 17',
  'Betunes',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 01',
  'Residuos del refino del petróleo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 06 01*',
  'Alquitranes ácidos',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 06',
  'Residuos del tratamiento pirolítico del carbón',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 06 03*',
  'Otros alquitranes',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 06',
  'Residuos del tratamiento pirolítico del carbón',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 06 04',
  'Residuos de columnas de refrigeración',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 06',
  'Residuos del tratamiento pirolítico del carbón',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 06 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 06',
  'Residuos del tratamiento pirolítico del carbón',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 07 01*',
  'Residuos que contienen mercurio',
  'peligroso',
  true,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 07',
  'Residuos de la purificación y transporte del gas natural',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 07 02',
  'Residuos que contienen azufre',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 07',
  'Residuos de la purificación y transporte del gas natural',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '05 07 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '05',
  'Residuos del refino del petróleo, de la purificación del gas natural y del tratamiento pirolítico del carbón',
  '05 07',
  'Residuos de la purificación y transporte del gas natural',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 01 01*',
  'Ácido sulfúrico y ácido sulfuroso',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de ácidos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 01 02*',
  'Ácido clorhídrico',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de ácidos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 01 03*',
  'Ácido fluorhídrico',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de ácidos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 01 04*',
  'Ácido fosfórico y ácido fosforoso',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de ácidos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 01 05*',
  'Ácido nítrico y ácido nitroso',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de ácidos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 01 06*',
  'Otros ácidos',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de ácidos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de ácidos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 02 01*',
  'Hidróxido cálcico',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 02',
  'Residuos de la FFDU de bases',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 02 03*',
  'Hidróxido amónico',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 02',
  'Residuos de la FFDU de bases',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 02 04*',
  'Hidróxido potásico e hidróxido sódico',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 02',
  'Residuos de la FFDU de bases',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 02 05*',
  'Otras bases',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 02',
  'Residuos de la FFDU de bases',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 02',
  'Residuos de la FFDU de bases',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 03 11*',
  'Sales sólidas y soluciones que contienen cianuros',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 03',
  'Residuos de la FFDU de sales y sus soluciones y de óxidos metálicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 03 13*',
  'Sales sólidas y soluciones que contienen metales pesados',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 03',
  'Residuos de la FFDU de sales y sus soluciones y de óxidos metálicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 03 14',
  'Sales sólidas y soluciones distintas de las mencionadas en los códigos 06 03 11 y 06 03 13',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 03',
  'Residuos de la FFDU de sales y sus soluciones y de óxidos metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 03 15*',
  'Óxidos metálicos que contienen metales pesados',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 03',
  'Residuos de la FFDU de sales y sus soluciones y de óxidos metálicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 03 16',
  'Óxidos metálicos distintos de los mencionados en el código 06 03 15',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 03',
  'Residuos de la FFDU de sales y sus soluciones y de óxidos metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 03 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 03',
  'Residuos de la FFDU de sales y sus soluciones y de óxidos metálicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 04 03*',
  'Residuos que contienen arsénico',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 04',
  'Residuos que contienen metales distintos de los mencionados en el subcapítulo 06 03',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 04 04*',
  'Residuos que contienen mercurio',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 04',
  'Residuos que contienen metales distintos de los mencionados en el subcapítulo 06 03',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 04 05*',
  'Residuos que contienen otros metales pesados',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 04',
  'Residuos que contienen metales distintos de los mencionados en el subcapítulo 06 03',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 04 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 04',
  'Residuos que contienen metales distintos de los mencionados en el subcapítulo 06 03',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 05 02*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 05',
  'Lodos del tratamiento in situ de efluentes',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 05 03',
  'Lodos del tratamiento in situ de efluentes distintos de los mencionados en el código 06 05 02',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 05',
  'Lodos del tratamiento in situ de efluentes',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 06 02*',
  'Residuos que contienen sulfuros peligrosos',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 06',
  'Residuos de la FFDU de productos químicos que contienen azufre, de procesos químicos del azufre y de procesos de desulfuración',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 06 03',
  'Residuos que contienen sulfuros distintos de los mencionados en el código 06 06 02',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 06',
  'Residuos de la FFDU de productos químicos que contienen azufre, de procesos químicos del azufre y de procesos de desulfuración',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 06 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 06',
  'Residuos de la FFDU de productos químicos que contienen azufre, de procesos químicos del azufre y de procesos de desulfuración',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 07 01*',
  'Residuos de electrólisis que contienen amianto',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 07',
  'Residuos de la FFDU de halógenos y de procesos químicos de los halógenos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 07 02*',
  'Carbón activo procedente de la producción de cloro',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 07',
  'Residuos de la FFDU de halógenos y de procesos químicos de los halógenos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 07 03*',
  'Lodos de sulfato bárico que contienen mercurio',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 07',
  'Residuos de la FFDU de halógenos y de procesos químicos de los halógenos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 07 04*',
  'Soluciones y ácidos, por ejemplo, ácido de contacto',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 07',
  'Residuos de la FFDU de halógenos y de procesos químicos de los halógenos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 07 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 07',
  'Residuos de la FFDU de halógenos y de procesos químicos de los halógenos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 08 02*',
  'Residuos que contienen clorosilanos peligrosos',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 08',
  'Residuos de la FFDU del silicio y sus derivados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 08 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 08',
  'Residuos de la FFDU del silicio y sus derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 09 02',
  'Escorias de fósforo',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 09',
  'Residuos de la FFDU de productos químicos que contienen fósforo y de procesos químicos del fósforo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 09 03*',
  'Residuos cálcicos de reacción que contienen o están contaminados con sustancias peligrosas',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 09',
  'Residuos de la FFDU de productos químicos que contienen fósforo y de procesos químicos del fósforo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 09 04',
  'Residuos cálcicos de reacción distintos de los mencionados en el código 06 09 03',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 09',
  'Residuos de la FFDU de productos químicos que contienen fósforo y de procesos químicos del fósforo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 09 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 09',
  'Residuos de la FFDU de productos químicos que contienen fósforo y de procesos químicos del fósforo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 10 02*',
  'Residuos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 10',
  'Residuos de la FFDU de productos químicos que contienen nitrógeno, de procesos químicos del nitrógeno y de la fabricación de fertilizantes',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 10 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 10',
  'Residuos de la FFDU de productos químicos que contienen nitrógeno, de procesos químicos del nitrógeno y de la fabricación de fertilizantes',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 11 01',
  'Residuos cálcicos de reacción procedentes de la producción de dióxido de titanio',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 11',
  'Residuos de la fabricación de pigmentos inorgánicos y o pacificantes',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 11 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 11',
  'Residuos de la fabricación de pigmentos inorgánicos y o pacificantes',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 13 01*',
  'Productos fitosanitarios inorgánicos, conservantes de la madera y otros biocidas',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 13',
  'Residuos de procesos químicos inorgánicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 13 02*',
  'Carbón activo usado (excepto el código 06 07 02)',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 13',
  'Residuos de procesos químicos inorgánicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 13 03',
  'Negro de carbono',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 13',
  'Residuos de procesos químicos inorgánicos no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 13 04*',
  'Residuos procedentes de la transformación del amianto',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 13',
  'Residuos de procesos químicos inorgánicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 13 05*',
  'Hollín',
  'peligroso',
  true,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 13',
  'Residuos de procesos químicos inorgánicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '06 13 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '06',
  'Residuos de procesos químicos inorgánicos',
  '06 13',
  'Residuos de procesos químicos inorgánicos no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 01*',
  'Líquidos de limpieza y licores madre acuosos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 03*',
  'Disolventes, líquidos de limpieza y licores madre organo halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 04*',
  'Otros disolventes, líquidos de limpieza y licores madre orgánicos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 07*',
  'Residuos de reacción y de destilación halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 08*',
  'Otros residuos de reacción y de destilación',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 09*',
  'Tortas de filtración y absorbentes usados halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 10*',
  'Otras tortas de filtración y absorbentes usados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 11*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 12',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 07 01 11',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 01',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de productos químicos orgánicos de base',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 01*',
  'Líquidos de limpieza y licores madre acuosos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 03*',
  'Disolventes, líquidos de limpieza y licores madre organohalogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 04*',
  'Otros disolventes, líquidos de limpieza y licores madre orgánicos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 07*',
  'Residuos de reacción y de destilación halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 08*',
  'Otros residuos de reacción y de destilación',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 09*',
  'Tortas de filtración y absorbentes usados halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 10*',
  'Otras tortas de filtración y absorbentes usados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 11*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 12',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 07 02 11',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 13',
  'Residuos de plástico',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 14*',
  'Residuos procedentes de aditivos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 15',
  'Residuos procedentes de aditivos, distintos de los especificados en el código 07 02 14',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 16*',
  'Residuos que contienen siliconas peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 17',
  'Residuos que contienen siliconas distintas de las mencionadas en el código 07 02 16',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 02',
  'Residuos de la FFDU de plásticos, caucho sintético y fibras artificiales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 01*',
  'Líquidos de limpieza y licores madre acuosos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 03*',
  'Disolventes, líquidos de limpieza y licores madre organohalogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 04*',
  'Otros disolventes, líquidos de limpieza y licores madre orgánicos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 07*',
  'Residuos de reacción y de destilación halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 08*',
  'Otros residuos de reacción y de destilación',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 09*',
  'Tortas de filtración y absorbentes usados halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 10*',
  'Otras tortas de filtración y absorbentes usados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 11*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 12',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 07 03 11',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 03 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 03',
  'Residuos de la FFDU de tintes y pigmentos orgánicos (excepto los del subcapítulo 06 11)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 01*',
  'Líquidos de limpieza y licores madre acuosos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 03*',
  'Disolventes, líquidos de limpieza y licores madre organohalogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 04*',
  'Otros disolventes, líquidos de limpieza y licores madre orgánicos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 07*',
  'Residuos de reacción y de destilación halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 08*',
  'Otros residuos de reacción y de destilación',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 09*',
  'Tortas de filtración y absorbentes usados halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 10*',
  'Otras tortas de filtración y absorbentes usados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 11*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 12',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 07 04 11',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 13*',
  'Residuos sólidos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 04 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 04',
  'Residuos de la FFDU de productos fitosanitarios orgánicos (excepto los de los códigos 02 01 08 y 02 01 09), de conservantes de la madera (excepto los del subcapítulo 03 02) y de otros biocidas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 01*',
  'Líquidos de limpieza y licores madre acuosos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 03*',
  'Disolventes, líquidos de limpieza y licores madre organohalogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 04*',
  'Otros disolventes, líquidos de limpieza y licores madre orgánicos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 07*',
  'Residuos de reacción y de destilación halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 08*',
  'Otros residuos de reacción y de destilación',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 09*',
  'Tortas de filtración y absorbentes usados halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 10*',
  'Otras tortas de filtración y absorbentes usados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 11*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 12',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 07 05 11',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 13*',
  'Residuos sólidos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 14',
  'Residuos sólidos distintos de los especificados en el código 07 05 13',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 05 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 05',
  'Residuos de la FFDU de productos farmacéuticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 01*',
  'Líquidos de limpieza y licores madre acuosos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 03*',
  'Disolventes, líquidos de limpieza y licores madre organohalogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 04*',
  'Otros disolventes, líquidos de limpieza y licores madre orgánicos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 07*',
  'Residuos de reacción y de destilación halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 08*',
  'Otros residuos de reacción y de destilación',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 09*',
  'Tortas de filtración y absorbentes usados halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 10*',
  'Otras tortas de filtración y absorbentes usados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 11*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 12',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 07 06 11',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 06 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 06',
  'Residuos de la FFDU de grasas, jabones, detergentes, desinfectantes y cosméticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 01*',
  'Líquidos de limpieza y licores madre acuosos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 03*',
  'Disolventes, líquidos de limpieza y licores madre organohalogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 04*',
  'Otros disolventes, líquidos de limpieza y licores madre orgánicos',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 07*',
  'Residuos de reacción y de destilación halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 08*',
  'Otros residuos de reacción y de destilación',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 09*',
  'Tortas de filtración y absorbentes usados halogenados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 10*',
  'Otras tortas de filtración y absorbentes usados',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 11*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 12',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 07 07 11',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '07 07 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '07',
  'Residuos de procesos químicos orgánicos',
  '07 07',
  'Residuos de la FFDU de productos químicos resultantes de la química fina y productos químicos no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 11*',
  'Residuos de pintura y barniz que contienen disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 12',
  'Residuos de pintura y barniz distintos de los especificados en el código 08 01 11',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 13*',
  'Lodos de pintura y barniz que contienen disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 14',
  'Lodos de pintura y barniz distintos de los especificados en el código 08 0113',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 15*',
  'Lodos acuosos que contienen pintura o barniz con disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 16',
  'Lodos acuosos que contienen pintura o barniz distintos de los especificados en el código 08 01 15',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 17*',
  'Residuos del decapado o eliminación de pintura y barniz que contienen disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 18',
  'Residuos del decapado o eliminación de pintura y barniz distintos de los especificados en el código 08 01 17',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 19*',
  'Suspensiones acuosas que contienen pintura o barniz con disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 20',
  'Suspensiones acuosas que contienen pintura o barniz distintos de los especificados en el código 08 01 19',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 21*',
  'Residuos de decapantes o desbarnizadores',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 01',
  'Residuos de la FFDU y del decapado o eliminación de pintura y barniz',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 02 01',
  'Residuos de arenillas de revestimiento',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 02',
  'Residuos de la FFDU de otros revestimientos (incluidos materiales cerámicos)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 02 02',
  'Lodos acuosos que contienen materiales cerámicos',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 02',
  'Residuos de la FFDU de otros revestimientos (incluidos materiales cerámicos)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 02 03',
  'Suspensiones acuosas que contienen materiales cerámicos',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 02',
  'Residuos de la FFDU de otros revestimientos (incluidos materiales cerámicos)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 02',
  'Residuos de la FFDU de otros revestimientos (incluidos materiales cerámicos)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 07',
  'Lodos acuosos que contienen tinta',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 08',
  'Residuos líquidos acuosos que contienen tinta',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 12*',
  'Residuos de tintas que contienen sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 13',
  'Residuos de tintas distintos de los especificados en el código 08 03 12',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 14*',
  'Lodos de tinta que contienen sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 15',
  'Lodos de tinta distintos de los especificados en el código 08 03 14',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 16*',
  'Residuos de soluciones corrosivas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 17*',
  'Residuos de tóner de impresión que contienen sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 18',
  'Residuos de tóner de impresión distintos de los especificados en el código 08 03 17',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 19*',
  'Aceites de dispersión',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 03 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 03',
  'Residuos de la FFDU de tintas de impresión',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 09*',
  'Residuos de adhesivos y sellantes que contienen disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 10',
  'Residuos de adhesivos y sellantes distintos de los especificados en el código 08 04 09',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 11*',
  'Lodos de adhesivos y sellantes que contienen disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 12',
  'Lodos de adhesivos y sellantes distintos de los especificados en el código 08 04 11',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 13*',
  'Lodos acuosos que contienen adhesivos o sellantes con disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 14',
  'Lodos acuosos que contienen adhesivos o sellantes distintos de los especificados en el código 08 04 13',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 15*',
  'Residuos líquidos acuosos que contienen adhesivos o sellantes con disolventes orgánicos u otras sustancias peligrosas',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 16',
  'Residuos líquidos acuosos que contienen adhesivos o sellantes, distintos de los especificados en el código 08 04 15',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 17*',
  'Aceite de resina',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 04 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 04',
  'Residuos de la FFDU de adhesivos y sellantes (incluyendo productos de impermeabilización)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '08 05 01*',
  'Isocianatos residuales',
  'peligroso',
  true,
  '08',
  'Residuos de la fabricación, formulación, distribución y utilización (FFDU) de revestimientos (pinturas, barnices y esmaltes vítreos), adhesivos, sellantes y tintas de impresión',
  '08 05',
  'Residuos no especificados en otra parte del capítulo 08',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 01*',
  'Soluciones de revelado y soluciones activadoras al agua',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 02*',
  'Soluciones de revelado de placas de impresión al agua',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 03*',
  'Soluciones de revelado con disolventes',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 04*',
  'Soluciones de fijado',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 05*',
  'Soluciones de blanqueo y soluciones de blanqueo-fijado',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 06*',
  'Residuos que contienen plata procedentes del tratamiento in situ de residuos fotográficos',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 07',
  'Películas y papel fotográfico que contienen plata o compuestos de plata',
  'no-peligroso',
  false,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 08',
  'Películas y papel fotográfico que no contienen plata ni compuestos de plata',
  'no-peligroso',
  false,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 10',
  'Cámaras de un solo uso sin pilas ni acumuladores',
  'no-peligroso',
  false,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 11*',
  'Cámaras de un solo uso con pilas o acumuladores incluidos en los códigos 16 06 01, 16 06 02 ó 16 06 03',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 12',
  'Cámaras de un solo uso con pilas o acumuladores distintas de las especificadas en el código 09 01 11',
  'no-peligroso',
  false,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 13*',
  'Residuos líquidos acuosos, procedentes de la recuperación in situ de plata, distintos de los especificados en el código 09 01 06',
  'peligroso',
  true,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '09 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '09',
  'Residuos de la industria fotográfica',
  '09 01',
  'Residuos de la industria fotográfica',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 01',
  'Cenizas de hogar, escorias y polvo de caldera (excepto el polvo de caldera especificado en el código 10 01 04)',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 02',
  'Cenizas volantes de carbón',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 03',
  'Cenizas volantes de turba y de madera (no tratada)',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 04*',
  'Cenizas volantes y polvo de caldera de hidrocarburos',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 05',
  'Residuos cálcicos de reacción, en forma sólida, procedentes de la desulfuración de gases de combustión',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 07',
  'Residuos cálcicos de reacción, en forma de lodos, procedentes de la desulfuración de gases de combustión',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 09*',
  'Ácido sulfúrico',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 13*',
  'Cenizas volantes de hidrocarburos emulsionados usados como combustibles',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 14*',
  'Cenizas de hogar, escorias y polvo de caldera, procedentes de la coincineración, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 15',
  'Cenizas de hogar, escorias y polvo de caldera, procedentes de la coincineración, distintos de los especificados en el código 10 01 14',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 16*',
  'Cenizas volantes procedentes de la coincineración que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 17',
  'Cenizas volantes procedentes de la coincineración distintas de las especificadas en el código 10 01 16',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 18*',
  'Residuos, procedentes de la depuración de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 19',
  'Residuos, procedentes de la depuración de gases, distintos de los especificados en los códigos 10 01 05, 10 01 07 y 10 01 18',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 20*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 21',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 10 01 20',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 22*',
  'Lodos acuosos, procedentes de la limpieza de calderas, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 23',
  'Lodos acuosos, procedentes de la limpieza de calderas, distintos de los especificados en el código 10 01 22',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 24',
  'Arenas de lechos fluidizados',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 25',
  'Residuos procedentes del almacenamiento y preparación de combustible de centrales eléctricas de carbón',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 26',
  'Residuos del tratamiento del agua de refrigeración',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 01',
  'Residuos de centrales eléctricas y otras plantas de combustión (excepto los del capítulo 19)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 01',
  'Residuos del tratamiento de escorias',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 02',
  'Escorias no tratadas',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 07*',
  'Residuos sólidos, del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 08',
  'Residuos sólidos del tratamiento de gases distintos de los especificados en el código 10 02 07',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 10',
  'Cascarilla de laminación',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 11*',
  'Residuos del tratamiento del agua de refrigeración que contienen aceites',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 12',
  'Residuos del tratamiento del agua de refrigeración distintos de los especificados en el código 10 02 11',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 13*',
  'Lodos y tortas de filtración, del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 14',
  'Lodos y tortas de filtración, del tratamiento de gases, distintos de los especificados en el código 10 02 13',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 15',
  'Otros lodos y tortas de filtración',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 02',
  'Residuos de la industria del hierro y del acero',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 02',
  'Fragmentos de ánodos',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 04*',
  'Escorias de la producción primaria',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 05',
  'Residuos de alúmina',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 08*',
  'Escorias salinas de la producción secundaria',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 09*',
  'Granzas negras de la producción secundaria',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 15*',
  'Espumas inflamables o que emiten, en contacto con el agua, gases inflamables en cantidades peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 16',
  'Espumas distintas de las especificadas en el código 10 03 15',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 17*',
  'Residuos que contienen alquitrán procedentes de la fabricación de ánodos',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 18',
  'Residuos que contienen carbono procedentes de la fabricación de ánodos, distintos de los especificados en el código 10 03 17',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 19*',
  'Partículas, procedentes de los efluentes gaseosos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 20',
  'Partículas procedentes de los efluentes gaseosos, distintas de las especificadas en el código 10 03 19',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 21*',
  'Otras partículas y polvo (incluido el polvo de molienda) que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 22',
  'Otras partículas y polvo (incluido el polvo de molienda) distintos de los especificados en el código 10 03 21',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 23*',
  'Residuos sólidos, del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 24',
  'Residuos sólidos, del tratamiento de gases, distintos de los especificados en el código 10 03 23',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 25*',
  'Lodos y tortas de filtración, del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 26',
  'Lodos y tortas de filtración del tratamiento de gases, distintos de los especificados en el código 10 03 25',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 27*',
  'Residuos del tratamiento del agua de refrigeración que contienen aceites',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 28',
  'Residuos del tratamiento del agua de refrigeración, distintos de los especificados en el código 10 03 27',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 29*',
  'Residuos del tratamiento de escorias salinas y granzas negras, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 30',
  'Residuos del tratamiento de escorias salinas y granzas negras distintos de los especificados en el código 10 03 29',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 03 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 03',
  'Residuos de la termometalurgia del aluminio',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 01*',
  'Escorias de la producción primaria y secundaria',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 02*',
  'Granzas y espumas de la producción primaria y secundaria',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 03*',
  'Arseniato de calcio',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 04*',
  'Partículas procedentes de los efluentes gaseosos',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 05*',
  'Otras partículas y polvos',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 06*',
  'Residuos sólidos del tratamiento de gases',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 07*',
  'Lodos y tortas de filtración del tratamiento de gases',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 09*',
  'Residuos del tratamiento del agua de refrigeración que contienen aceites',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 10',
  'Residuos del tratamiento del agua de refrigeración distintos de los especificados en el código 10 04 09',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 04 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 04',
  'Residuos de la termometalurgia del plomo',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 01',
  'Escorias de la producción primaria y secundaria',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 03*',
  'Partículas procedentes de los efluentes gaseosos',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 04',
  'Otras partículas y polvos',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 05*',
  'Residuos sólidos del tratamiento de gases',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 06*',
  'Lodos y tortas de filtración del tratamiento de gases',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 08*',
  'Residuos del tratamiento del agua de refrigeración que contienen aceites',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 09',
  'Residuos del tratamiento del agua de refrigeración distintos de los especificados en el código 10 05 08',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 10*',
  'Granzas y espumas inflamables o que emiten, en contacto con el agua, gases inflamables en cantidades peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 11',
  'Granzas y espumas distintas de las especificadas en el código 10 05 10',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 05 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 05',
  'Residuos de la termometalurgia del zinc',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 01',
  'Escorias de la producción primaria y secundaria',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 02',
  'Granzas y espumas de la producción primaria y secundaria',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 03*',
  'Partículas procedentes de los efluentes gaseosos',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 04',
  'Otras partículas y polvos',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 06*',
  'Residuos sólidos del tratamiento de gases',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 07*',
  'Lodos y tortas de filtración del tratamiento de gases',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 09*',
  'Residuos del tratamiento del agua de refrigeración que contienen aceites',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 10',
  'Residuos del tratamiento del agua de refrigeración distintos de los especificados en el código 10 06 09',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 06 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 06',
  'Residuos de la termometalurgia del cobre',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 01',
  'Escorias de la producción primaria y secundaria',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 02',
  'Granzas y espumas de la producción primaria y secundaria',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 03',
  'Residuos sólidos del tratamiento de gases',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 04',
  'Otras partículas y polvos',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 05',
  'Lodos y tortas de filtración del tratamiento de gases',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 07*',
  'Residuos del tratamiento del agua de refrigeración que contienen aceites',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 08',
  'Residuos del tratamiento del agua de refrigeración distintos de los especificados en el código 10 07 07',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 07 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 07',
  'Residuos de la termometalurgia de la plata, oro y platino',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 04',
  'Partículas y polvo',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 08*',
  'Escorias salinas de la producción primaria y secundaria',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 09',
  'Otras escorias',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 10*',
  'Granzas y espumas inflamables o que emiten, en contacto con el agua, gases inflamables en cantidades peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 11',
  'Granzas y espumas distintas de las especificadas en el código 10 08 10',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 12*',
  'Residuos que contienen alquitrán procedentes de la fabricación de ánodos',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 13',
  'Residuos que contienen carbono procedentes de la fabricación de ánodos distintos de los especificados en el código 10 08 12',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 14',
  'Fragmentos de ánodos',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 15*',
  'Partículas, procedentes de los efluentes gaseosos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 16',
  'Partículas procedentes de los efluentes gaseosos distintas de las especificadas en el código 10 08 15',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 17*',
  'Lodos y tortas de filtración del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 18',
  'Lodos y tortas de filtración del tratamiento de gases, distintos de los especificados en el código 10 08 17',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 19*',
  'Residuos del tratamiento del agua de refrigeración que contienen aceites',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 20',
  'Residuos del tratamiento del agua de refrigeración distintos de los especificados en el código 10 08 19',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 08 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 08',
  'Residuos de la termometalurgia de otros metales no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 03',
  'Escorias de horno',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 05*',
  'Machos y moldes de fundición sin colada que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 06',
  'Machos y moldes de fundición sin colada distintos de los especificados en el código 10 09 05',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 07*',
  'Machos y moldes de fundición con colada que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 08',
  'Machos y moldes de fundición con colada distintos de los especificados en el código 10 09 07',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 09*',
  'Partículas procedentes de los efluentes gaseosos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 10',
  'Partículas, procedentes de los efluentes gaseosos, distintas de las especificadas en el código 10 09 09',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 11*',
  'Otras partículas que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 12',
  'Otras partículas distintas de las especificadas en el código 10 09 11',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 13*',
  'Ligantes residuales que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 14',
  'Ligantes residuales distintos de los especificados en el código 10 09 13',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 15*',
  'Residuos de agentes indicadores de fisuración que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 16',
  'Residuos de agentes indicadores de fisuración distintos de los especificados en el código 10 09 15',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 09 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 09',
  'Residuos de la fundición de piezas férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 03',
  'Escorias de horno',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 05*',
  'Machos y moldes de fundición sin colada que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 06',
  'Machos y moldes de fundición sin colada distintos de los especificados en el código 10 10 05',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 07*',
  'Machos y moldes de fundición con colada que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 08',
  'Machos y moldes de fundición con colada distintos de los especificados en el código 10 10 07',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 09*',
  'Partículas, procedentes de los efluentes gaseosos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 10',
  'Partículas procedentes de los efluentes gaseosos distintas de las especificadas en el código 10 10 09',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 11*',
  'Otras partículas que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 12',
  'Otras partículas distintas de las especificadas en el código 10 10 11',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 13*',
  'Ligantes residuales que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 14',
  'Ligantes residuales distintos de los especificados en el código 10 10 13',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 15*',
  'Residuos de agentes indicadores de fisuración que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 16',
  'Residuos de agentes indicadores de fisuración distintos de los especificados en el código 10 10 15',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 10 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 10',
  'Residuos de la fundición de piezas no férreas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 03',
  'Residuos de materiales de fibra de vidrio',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 05',
  'Partículas y polvo',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 09*',
  'Residuos, de la preparación de mezclas antes del proceso de cocción que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 10',
  'Residuos de la preparación de mezclas antes del proceso de cocción distintos de los especificados en el código 10 11 09',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 11*',
  'Residuos de pequeñas partículas de vidrio y de polvo de vidrio que contienen metales pesados (por ejemplo, de tubos catódicos)',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 12',
  'Residuos de vidrio distintos de los especificados en el código 10 11 11',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 13*',
  'Lodos procedentes del pulido y esmerilado del vidrio que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 14',
  'Lodos procedentes del pulido y esmerilado del vidrio distintos de los especificados en el código 10 11 13',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 15*',
  'Residuos sólidos, del tratamiento de gases de combustión, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 16',
  'Residuos sólidos, del tratamiento de gases de combustión distintos de los especificados en el código 10 11 15',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 17*',
  'Lodos y tortas de filtración, del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 18',
  'Lodos y tortas de filtración, del tratamiento de gases, distintos de los especificados en el código 10 11 17',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 19*',
  'Residuos sólidos, del tratamiento in situ de efluentes, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 20',
  'Residuos sólidos, del tratamiento in situ de efluentes, distintos de los especificados en el código 10 11 19',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 11 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 11',
  'Residuos de la fabricación del vidrio y sus derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 01',
  'Residuos de la preparación de mezclas antes del proceso de cocción',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 03',
  'Partículas y polvo',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 05',
  'Lodos y tortas de filtración del tratamiento de gases',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 06',
  'Moldes desechados',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 08',
  'Residuos de cerámica, ladrillos, tejas y materiales de construcción (después del proceso de cocción)',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 09*',
  'Residuos sólidos, del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 10',
  'Residuos sólidos, del tratamiento de gases, distintos de los especificados en el código 10 12 09',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 11*',
  'Residuos del vidriado que contienen metales pesados',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 12',
  'Residuos del vidriado distintos de los especificados en el código 10 12 11',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 13',
  'Lodos del tratamiento in situ de efluentes',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 12 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 12',
  'Residuos de la fabricación de productos cerámicos, ladrillos, tejas y materiales de construcción',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 01',
  'Residuos de la preparación de mezclas antes del proceso de cocción',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 04',
  'Residuos de calcinación e hidratación de la cal',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 06',
  'Partículas y polvo (excepto los códigos 10 13 12 y 10 13 13)',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 07',
  'Lodos y tortas de filtración del tratamiento de gases',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 09*',
  'Residuos de la fabricación de fibrocemento que contienen amianto',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 10',
  'Residuos de la fabricación de fibrocemento distintos de los especificados en el código 10 13 09',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 11',
  'Residuos de materiales compuestos a partir de cemento distintos de los especificados en los códigos 10 13 09 y 10 13 10',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 12*',
  'Residuos sólidos, del tratamiento de gases, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 13',
  'Residuos sólidos, del tratamiento de gases, distintos de los especificados en el código 10 13 12',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 14',
  'Residuos de hormigón y lodos de hormigón',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 13 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '10',
  'Residuos de procesos térmicos',
  '10 13',
  'Residuos de la fabricación de cemento, cal y yeso y de productos derivados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '10 14 01*',
  'Residuos de la depuración de gases que contienen mercurio',
  'peligroso',
  true,
  '10',
  'Residuos de procesos térmicos',
  '10 14',
  'Residuos de crematorios',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 05*',
  'Ácidos de decapado',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 06*',
  'Ácidos no especificados en otra categoría',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 07*',
  'Bases de decapado',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 08*',
  'Lodos de fosfatación',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 09*',
  'Lodos y tortas de filtración que contienen sustancias peligrosas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 10',
  'Lodos y tortas de filtración distintos de los especificados en el código 11 01 09',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 11*',
  'Líquidos acuosos de enjuague que contienen sustancias peligrosas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 12',
  'Líquidos acuosos de enjuague distintos de los especificados en el código 11 01 11',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 13*',
  'Residuos de desengrasado que contienen sustancias peligrosas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 14',
  'Residuos de desengrasado distintos de los especificados en el código 11 01 13',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 15*',
  'Eluatos y lodos, procedentes de sistemas de membranas o de intercambio iónico, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 16*',
  'Resinas intercambiadoras de iones saturadas o usadas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 98*',
  'Otros residuos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 01',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales (por ejemplo, procesos de galvanización, procesos de recubrimiento con zinc, procesos de decapado, grabado, fosfatación, desengrasado alcalino y anodización)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 02 02*',
  'Lodos de la hidrometalurgia del zinc (incluidas jarosita y goethita)',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 02',
  'Residuos de procesos hidrometalúrgicos no férreos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 02 03',
  'Residuos de la producción de ánodos para procesos de electrólisis acuosa',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 02',
  'Residuos de procesos hidrometalúrgicos no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 02 05*',
  'Residuos de procesos de la hidrometalurgia del cobre que contienen sustancias peligrosas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 02',
  'Residuos de procesos hidrometalúrgicos no férreos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 02 06',
  'Residuos de procesos de la hidrometalurgia del cobre distintos de los especificados en el código 11 02 05',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 02',
  'Residuos de procesos hidrometalúrgicos no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 02 07*',
  'Otros residuos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 02',
  'Residuos de procesos hidrometalúrgicos no férreos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 02',
  'Residuos de procesos hidrometalúrgicos no férreos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 03 01*',
  'Residuos que contienen cianuro',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 03',
  'Lodos y sólidos de procesos de temple',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 03 02*',
  'Otros residuos',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 03',
  'Lodos y sólidos de procesos de temple',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 05 01',
  'Matas de galvanización',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 05',
  'Residuos de procesos de galvanización en caliente',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 05 02',
  'Cenizas de zinc',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 05',
  'Residuos de procesos de galvanización en caliente',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 05 03*',
  'Residuos sólidos del tratamiento de gases',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 05',
  'Residuos de procesos de galvanización en caliente',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 05 04*',
  'Fundentes usados',
  'peligroso',
  true,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 05',
  'Residuos de procesos de galvanización en caliente',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '11 05 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '11',
  'Residuos del tratamiento químico de superficie y del recubrimiento de metales y otros materiales; residuos de la hidrometalurgia no férrea',
  '11 05',
  'Residuos de procesos de galvanización en caliente',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 01',
  'Limaduras y virutas de metales férreos',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 02',
  'Polvo y partículas de metales férreos',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 03',
  'Limaduras y virutas de metales no férreos',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 04',
  'Polvo y partículas de metales no férreos',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 05',
  'Virutas y rebabas de plástico',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 06*',
  'Aceites minerales de mecanizado que contienen halógenos (excepto las emulsiones o disoluciones)',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 07*',
  'Aceites minerales de mecanizado sin halógenos (excepto las emulsiones o disoluciones)',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 08*',
  'Emulsiones y disoluciones de mecanizado que contienen halógenos',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 09*',
  'Emulsiones y disoluciones de mecanizado sin halógenos',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 10*',
  'Aceites sintéticos de mecanizado',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 12*',
  'Ceras y grasas usadas',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 13',
  'Residuos de soldadura',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 14*',
  'Lodos de mecanizado que contienen sustancias peligrosas',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 15',
  'Lodos de mecanizado distintos de los especificados en el código 12 01 14',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 16*',
  'Residuos de granallado o chorreado que contienen sustancias peligrosas',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 17',
  'Residuos de granallado o chorreado distintos de los especificados en el código 12 01 16',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 18*',
  'Lodos metálicos (lodos de esmerilado, rectificado y lapeado) que contienen aceites',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 19*',
  'Aceites de mecanizado fácilmente biodegradables',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 20*',
  'Muelas y materiales de esmerilado usados que contienen sustancias peligrosas',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 21',
  'Muelas y materiales de esmerilado usados distintos de los especificados en el código 12 01 20',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 01',
  'Residuos del moldeado y tratamiento físico y mecánico de superficie de metales y plásticos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 03 01*',
  'Líquidos acuosos de limpieza',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 03',
  'Residuos de los procesos de desengrase con agua y vapor (excepto los del capítulo 11)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '12 03 02*',
  'Residuos de desengrase al vapor',
  'peligroso',
  true,
  '12',
  'Residuos del moldeado y del tratamiento físico y mecánico de superficie de metales y plásticos',
  '12 03',
  'Residuos de los procesos de desengrase con agua y vapor (excepto los del capítulo 11)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 01*',
  'Aceites hidráulicos que contienen PCB',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 04*',
  'Emulsiones cloradas',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 05*',
  'Emulsiones no cloradas',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 09*',
  'Aceites hidráulicos minerales clorados',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 10*',
  'Aceites hidráulicos minerales no clorados',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 11*',
  'Aceites hidráulicos sintéticos',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 12*',
  'Aceites hidráulicos fácilmente biodegradables',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 01 13*',
  'Otros aceites hidráulicos',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 01',
  'Residuos de aceites hidráulicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 02 04*',
  'Aceites minerales clorados de motor, de transmisión mecánica y lubricantes',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 02',
  'Residuos de aceites de motor, de transmisión mecánica y lubricantes',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 02 05*',
  'Aceites minerales no clorados de motor, de transmisión mecánica y lubricantes',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 02',
  'Residuos de aceites de motor, de transmisión mecánica y lubricantes',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 02 06*',
  'Aceites sintéticos de motor, de transmisión mecánica y lubricantes',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 02',
  'Residuos de aceites de motor, de transmisión mecánica y lubricantes',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 02 07*',
  'Aceites fácilmente biodegradables de motor, de transmisión mecánica y lubricantes',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 02',
  'Residuos de aceites de motor, de transmisión mecánica y lubricantes',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 02 08*',
  'Otros aceites de motor, de transmisión mecánica y lubricantes',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 02',
  'Residuos de aceites de motor, de transmisión mecánica y lubricantes',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 03 01*',
  'Aceites de aislamiento y transmisión de calor que contienen PCB',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 03',
  'Residuos de aceites de aislamiento y transmisión de calor',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 03 06*',
  'Aceites minerales clorados de aislamiento y transmisión de calor distintos de los especificados en el código 13 03 01',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 03',
  'Residuos de aceites de aislamiento y transmisión de calor',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 03 07*',
  'Aceites minerales no clorados de aislamiento y transmisión de calor',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 03',
  'Residuos de aceites de aislamiento y transmisión de calor',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 03 08*',
  'Aceites sintéticos de aislamiento y transmisión de calor',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 03',
  'Residuos de aceites de aislamiento y transmisión de calor',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 03 09*',
  'Aceites fácilmente biodegradables de aislamiento y transmisión de calor',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 03',
  'Residuos de aceites de aislamiento y transmisión de calor',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 03 10*',
  'Otros aceites de aislamiento y transmisión de calor',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 03',
  'Residuos de aceites de aislamiento y transmisión de calor',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 04 01*',
  'Aceites de sentinas procedentes de la navegación en aguas continentales',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 04',
  'Aceites de sentinas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 04 02*',
  'Aceites de sentinas recogidos en muelles',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 04',
  'Aceites de sentinas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 04 03*',
  'Aceites de sentinas procedentes de otros tipos de navegación',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 04',
  'Aceites de sentinas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 05 01*',
  'Sólidos procedentes de desarenadores y de separadores de agua/sustancias aceitosas',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 05',
  'Restos de separadores de agua/sustancias aceitosas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 05 02*',
  'Lodos de separadores de agua/sustancias aceitosas',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 05',
  'Restos de separadores de agua/sustancias aceitosas',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 05 03*',
  'Lodos de interceptores',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 05',
  'Restos de separadores de agua/sustancias aceitosas',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 05 06*',
  'Aceites procedentes de separadores de agua/sustancias aceitosas',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 05',
  'Restos de separadores de agua/sustancias aceitosas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 05 07*',
  'Agua aceitosa procedente de separadores de agua/sustancias aceitosas',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 05',
  'Restos de separadores de agua/sustancias aceitosas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 05 08*',
  'Mezcla de residuos procedentes de desarenadores y de separadores de agua/sustancias aceitosas',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 05',
  'Restos de separadores de agua/sustancias aceitosas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 07 01*',
  'Fuel oil y gasóleo',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 07',
  'Residuos de combustibles líquidos',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 07 02*',
  'Gasolina',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 07',
  'Residuos de combustibles líquidos',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 07 03*',
  'Otros combustibles (incluidas mezclas)',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 07',
  'Residuos de combustibles líquidos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 08 01*',
  'Lodos o emulsiones de desalación',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 08',
  'Residuos de aceites no especificados en otra categoría',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 08 02*',
  'Otras emulsiones',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 08',
  'Residuos de aceites no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '13 08 99*',
  'Residuos no especificados en otra categoría',
  'peligroso',
  true,
  '13',
  'Residuos de aceites y de combustibles líquidos (excepto los aceites comestibles y los de los capítulos 05, 12 y 19)',
  '13 08',
  'Residuos de aceites no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '14 06 01*',
  'Clorofluorocarbonos, HCFC, HFC',
  'peligroso',
  true,
  '14',
  'Residuos de disolventes, refrigerantes y propelentes orgánicos (excepto los de los capítulos 07 y 08)',
  '14 06',
  'Residuos de disolventes, refrigerantes y propelentes de espuma y aerosoles orgánicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '14 06 02*',
  'Otros disolventes y mezclas de disolventes halogenados',
  'peligroso',
  true,
  '14',
  'Residuos de disolventes, refrigerantes y propelentes orgánicos (excepto los de los capítulos 07 y 08)',
  '14 06',
  'Residuos de disolventes, refrigerantes y propelentes de espuma y aerosoles orgánicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '14 06 03*',
  'Otros disolventes y mezclas de disolventes',
  'peligroso',
  true,
  '14',
  'Residuos de disolventes, refrigerantes y propelentes orgánicos (excepto los de los capítulos 07 y 08)',
  '14 06',
  'Residuos de disolventes, refrigerantes y propelentes de espuma y aerosoles orgánicos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '14 06 04*',
  'Lodos o residuos sólidos que contienen disolventes halogenados',
  'peligroso',
  true,
  '14',
  'Residuos de disolventes, refrigerantes y propelentes orgánicos (excepto los de los capítulos 07 y 08)',
  '14 06',
  'Residuos de disolventes, refrigerantes y propelentes de espuma y aerosoles orgánicos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '14 06 05*',
  'Lodos o residuos sólidos que contienen otros disolventes',
  'peligroso',
  true,
  '14',
  'Residuos de disolventes, refrigerantes y propelentes orgánicos (excepto los de los capítulos 07 y 08)',
  '14 06',
  'Residuos de disolventes, refrigerantes y propelentes de espuma y aerosoles orgánicos',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 01',
  'Envases de papel y cartón',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 02',
  'Envases de plástico',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 03',
  'Envases de madera',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 04',
  'Envases metálicos',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 05',
  'Envases compuestos',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 06',
  'Envases mezclados',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 07',
  'Envases de vidrio',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 09',
  'Envases textiles',
  'no-peligroso',
  false,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 10*',
  'Envases que contienen restos de sustancias peligrosas o están contaminados por ellas',
  'peligroso',
  true,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 01 11*',
  'Envases metálicos, incluidos los recipientes a presión vacíos, que contienen una matriz porosa sólida peligrosa (por ejemplo, amianto)',
  'peligroso',
  true,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 01',
  'Envases (incluidos los residuos de envases de la recogida selectiva municipal)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '15 02 02*',
  'Absorbentes, materiales de filtración (incluidos los filtros de aceite no especificados en otra categoría), trapos de limpieza y ropas protectoras contaminados por sustancias peligrosas',
  'peligroso',
  true,
  '15',
  'Residuos de envases; absorbentes, trapos de limpieza, materiales de filtración y ropas de protección no especificados en otra categoría',
  '15 02',
  'Absorbentes, materiales de filtración, trapos de limpieza y ropas protectoras',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 03',
  'Neumáticos fuera de uso',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 04*',
  'Vehículos al final de su vida útil',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 07*',
  'Filtros de aceite',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 08*',
  'Componentes que contienen mercurio',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 09*',
  'Componentes que contienen PCB',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 10*',
  'Componentes explosivos (por ejemplo, air bags)',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 11*',
  'Zapatas de freno que contienen amianto',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 12',
  'Zapatas de freno distintas de las especificadas en el código 16 01 11',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 13*',
  'Líquidos de frenos',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 14*',
  'Anticongelantes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 15',
  'Anticongelantes distintos de los especificados en el código 16 01 14',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 16',
  'Depósitos para gases licuados',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 17',
  'Metales férreos',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 18',
  'Metales no férreos',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 19',
  'Plástico',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 20',
  'Vidrio',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 21*',
  'Componentes peligrosos distintos de los especificados en los códigos 16 01 07 a 16 01 11, 16 01 13 y 16 01 14',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 22',
  'Componentes no especificados en otra categoría',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 01',
  'Vehículos de diferentes medios de transporte (incluidas las máquinas no de carretera) al final de su vida útil y residuos del desguace de vehículos al final de su vida útil y del mantenimiento de vehículos (excepto los de los capítulos 13 y 14 y los subcapítulos 16 06 y 16 08)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 09*',
  'Transformadores y condensadores que contienen PCB',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 10*',
  'Equipos desechados que contienen PCB, o están contaminados por ellos, distintos de los especificados en el código 16 02 09',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 11*',
  'Equipos desechados que contienen clorofluorocarbonos, HCFC, HFC',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 12*',
  'Equipos desechados que contienen amianto libre',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 13*',
  'Equipos desechados que contienen componentes peligrosos(4), distintos de los especificados en los códigos 16 02 09 a 16 02 12',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 14',
  'Equipos desechados distintos de los especificados en los códigos 16 02 09 a 16 02 13',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 15*',
  'Componentes peligrosos retirados de equipos desechados',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 02 16',
  'Componentes retirados de equipos desechados, distintos de los especificados en el código 16 02 15',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 02',
  'Residuos de equipos eléctricos y electrónicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 03 03*',
  'Residuos inorgánicos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 03',
  'Lotes de productos fuera de especificación y productos no utilizados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 03 04',
  'Residuos inorgánicos distintos de los especificados en el código 16 03 03',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 03',
  'Lotes de productos fuera de especificación y productos no utilizados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 03 05*',
  'Residuos orgánicos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 03',
  'Lotes de productos fuera de especificación y productos no utilizados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 03 06',
  'Residuos orgánicos distintos de los especificados en el código 16 03 05',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 03',
  'Lotes de productos fuera de especificación y productos no utilizados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 04 01*',
  'Residuos de municiones',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 04',
  'Residuos de explosivos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 04 02*',
  'Residuos de fuegos artificiales',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 04',
  'Residuos de explosivos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 04 03*',
  'Otros residuos explosivos',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 04',
  'Residuos de explosivos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 05 04*',
  'Gases en recipientes a presión (incluidos los halones) que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 05',
  'Gases en recipientes a presión y productos químicos desechados',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 05 05',
  'Gases en recipientes a presión distintos de los especificados en el código 16 05 04',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 05',
  'Gases en recipientes a presión y productos químicos desechados',
  'gaseoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 05 06*',
  'Productos químicos de laboratorio que consisten en, o contienen, sustancias peligrosas, incluidas las mezclas de productos químicos de laboratorio',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 05',
  'Gases en recipientes a presión y productos químicos desechados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 05 07*',
  'Productos químicos inorgánicos desechados que consisten en, o contienen, sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 05',
  'Gases en recipientes a presión y productos químicos desechados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 05 08*',
  'Productos químicos orgánicos desechados que consisten en, o contienen, sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 05',
  'Gases en recipientes a presión y productos químicos desechados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 05 09',
  'Productos químicos desechados distintos de los especificados en los códigos 16 05 06, 16 05 07 ó 16 05 08',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 05',
  'Gases en recipientes a presión y productos químicos desechados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 06 01*',
  'Baterías de plomo',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 06',
  'Pilas y acumuladores',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 06 02*',
  'Acumuladores de Ni-Cd',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 06',
  'Pilas y acumuladores',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 06 03*',
  'Pilas que contienen mercurio',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 06',
  'Pilas y acumuladores',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 06 04',
  'Pilas alcalinas (excepto las del código 16 06 03)',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 06',
  'Pilas y acumuladores',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 06 05',
  'Otras pilas y acumuladores',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 06',
  'Pilas y acumuladores',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 06 06*',
  'Electrolito de pilas y acumuladores recogido selectivamente',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 06',
  'Pilas y acumuladores',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 07 08*',
  'Residuos que contienen hidrocarburos',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 07',
  'Residuos de la limpieza de cisternas de transporte y almacenamiento y de la limpieza de cubas (excepto los de los capítulos 05 y 13)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 07 09*',
  'Residuos que contienen otras sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 07',
  'Residuos de la limpieza de cisternas de transporte y almacenamiento y de la limpieza de cubas (excepto los de los capítulos 05 y 13)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 07 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 07',
  'Residuos de la limpieza de cisternas de transporte y almacenamiento y de la limpieza de cubas (excepto los de los capítulos 05 y 13)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 08 01',
  'Catalizadores usados que contienen oro, plata, renio, rodio, paladio, iridio o platino (excepto los del código 16 08 07)',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 08',
  'Catalizadores usados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 08 02*',
  'Catalizadores usados que contienen metales de transición (5) peligrosos o compuestos de metales de transición peligrosos',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 08',
  'Catalizadores usados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 08 03',
  'Catalizadores usados que contienen metales de transición o compuestos de metales de transición no especificados en otra categoría',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 08',
  'Catalizadores usados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 08 04',
  'Catalizadores usados procedentes del craqueo catalítico en lecho fluido (excepto los del código 16 08 07)',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 08',
  'Catalizadores usados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 08 05*',
  'Catalizadores usados que contienen ácido fosfórico',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 08',
  'Catalizadores usados',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 08 06*',
  'Líquidos usados utilizados como catalizadores',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 08',
  'Catalizadores usados',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 08 07*',
  'Catalizadores usados contaminados con sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 08',
  'Catalizadores usados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 09 01*',
  'Permanganatos, por ejemplo, permanganato potásico',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 09',
  'Sustancias oxidantes',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 09 02*',
  'Cromatos, por ejemplo, cromato potásico, dicromato sódico o potásico',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 09',
  'Sustancias oxidantes',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 09 03*',
  'Peróxidos, por ejemplo, peróxido de hidrógeno',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 09',
  'Sustancias oxidantes',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 09 04*',
  'Sustancias oxidantes no especificadas en otra categoría',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 09',
  'Sustancias oxidantes',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 10 01*',
  'Residuos líquidos acuosos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 10',
  'Residuos líquidos acuosos destinados a plantas de tratamiento externas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 10 02',
  'Residuos líquidos acuosos distintos de los especificados en el código 16 10 01',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 10',
  'Residuos líquidos acuosos destinados a plantas de tratamiento externas',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 10 03*',
  'Concentrados acuosos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 10',
  'Residuos líquidos acuosos destinados a plantas de tratamiento externas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 10 04',
  'Concentrados acuosos distintos de los especificados en el código 16 10 03',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 10',
  'Residuos líquidos acuosos destinados a plantas de tratamiento externas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 11 01*',
  'Revestimientos y refractarios a partir de carbono, procedentes de procesos metalúrgicos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 11',
  'Residuos de revestimientos de hornos y de refractarios',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 11 02',
  'Revestimientos y refractarios a partir de carbono, procedentes de procesos metalúrgicos, distintos de los especificados en el código 16 11 01',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 11',
  'Residuos de revestimientos de hornos y de refractarios',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 11 03*',
  'Otros revestimientos y refractarios, procedentes de procesos metalúrgicos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 11',
  'Residuos de revestimientos de hornos y de refractarios',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 11 04',
  'Otros revestimientos y refractarios procedentes de procesos metalúrgicos, distintos de los especificados en el código 16 11 03',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 11',
  'Residuos de revestimientos de hornos y de refractarios',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 11 05*',
  'Revestimientos y refractarios, procedentes de procesos no metalúrgicos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 11',
  'Residuos de revestimientos de hornos y de refractarios',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '16 11 06',
  'Revestimientos y refractarios procedentes de procesos no metalúrgicos, distintos de los especificados en el código 16 11 05',
  'no-peligroso',
  false,
  '16',
  'Residuos no especificados en otro capítulo de la lista',
  '16 11',
  'Residuos de revestimientos de hornos y de refractarios',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 01 01',
  'Hormigón',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 01',
  'Hormigón, ladrillos, tejas y materiales cerámicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 01 02',
  'Ladrillos',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 01',
  'Hormigón, ladrillos, tejas y materiales cerámicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 01 03',
  'Tejas y materiales cerámicos',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 01',
  'Hormigón, ladrillos, tejas y materiales cerámicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 01 06*',
  'Mezclas, o fracciones separadas, de hormigón, ladrillos, tejas y materiales cerámicos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 01',
  'Hormigón, ladrillos, tejas y materiales cerámicos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 01 07',
  'Mezclas de hormigón, ladrillos, tejas y materiales cerámicos distintas de las especificadas en el código 17 01 06',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 01',
  'Hormigón, ladrillos, tejas y materiales cerámicos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 02 01',
  'Madera',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 02',
  'Madera, vidrio y plástico',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 02 02',
  'Vidrio',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 02',
  'Madera, vidrio y plástico',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 02 03',
  'Plástico',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 02',
  'Madera, vidrio y plástico',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 02 04*',
  'Vidrio, plástico y madera que contienen sustancias peligrosas o están contaminados por ellas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 02',
  'Madera, vidrio y plástico',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 03 01*',
  'Mezclas bituminosas que contienen alquitrán de hulla',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 03',
  'Mezclas bituminosas, alquitrán de hulla y otros productos alquitranados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 03 02',
  'Mezclas bituminosas distintas de las especificadas en el código 17 03 01',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 03',
  'Mezclas bituminosas, alquitrán de hulla y otros productos alquitranados',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 03 03*',
  'Alquitrán de hulla y productos alquitranados',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 03',
  'Mezclas bituminosas, alquitrán de hulla y otros productos alquitranados',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 01',
  'Cobre, bronce, latón',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 02',
  'Aluminio',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 03',
  'Plomo',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 04',
  'Zinc',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 05',
  'Hierro y acero',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 06',
  'Estaño',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 07',
  'Metales mezclados',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 09*',
  'Residuos metálicos contaminados con sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 10*',
  'Cables que contienen hidrocarburos, alquitrán de hulla y otras sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 04 11',
  'Cables distintos de los especificados en el código 17 04 10',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 04',
  'Metales (incluidas sus aleaciones)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 05 03*',
  'Tierra y piedras que contienen sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 05',
  'Tierra (incluida la excavada de zonas contaminadas), piedras y lodos de drenaje',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 05 04',
  'Tierra y piedras distintas de las especificadas en el código 17 05 03',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 05',
  'Tierra (incluida la excavada de zonas contaminadas), piedras y lodos de drenaje',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 05 05*',
  'Lodos de drenaje que contienen sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 05',
  'Tierra (incluida la excavada de zonas contaminadas), piedras y lodos de drenaje',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 05 06',
  'Lodos de drenaje distintos de los especificados en el código 17 05 05',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 05',
  'Tierra (incluida la excavada de zonas contaminadas), piedras y lodos de drenaje',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 05 07*',
  'Balasto de vías férreas que contienen sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 05',
  'Tierra (incluida la excavada de zonas contaminadas), piedras y lodos de drenaje',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 05 08',
  'Balasto de vías férreas distinto del especificado en el código 17 05 07',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 05',
  'Tierra (incluida la excavada de zonas contaminadas), piedras y lodos de drenaje',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 06 01*',
  'Materiales de aislamiento que contienen amianto',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 06',
  'Materiales de aislamiento y materiales de construcción que contienen amianto',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 06 03*',
  'Otros materiales de aislamiento que consisten en, o contienen, sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 06',
  'Materiales de aislamiento y materiales de construcción que contienen amianto',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 06 04',
  'Materiales de aislamiento distintos de los especificados en los códigos 17 06 01 y 17 06 03',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 06',
  'Materiales de aislamiento y materiales de construcción que contienen amianto',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 06 05*',
  'Materiales de construcción que contienen amianto',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 06',
  'Materiales de aislamiento y materiales de construcción que contienen amianto',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 08 01*',
  'Materiales de construcción a partir de yeso contaminados con sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 08',
  'Materiales de construcción a partir de yeso',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 08 02',
  'Materiales de construcción a partir de yeso distintos de los especificados en el código 17 08 01',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 08',
  'Materiales de construcción a partir de yeso',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 09 01*',
  'Residuos de construcción y demolición que contienen mercurio',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 09',
  'Otros residuos de construcción y demolición',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 09 02*',
  'Residuos de construcción y demolición que contienen PCB (por ejemplo, sellantes que contienen PCB, revestimientos de suelo a partir de resinas que contienen PCB, acristalamientos dobles que contienen PCB, condensadores que contienen PCB)',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 09',
  'Otros residuos de construcción y demolición',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 09 03*',
  'Otros residuos de construcción y demolición (incluidos los residuos mezclados) que contienen sustancias peligrosas',
  'peligroso',
  true,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 09',
  'Otros residuos de construcción y demolición',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '17 09 04',
  'Residuos mezclados de construcción y demolición distintos de los especificados en los códigos 17 09 01, 17 09 02 y 17 09 03',
  'no-peligroso',
  false,
  '17',
  'Residuos de la construcción y demolición (incluida la tierra excavada de zonas contaminadas)',
  '17 09',
  'Otros residuos de construcción y demolición',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 01',
  'Objetos cortantes y punzantes (excepto los del código 18 01 03)',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 02',
  'Restos anatómicos y órganos, incluidos bolsas y bancos de sangre (excepto los del código 18 01 03)',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 03*',
  'Residuos cuya recogida y eliminación es objeto de requisitos especiales para prevenir infecciones',
  'peligroso',
  true,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 04',
  'Residuos cuya recogida y eliminación no es objeto de requisitos especiales para prevenir infecciones (por ejemplo, vendajes, vaciados de yeso, ropa blanca, ropa desechable, pañales)',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 06*',
  'Productos químicos que consisten en, o contienen, sustancias peligrosas',
  'peligroso',
  true,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 07',
  'Productos químicos distintos de los especificados en el código 18 01 06',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 08*',
  'Medicamentos citotóxicos y citostáticos',
  'peligroso',
  true,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 09',
  'Medicamentos distintos de los especificados en el código 18 01 08',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 01 10*',
  'Residuos de amalgamas procedentes de cuidados dentales',
  'peligroso',
  true,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 01',
  'Residuos de maternidades, del diagnóstico, tratamiento o prevención de enfermedades humanas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 02 01',
  'Objetos cortantes y punzantes (excepto los del código 18 02 02)',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 02',
  'Residuos de la investigación, diagnóstico, tratamiento o prevención de enfermedades de animales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 02 02*',
  'Residuos cuya recogida y eliminación es objeto de requisitos especiales para prevenir infecciones',
  'peligroso',
  true,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 02',
  'Residuos de la investigación, diagnóstico, tratamiento o prevención de enfermedades de animales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 02 03',
  'Residuos cuya recogida y eliminación no es objeto de requisitos especiales para prevenir infecciones',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 02',
  'Residuos de la investigación, diagnóstico, tratamiento o prevención de enfermedades de animales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 02 05*',
  'Productos químicos que consisten en, o contienen, sustancias peligrosas',
  'peligroso',
  true,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 02',
  'Residuos de la investigación, diagnóstico, tratamiento o prevención de enfermedades de animales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 02 06',
  'Productos químicos distintos de los especificados en el código 18 02 05',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 02',
  'Residuos de la investigación, diagnóstico, tratamiento o prevención de enfermedades de animales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 02 07*',
  'Medicamentos citotóxicos y citostáticos',
  'peligroso',
  true,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 02',
  'Residuos de la investigación, diagnóstico, tratamiento o prevención de enfermedades de animales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '18 02 08',
  'Medicamentos distintos de los especificados en el código 18 02 07',
  'no-peligroso',
  false,
  '18',
  'Residuos de servicios médicos o veterinarios o de investigación asociada (salvo los residuos de cocina y de restaurante no procedentes directamente de la prestación de cuidados sanitarios)',
  '18 02',
  'Residuos de la investigación, diagnóstico, tratamiento o prevención de enfermedades de animales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 02',
  'Materiales férreos separados de la ceniza de fondo de horno',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 05*',
  'Torta de filtración del tratamiento de gases',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 06*',
  'Residuos líquidos acuosos del tratamiento de gases y otros residuos líquidos acuosos',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 07*',
  'Residuos sólidos del tratamiento de gases',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 10*',
  'Carbón activo usado procedente del tratamiento de gases',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 11*',
  'Cenizas de fondo de horno y escorias que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 12',
  'Cenizas de fondo de horno y escorias distintas de las especificadas en el código 19 01 11',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 13*',
  'Cenizas volantes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 14',
  'Cenizas volantes distintas de las especificadas en el código 19 01 13',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 15*',
  'Polvo de caldera que contiene sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 16',
  'Polvo de caldera distinto del especificado en el código 19 01 15',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 17*',
  'Residuos de pirólisis que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 18',
  'Residuos de pirólisis distintos de los especificados en el código 19 01 17',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 19',
  'Arenas de lechos fluidizados',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 01 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 01',
  'Residuos de la incineración o pirólisis de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 03',
  'Residuos mezclados previamente, compuestos exclusivamente por residuos no peligrosos',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 04*',
  'Residuos mezclados previamente, compuestos por al menos un residuo peligroso',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 05*',
  'Lodos de tratamientos físico-químicos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 06',
  'Lodos de tratamientos físico-químicos distintos de los especificados en el código 19 02 05',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 07*',
  'Aceites y concentrados procedentes del proceso de separación',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 08*',
  'Residuos combustibles líquidos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 09*',
  'Residuos combustibles sólidos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 10',
  'Residuos combustibles distintos de los especificados en los códigos 19 02 08 y 19 02 09',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 11*',
  'Otros residuos que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 02 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 02',
  'Residuos de tratamientos físico-químicos de residuos (incluidas la escromatación, descianuración y neutralización)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 03 04*',
  'Residuos peligrosos parcialmente estabilizados',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 03',
  'Residuos estabilizados/solidificados (7)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 03 05',
  'Residuos estabilizados distintos de los especificados en el código 19 03 04',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 03',
  'Residuos estabilizados/solidificados (7)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 03 06*',
  'Residuos peligrosos solidificados',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 03',
  'Residuos estabilizados/solidificados (7)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 03 07',
  'Residuos solidificados distintos de los especificados en el código 19 03 06',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 03',
  'Residuos estabilizados/solidificados (7)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 04 01',
  'Residuos vitrificados',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 04',
  'Residuos vitrificados y residuos de la vitrificación',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 04 02*',
  'Cenizas volantes y otros residuos del tratamiento de gases',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 04',
  'Residuos vitrificados y residuos de la vitrificación',
  'gaseoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 04 03*',
  'Fase sólida no vitrificada',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 04',
  'Residuos vitrificados y residuos de la vitrificación',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 04 04',
  'Residuos líquidos acuosos del templado de residuos vitrificados',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 04',
  'Residuos vitrificados y residuos de la vitrificación',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 05 01',
  'Fracción no compostada de residuos municipales y asimilados',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 05',
  'Residuos del tratamiento aeróbico de residuos sólidos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 05 02',
  'Fracción no compostada de residuos de procedencia animal o vegetal',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 05',
  'Residuos del tratamiento aeróbico de residuos sólidos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 05 03',
  'Compost fuera de especificación',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 05',
  'Residuos del tratamiento aeróbico de residuos sólidos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 05 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 05',
  'Residuos del tratamiento aeróbico de residuos sólidos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 06 03',
  'Licores del tratamiento anaeróbico de residuos municipales',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 06',
  'Residuos del tratamiento anaeróbico de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 06 04',
  'Lodos de digestión del tratamiento anaeróbico de residuos municipales',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 06',
  'Residuos del tratamiento anaeróbico de residuos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 06 05',
  'Licores del tratamiento anaeróbico de residuos animales y vegetales',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 06',
  'Residuos del tratamiento anaeróbico de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 06 06',
  'Lodos de digestión del tratamiento anaeróbico de residuos animales y vegetales',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 06',
  'Residuos del tratamiento anaeróbico de residuos',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 06 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 06',
  'Residuos del tratamiento anaeróbico de residuos',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 07 02*',
  'Lixiviados de vertedero que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 07',
  'Lixiviados de vertedero',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 07 03',
  'Lixiviados de vertedero distintos de los especificados en el código 19 07 02',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 07',
  'Lixiviados de vertedero',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 01',
  'Residuos de cribado',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 02',
  'Residuos de desarenado',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 05',
  'Lodos del tratamiento de aguas residuales urbanas',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 06*',
  'Resinas intercambiadoras de iones saturadas o usadas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 07*',
  'Soluciones y lodos de la regeneración de intercambiadores de iones',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 08*',
  'Residuos procedentes de sistemas de membranas que contienen metales pesados',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 09',
  'Mezclas de grasas y aceites procedentes de la separación de agua/sustancias aceitosas, que sólo contienen aceites y grasas comestibles',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 10*',
  'Mezclas de grasas y aceites procedentes de la separación de agua/sustancias aceitosas distintas de las especificadas en el código 19 08 09',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 11*',
  'Lodos procedentes del tratamiento biológico de aguas residuales industriales, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 12',
  'Lodos procedentes del tratamiento biológico de aguas residuales industriales, distintos de los especificados en el código 19 08 11',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 13*',
  'Lodos procedentes de otros tratamientos de aguas residuales industriales, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 14',
  'Lodos procedentes de otros tratamientos de aguas residuales industriales distintos de los especificados en el código 19 08 13',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 08 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 08',
  'Residuos de plantas de tratamiento de aguas residuales no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 09 01',
  'Residuos sólidos de la filtración primaria y cribado',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 09',
  'Residuos de la preparación de agua para consumo humano o agua para uso industrial',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 09 02',
  'Lodos de la clarificación del agua',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 09',
  'Residuos de la preparación de agua para consumo humano o agua para uso industrial',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 09 03',
  'Lodos de descarbonatación',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 09',
  'Residuos de la preparación de agua para consumo humano o agua para uso industrial',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 09 04',
  'Carbón activo usado',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 09',
  'Residuos de la preparación de agua para consumo humano o agua para uso industrial',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 09 05',
  'Resinas intercambiadoras de iones saturadas o usadas',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 09',
  'Residuos de la preparación de agua para consumo humano o agua para uso industrial',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 09 06',
  'Soluciones y lodos de la regeneración de intercambiadores de iones',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 09',
  'Residuos de la preparación de agua para consumo humano o agua para uso industrial',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 09 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 09',
  'Residuos de la preparación de agua para consumo humano o agua para uso industrial',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 10 01',
  'Residuos de hierro y acero',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 10',
  'Residuos procedentes del fragmentado de residuos que contienen metales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 10 02',
  'Residuos no férreos',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 10',
  'Residuos procedentes del fragmentado de residuos que contienen metales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 10 03*',
  'Fracciones ligeras de fragmentación (fluff-light) y polvo que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 10',
  'Residuos procedentes del fragmentado de residuos que contienen metales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 10 04',
  'Fracciones ligeras de fragmentación (fluff-light) y polvo distintos de los especificados en el código 19 10 03',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 10',
  'Residuos procedentes del fragmentado de residuos que contienen metales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 10 05*',
  'Otras fracciones que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 10',
  'Residuos procedentes del fragmentado de residuos que contienen metales',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 10 06',
  'Otras fracciones distintas de las especificadas en el código 19 10 05',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 10',
  'Residuos procedentes del fragmentado de residuos que contienen metales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 01*',
  'Arcillas de filtración usadas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 02*',
  'Alquitranes ácidos',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 03*',
  'Residuos de líquidos acuosos',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 04*',
  'Residuos de la limpieza de combustibles con bases',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 05*',
  'Lodos del tratamiento in situ de efluentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 06',
  'Lodos del tratamiento in situ de efluentes distintos de los especificados en el código 19 11 05',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 07*',
  'Residuos de la depuración de efluentes gaseosos',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 11 99',
  'Residuos no especificados en otra categoría',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 11',
  'Residuos de la regeneración de aceites',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 01',
  'Papel y cartón',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 02',
  'Metales férreos',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 03',
  'Metales no férreos',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 04',
  'Plástico y caucho',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 05',
  'Vidrio',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 06*',
  'Madera que contiene sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 07',
  'Madera distinta de la especificada en el código 19 12 06',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 08',
  'Tejidos',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 09',
  'Minerales (por ejemplo, arena, piedras)',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 10',
  'Residuos combustibles (combustible derivado de residuos)',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 11*',
  'Otros residuos (incluidas mezclas de materiales), procedentes del tratamiento mecánico de residuos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 12 12',
  'Otros residuos (incluidas mezclas de materiales) procedentes del tratamiento mecánico de residuos distintos de los especificados en el código 19 12 11',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 12',
  'Residuos del tratamiento mecánico de residuos (por ejemplo, clasificación, trituración, compactación, peletización) no especificados en otra categoría',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 01*',
  'Residuos sólidos, de la recuperación de suelos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 02',
  'Residuos sólidos, de la recuperación de suelos, distintos de los especificados en el código 19 13 01',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 03*',
  'Lodos de la recuperación de suelos, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 04',
  'Lodos de la recuperación de suelos, distintos de los especificados en el código 19 13 03',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 05*',
  'Lodos de la recuperación de aguas subterráneas, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'pastoso',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 06',
  'Lodos de la recuperación de aguas subterráneas, distintos de los especificados en el código 19 13 05',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 07*',
  'Residuos de líquidos acuosos y concentrados acuosos, procedentes de la recuperación de aguas subterráneas, que contienen sustancias peligrosas',
  'peligroso',
  true,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '19 13 08',
  'Residuos de líquidos acuosos y concentrados acuosos, procedentes de la recuperación de aguas subterráneas, distintos de los especificados en el código 19 13 07',
  'no-peligroso',
  false,
  '19',
  'Residuos de las instalaciones para el tratamiento de residuos de las plantas externas de tratamiento de aguas residuales y de la preparación de agua para consumo humano y de agua para uso industrial',
  '19 13',
  'Residuos de la recuperación de suelos y de aguas subterráneas',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 01',
  'Papel y cartón',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 02',
  'Vidrio',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 08',
  'Residuos biodegradables de cocinas y restaurantes',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 10',
  'Ropa',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 11',
  'Tejidos',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 13*',
  'Disolventes',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 14*',
  'Ácidos',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 15*',
  'Álcalis',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 17*',
  'Productos fotoquímicos',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 19*',
  'Pesticidas',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 21*',
  'Tubos fluorescentes y otros residuos que contienen mercurio',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 23*',
  'Equipos desechados que contienen clorofluorocarbonos',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 25',
  'Aceites y grasas comestibles',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'liquido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 26*',
  'Aceites y grasas distintos de los especificados en el código 20 01 25',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'liquido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 27*',
  'Pinturas, tintas, adhesivos y resinas que contienen sustancias peligrosas',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 28',
  'Pinturas, tintas, adhesivos y resinas distintos de los especificados en el código 20 01 27',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 29*',
  'Detergentes que contienen sustancias peligrosas',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 30',
  'Detergentes distintos de los especificados en el código 20 01 29',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 31*',
  'Medicamentos citotóxicos y citostáticos',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 32',
  'Medicamentos distintos de los especificados en el código 20 01 31',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 33*',
  'Baterías y acumuladores especificados en los códigos 16 06 01, 16 06 02 ó 16 06 03 y baterías y acumuladores sin clasificar que contienen esas baterías',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 34',
  'Baterías y acumuladores distintos de los especificados en el código 20 0133',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 35*',
  'Equipos eléctricos y electrónicos desechados, distintos de los especificados en los códigos 20 01 21 y 20 01 23, que contienen componentes peligrosos',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 36',
  'Equipos eléctricos y electrónicos desechados distintos de los especificados en los códigos 20 01 21, 20 01 23 y 20 01 35',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 37*',
  'Madera que contiene sustancias peligrosas',
  'peligroso',
  true,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R13', 'D15', 'D10'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 38',
  'Madera distinta de la especificada en el código 20 01 37',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 39',
  'Plásticos',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 40',
  'Metales',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 41',
  'Residuos del deshollinado de chimeneas',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 01 99',
  'Otras fracciones no especificadas en otra categoría',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 01',
  'Fracciones recogidas selectivamente (excepto las especificadas en el subcapítulo 15 01)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 02 01',
  'Residuos biodegradables',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 02',
  'Residuos de parques y jardines (incluidos los residuos de cementerios)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 02 02',
  'Tierra y piedras',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 02',
  'Residuos de parques y jardines (incluidos los residuos de cementerios)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 02 03',
  'Otros residuos no biodegradables',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 02',
  'Residuos de parques y jardines (incluidos los residuos de cementerios)',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 03 01',
  'Mezclas de residuos municipales',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 03',
  'Otros residuos municipales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 03 02',
  'Residuos de mercados',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 03',
  'Otros residuos municipales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 03 03',
  'Residuos de la limpieza viaria',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 03',
  'Otros residuos municipales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 03 04',
  'Lodos de fosas sépticas',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 03',
  'Otros residuos municipales',
  'pastoso',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 03 06',
  'Residuos de la limpieza de alcantarillas',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 03',
  'Otros residuos municipales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 03 07',
  'Residuos voluminosos',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 03',
  'Otros residuos municipales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;

INSERT INTO public.waste_types (
  codigo_ler, descripcion, categoria, peligroso, capitulo_codigo, capitulo_titulo, subcapitulo_codigo, subcapitulo_titulo, estado, operaciones_permitidas, activo
) VALUES (
  '20 03 99',
  'Residuos municipales no especificados en otra categoría',
  'no-peligroso',
  false,
  '20',
  'Residuos municipales (residuos domésticos y residuos asimilables procedentes de los comercios, industrias e instituciones), incluidas las fracciones recogidas selectivamente',
  '20 03',
  'Otros residuos municipales',
  'solido',
  ARRAY['R03', 'R04', 'R05', 'R13'],
  true
)
ON CONFLICT (codigo_ler) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  categoria = EXCLUDED.categoria,
  peligroso = EXCLUDED.peligroso,
  capitulo_codigo = EXCLUDED.capitulo_codigo,
  capitulo_titulo = EXCLUDED.capitulo_titulo,
  subcapitulo_codigo = EXCLUDED.subcapitulo_codigo,
  subcapitulo_titulo = EXCLUDED.subcapitulo_titulo,
  activo = true;
