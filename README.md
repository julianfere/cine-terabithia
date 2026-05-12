# Cine Terabithia

Plataforma de gestión para un club de cine entre amigos. Permite coordinar funciones, votar qué película ver, calificar lo que ya se vio y mantener una watchlist colaborativa.

## Funcionalidades

- **Funciones**: programar proyecciones con fecha, horario, lugar y snack; marcarlas como pasadas y calificarlas
- **Votación**: votar entre las recomendaciones de la watchlist para decidir la próxima película
- **Watchlist**: proponer películas con una razón, votar las propuestas de otros
- **Ranking**: ver las películas vistas ordenadas por puntaje promedio
- **Perfiles**: elegir nickname y avatar
- **Admin**: crear/editar funciones, asignar películas, administrar usuarios
- **PWA**: instalable en dispositivos móviles y desktop, funciona offline
- **Push notifications**: notificaciones al programar o reprogramar una función

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Drizzle ORM + Drizzle Kit |
| Auth | NextAuth v5 (Credentials + JWT) |
| API externa | TMDB (posters, metadatos de películas) |
| Push notifications | Web Push (VAPID) via `web-push` |
| Estilos | CSS inline con variables custom |

## Variables de entorno

Crear un archivo `.env.local` en la raíz:

```env
NEXTAUTH_SECRET=           # clave para firmar los JWT
NEXTAUTH_URL=http://localhost:3000
TMDB_API_KEY=              # clave de api.themoviedb.org
DATABASE_URL=              # connection string de PostgreSQL
CRON_SECRET=               # clave para proteger el endpoint de cron
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # clave pública VAPID (generada con web-push)
VAPID_PRIVATE_KEY=              # clave privada VAPID
VAPID_EMAIL=                    # email de contacto para el protocolo Web Push
```

Para generar las claves VAPID:
```bash
node -e "const wp = require('web-push'); const k = wp.generateVAPIDKeys(); console.log(k)"
```

## Instalación y uso

```bash
npm install

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

La app queda en `http://localhost:3000`.

Para aplicar cambios de esquema a la base de datos:
```bash
DATABASE_URL=<url> npx drizzle-kit push
```

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx              # Home: próxima función, votación, archivo
│   ├── login/                # Login
│   ├── votacion/             # Votación de próxima película
│   ├── watchlist/            # Watchlist colaborativa
│   ├── calendario/           # Todas las funciones
│   ├── ranking/              # Ranking por puntaje
│   ├── funciones/[id]/       # Detalle de una función
│   ├── perfil/               # Perfil de usuario
│   ├── admin/                # Panel de administración
│   └── api/                  # API routes
│       ├── screenings/       # CRUD de funciones (dispara push al crear/editar)
│       ├── push/subscribe/   # Suscripción a notificaciones push
│       └── cron/             # Jobs automáticos (actualización de estados)
├── components/
│   ├── PushNotificationsToggle.tsx  # Toggle de notificaciones push
│   └── ...
├── db/
│   ├── schema.ts             # Esquema Drizzle
│   └── index.ts              # Conexión a PostgreSQL
└── lib/
    ├── data.ts               # Queries reutilizables
    ├── push.ts               # Helper para enviar push notifications
    ├── profiles.ts           # Helpers de perfil
    └── avatars.tsx           # Definición de avatares
public/
└── sw.js                     # Service worker (cache + push notifications)
```

## Base de datos

| Tabla | Descripción |
|-------|-------------|
| `users` | Miembros del club |
| `movies` | Películas guardadas desde TMDB |
| `screenings` | Funciones (upcoming / past) |
| `scores` | Calificaciones por función |
| `recommendations` | Propuestas de la watchlist |
| `recommendation_votes` | Votos de la watchlist |
| `screening_votes` | Votos para la próxima función |
| `attendances` | Asistencias a funciones |
| `push_subscriptions` | Suscripciones a notificaciones push |
