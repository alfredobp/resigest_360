# Plantillas de Mocks y Ejemplos de Pruebas

Esta guía contiene patrones listos para usar al crear pruebas para servicios de ResiGest 360.

## 1. Mock Completo de Multi-tenancy

```typescript
const mockUser = { id: 'user-tenant-123' };
const mockUserCompanies = [{ id: 10 }, { id: 20 }];

const setupTenantContext = (userId = 'user-tenant-123', companies = [{ id: 10 }, { id: 20 }]) => {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: userId ? { id: userId } : null },
  });

  const companiesChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: companies, error: null }),
  };

  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'companies') return companiesChain;
    return null;
  });

  return { companiesChain };
};
```

## 2. Mock de Supabase Storage

```typescript
const mockStorageFrom = {
  upload: jest.fn().mockResolvedValue({ error: null }),
  getPublicUrl: jest.fn().mockReturnValue({
    data: { publicUrl: 'https://supabase.co/storage/v1/object/public/images/sample.pdf' },
  }),
};

mockSupabase.storage = {
  from: jest.fn(() => mockStorageFrom),
};
```

## 3. Mock de APIs Externas (Holded / Fetch)

```typescript
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'holded-123', status: 'ok' }),
  } as any);
});

afterEach(() => {
  global.fetch = originalFetch;
});
```

## 4. Entornos DOM vs Node en Jest

Si el servicio manipula objetos del DOM (como descarga de archivos, `document.createElement`, `Blob`, `URL.createObjectURL`), añadir polyfills locales en el archivo de test:

```typescript
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeAll(() => {
  if (typeof URL.createObjectURL === 'undefined') {
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
  }
});

afterAll(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});
```
