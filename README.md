# Cine Terabithia

Plataforma de gestión para un club de cine entre amigos. Permite coordinar funciones, votar qué película ver, calificar lo que ya se vio y mantener una watchlist colaborativa.

## Funcionalidades

- **Funciones**: programar proyecciones con fecha, horario, lugar y snack; marcarlas como pasadas y calificarlas
- **Votación**: votar entre las recomendaciones de la watchlist para decidir la próxima película
- **Watchlist**: proponer películas con una razón, votar las propuestas de otros
- **Ranking**: ver las películas vistas ordenadas por puntaje promedio
- **Perfiles**: elegir nickname y avatar
- **Admin**: crear/editar funciones, asignar películas, administrar usuarios

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Base de datos | SQLite via `better-sqlite3` |
| ORM | Drizzle ORM + Drizzle Kit |
| Auth | NextAuth v5 (Credentials + JWT) |
| API externa | TMDB (posters, metadatos de películas) |
| Estilos | CSS inline con variables custom |

## Variables de entorno

Crear un archivo `.env.local` en la raíz:

```env
NEXTAUTH_SECRET=      # clave para firmar los JWT
NEXTAUTH_URL=http://localhost:3000
TMDB_API_KEY=         # clave de api.themoviedb.org
DATABASE_URL=./cine.db
```

## Instalación y uso

```bash
npm install

# Inicializar la base de datos (crea tablas y usuario admin)
node seed.cjs

# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

La app queda en `http://localhost:3000`.

## Usuario admin por defecto

| Campo | Valor |
|-------|-------|
| Username | `admin` |
| Password | `terabithia2024` |

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
├── components/               # Componentes compartidos
├── db/
│   ├── schema.ts             # Esquema Drizzle
│   └── index.ts              # Conexión y migraciones
└── lib/
    ├── data.ts               # Queries reutilizables
    ├── profiles.ts           # Helpers de perfil
    └── avatars.tsx           # Definición de avatares
```

## Base de datos

| Tabla | Descripción |
|-------|-------------|
| `users` | Miembros del club |
| `movies` | Películas guardadas desde TMDB |
| `screenings` | Funciones (upcoming / past) |
| `scores` | Calificaciones por función |
| `recommendations` | Propuestas de la watchlist |
| `recommendationVotes` | Votos de la watchlist |
| `screeningVotes` | Votos para la próxima función |

Las migraciones se aplican automáticamente al iniciar el servidor (`db/index.ts`).
