# P.E.P · Plan Estratégico Personal

App web privada (pensada para el móvil) para seguir el plan anual:

- **Objetivos**: 2 por área (espiritual, física, mental) con check y fecha de logro.
- **Hábitos**: columnas Conseguidos (30+ días seguidos), En proceso (contador de racha) y Banquillo.
- **Viajes**: fechas de ida/vuelta y viajes por mes.
- **Oscuridad**: registro con fecha de borracheras, atracones y ponerme malo.
- **Luz**: momentos de felicidad (con etiquetas para ver patrones) y dar sin esperar nada.

## Técnica

- Frontend estático sin build: `public/` (HTML + CSS + JS).
- API en funciones de Vercel (`api/`): login con cookie firmada y datos en un **Vercel Blob privado** (`pep/data.json`).
- No indexable: `robots.txt` con `Disallow: /`, meta `noindex` y cabecera `X-Robots-Tag` en todas las rutas.

## Variables de entorno (Vercel)

| Variable | Uso |
| --- | --- |
| `AUTH_EMAIL` | Email de acceso |
| `AUTH_PASSWORD` | Contraseña de acceso |
| `SESSION_SECRET` | Secreto para firmar la sesión |
| `BLOB_READ_WRITE_TOKEN` | Lo crea Vercel al conectar el Blob store |

Las credenciales no están en el código: se cambian en Vercel → Settings → Environment Variables (y redeploy).
