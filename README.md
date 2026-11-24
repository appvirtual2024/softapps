# JugoSoft — app

## Requisitos
- Node 18+
- pnpm 9+ (`npm install -g pnpm` si no lo tienes)

## Primeros pasos

```bash
pnpm install
pnpm dev
```

Abre la URL que muestre la terminal (normalmente http://localhost:5173).

El archivo `.env` ya trae la URL y la llave pública del proyecto Supabase
`appcomercialnegocio`. No necesitas configurar nada más para probar en local.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Levanta el servidor de desarrollo (Vite) |
| `pnpm build` | Compila TypeScript y genera `dist/` para producción |
| `pnpm preview` | Sirve `dist/` en local para probar el build de producción |
| `pnpm deploy` | Compila y despliega a Cloudflare Pages (requiere `wrangler login` la primera vez) |

## Estructura

```
src/
  app/            -> componente raíz, decide qué pantalla mostrar
  lib/supabase/    -> cliente único de Supabase + tipos generados del esquema
  modules/
    auth/          -> registro, login, sesión
    organizations/ -> creación del negocio (organización)
```

Cada módulo nuevo (sucursales, inventario, POS...) sigue el mismo patrón:
`modules/<dominio>/<dominio>.model.ts` (tipos), `<dominio>.service.ts` (llamadas
a Supabase) y `components/` (pantallas de React que usan el servicio).
