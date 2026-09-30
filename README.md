# pursec-platform

Código de PURSEC (pursec.club).

| Carpeta | Qué es | Se despliega en |
| --- | --- | --- |
| `public/` | Web pública (HTML estático) | Worker `pursec-platform` (Cloudflare, Workers Builds, raíz `/`) |
| `workers/cfo-agent/` | Agente 08: webhook de Stripe → planes y contabilidad en Supabase | Worker `pursec-cfo-agent` (Workers Builds, raíz `workers/cfo-agent`) |
| `.github/disabled/` | Workflow antiguo de agentes, desactivado hasta la Fase 3 | — |
| `*.py` | Scripts antiguos de agentes (modelo de live timing), pendientes de revisar | — |

Solo `public/` se sirve en la web. Los secretos viven en Cloudflare (Variables and Secrets), nunca en el repo.
