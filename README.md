# pursec-platform

Código de PURSEC (pursec.club), marca de streetwear. El código del antiguo club de motorsport está guardado en la rama `archivo/club-motorsport`.

Ahora mismo no hay producto a la venta: la web es el logo y la lista de espera.

| Carpeta | Qué es | Se despliega en |
| --- | --- | --- |
| `public/` | Web pública: portada con lista de espera y legal | Worker `pursec-platform` (Cloudflare, Workers Builds, raíz `/`) |
| `workers/shop/` | Infraestructura de tienda (checkout con Stripe, pedidos en Supabase, envíos con Packlink). Sin productos: no se usa hasta que haya prendas. Pruebas: `npm test` en esa carpeta | Worker `pursec-shop` (Workers Builds, raíz `workers/shop`) |
| `supabase/migrations/` | Cambios de base de datos, en orden. Ya aplicados en `pursec-core-db` | — |
| `docs/marca/` | Logo y reglas de marca | — |

Solo `public/` se sirve en la web. Los secretos viven en Cloudflare (Variables and Secrets), nunca en el repo.
