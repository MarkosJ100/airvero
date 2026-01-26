# AIRVERO

App de reservas para peluquería individual.

## 📋 Descripción

Aplicación web/Android para gestionar reservas de una única peluquería. Permite al profesional administrar servicios, horarios y citas, y a los clientes reservar de forma sencilla.

**Características principales:**
- ✅ Gestión de servicios y horarios
- ✅ Sistema de reservas
- ✅ Integración con Google Calendar
- ✅ App Android nativa (Capacitor)
- ❌ Sin pagos ni Stripe
- ❌ Sin marketplace (uso individual)

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilos | CSS Vanilla |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| Calendario | Google Calendar API |
| Mobile | Capacitor (Android) |

## 📁 Estructura del Proyecto

```
AIRVERO/
├── src/
│   ├── components/    # Componentes reutilizables
│   ├── pages/         # Páginas (admin/ y client/)
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Supabase y utilidades
│   ├── types/         # Tipos TypeScript
│   └── styles/        # CSS global
├── supabase/          # Migraciones y seeds
├── android/           # Proyecto Android
└── public/            # Assets estáticos
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 📱 Build Android

### 1. Compilar el proyecto web

```bash
npm run build
```

### 2. Añadir plataforma Android

```bash
npx cap add android
```

### 3. Sincronizar y abrir en Android Studio

```bash
npx cap sync android
npx cap open android
```

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Verificar código |

## 🗓️ Fases de Desarrollo

1. **Fase 1 - Base de datos:** Modelo de datos en Supabase
2. **Fase 2 - Interfaz:** UI para admin y clientes
3. **Fase 3 - Backend:** Lógica de negocio y Google Calendar

## 📄 Licencia

Proyecto privado.
