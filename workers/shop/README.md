# pursec-shop — Worker de la tienda

Pagos con Stripe Checkout y pedidos automáticos a Printful.

```
Cliente elige talla → POST /checkout → Stripe Checkout
Stripe paga → POST /stripe-webhook → orders (Supabase) → pedido en Printful
Printful envía → POST /printful-webhook?token=… → seguimiento en orders
```

## Despliegue
Cloudflare Workers Builds, proyecto `pursec-shop`, carpeta raíz `workers/shop`.
Mientras la tienda esté en el PR #19, la rama de producción del Worker es `claude/fase-4-tienda`.
Al fusionar el PR: cambiarla a `main` (Settings → Builds → Production branch).

## Secretos (Cloudflare → pursec-shop → Settings → Variables and Secrets → Add → tipo "Secret")

| Nombre | De dónde sale |
| --- | --- |
| `SUPABASE_SERVICE_KEY` | Supabase → pursec-core-db → Project Settings → API Keys → clave secreta (`sb_secret_…`) |
| `STRIPE_SECRET_KEY` | Stripe → Desarrolladores → Claves de API → clave secreta. En pruebas, la del sandbox (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe (sandbox) → Workbench → Webhooks → `pursec-shop-test` → Signing secret (`whsec_…`) |
| `PRINTFUL_TOKEN` | developers.printful.com → Tokens → token privado de la tienda PURSEC |
| `PRINTFUL_WEBHOOK_TOKEN` | Una cadena larga aleatoria que inventas tú; la misma va en la URL del webhook de Printful |

## Variables públicas (en `wrangler.jsonc`)
- `SHIPPING_EUR`: precio del envío que paga el cliente. Vacío = la tienda no deja pagar.
- `PRINTFUL_CONFIRM`: `"false"` = los pedidos entran en Printful como borrador. `"true"` = se fabrican solos.

## Pruebas
`npm test` en esta carpeta (13 pruebas, sin dependencias).
