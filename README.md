# pursec-platform

Código de PURSEC (pursec.club), marca de streetwear. El código del antiguo club de motorsport está guardado en la rama `archivo/club-motorsport`.

| Carpeta | Qué es | Se despliega en |
| --- | --- | --- |
| `public/` | Web pública: tienda (portada), gracias y legal | Worker `pursec-platform` (Cloudflare, Workers Builds, raíz `/`) |
| `workers/shop/` | Tienda: `/checkout` (Stripe Checkout), webhook de Stripe → pedido en Supabase → Printful, webhook de Printful → seguimiento. Pruebas: `npm test` en esa carpeta | Worker `pursec-shop` (Workers Builds, raíz `workers/shop`) [PENDIENTE: conectar] |
| `workers/cfo-agent/` | Cobros del antiguo club (suscripciones). Se retira cuando la tienda esté en producción | Worker `pursec-cfo-agent` (Workers Builds, raíz `workers/cfo-agent`) |
| `supabase/migrations/` | Cambios de base de datos, en orden. Ya aplicados en `pursec-core-db` | — |

Solo `public/` se sirve en la web. Los secretos viven en Cloudflare (Variables and Secrets), nunca en el repo.
