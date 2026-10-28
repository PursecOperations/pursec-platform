# pursec-shop — Worker de la tienda

Pagos con Stripe Checkout, pedidos y stock en Supabase. PURSEC tiene stock propio: el envío lo hace Oriol con su app de etiquetas.

```
Cliente elige talla -> POST /checkout (comprueba stock) -> Stripe Checkout
Stripe cobra -> POST /stripe-webhook -> orders (Supabase) + descuento de stock (apply_order_stock)
Oriol envía -> agente Orders marca el pedido como "shipped" con el seguimiento y deja el email al cliente en borrador
```

## Despliegue
Cloudflare Workers Builds, proyecto `pursec-shop`, carpeta raíz `workers/shop`.
Mientras la tienda esté en el PR #19, la rama de producción del Worker es `claude/fase-4-tienda`.
Al fusionar el PR: cambiarla a `main` (Settings -> Builds -> Production branch).

## Secretos (Cloudflare -> pursec-shop -> Settings -> Variables and Secrets -> Add -> tipo "Secret")

| Nombre | De dónde sale |
| --- | --- |
| `SUPABASE_SERVICE_KEY` | Supabase -> pursec-core-db -> Project Settings -> API Keys -> clave secreta (`sb_secret_...`) |
| `STRIPE_SECRET_KEY` | Stripe -> Desarrolladores -> Claves de API -> clave secreta. En pruebas, la del sandbox (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe (sandbox) -> Workbench -> Webhooks -> `pursec-shop-test` -> Signing secret (`whsec_...`) |
| `PACKLINKPRO_API_KEY` | Packlink PRO -> Configuración -> Integraciones -> API key. Al pagar un pedido se crea su borrador de envío (sin pagar) siempre con depósito en oficina y entrega a domicilio (Correos más barato; si no hay, el más barato). Si falla, el error queda en `orders.notes` y reenviar el evento desde Stripe lo reintenta. |
| `ALERT_WEBHOOK_URL` | Webhook de Make (escenario "PURSEC - Avisos de envío") que manda un email a Oriol al momento cuando el envío no es Correos (con los puntos de depósito más cercanos a la dirección predeterminada) o cuando Packlink falla. Sin él, el aviso queda solo en `orders.notes`. |
| `GITHUB_TOKEN` (opcional) | Token fine-grained de solo lectura del repo (Contents, Pull requests, Metadata). Solo para ver PRs y commits en el panel → Ecosistema. |
| `MAKE_API_TOKEN` (opcional) | Token de la API de Make con `scenarios:read`. Solo para ver el estado de los escenarios en el panel → Ecosistema. |

## Variables públicas (en `wrangler.jsonc`)
- `SHIPPING_EUR`: precio del envío que paga el cliente (4,95 €). Vacío = la tienda no deja pagar.
- `FREE_SHIPPING_FROM`: si el importe de las prendas llega a esta cifra en euros (70, clavados incluido), el envío es gratis. Vacío = nunca gratis.
- `SHIP_COUNTRIES`: países a los que se envía (ES,FR,DE,IT,PT). Se amplía cuando se conozca el coste de la etiqueta a otros países.

## Panel privado (`/admin`)
La página `pursec.club/admin/` no contiene datos: pide un enlace mágico de Supabase y luego llama a `GET /admin/<sección>` con el token de sesión. El Worker valida el token contra Supabase en cada petición y solo responde si el email está confirmado y está en `ADMIN_EMAILS`; si no, 401/403 sin datos.

Secciones (solo lectura): `me`, `overview`, `orders`, `shipping`, `products`, `customers`, `finance`, `social`, `ecosystem`. Única escritura: `POST /admin/social` (guarda una medición de redes en `social_stats`, requiere la migración `20261028140000_social_stats.sql`).

Variables nuevas en `wrangler.jsonc`: `ADMIN_EMAILS`, `SUPABASE_PUBLISHABLE_KEY`, `MAKE_ZONE`, `MAKE_TEAM_ID`, `GITHUB_REPO`. En Supabase → Authentication → URL Configuration hay que permitir `https://pursec.club/admin/` (y la vista previa) como Redirect URL.

## Stock
- Cada talla (`product_variants`) tiene `stock`, `sku`, `unit_cost_eur` (privado) y `low_stock_alert`.
- La web solo puede leer `id, product_id, size, color, active, stock`.
- Cada venta descuenta stock y deja un registro en `stock_movements`. Si alguien paga sin stock suficiente, el pedido queda con `stock_issue = true`.

## Pruebas
`npm test` en esta carpeta (14 pruebas, sin dependencias).
