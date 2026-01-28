# AIRVERO v2.0

App de gestión interna para peluquería (uso exclusivo admin).

## 📋 Descripción

Aplicación web/Android de gestión interna para una peluquera. **Solo la peluquera tiene acceso** para gestionar clientes, reservas, servicios y horarios de manera centralizada.

**Características principales:**
- ✅ Gestión de contactos internos (agenda de clientes)
- ✅ Gestión de reservas manual (admin-only)
- ✅ Integración con WhatsApp (confirmaciones manuales)
- ✅ Agenda visual (calendario interno)
- ✅ Gestión de servicios y horarios
- ✅ App Android nativa (Capacitor)
- ❌ Sin acceso para clientes
- ❌ Sin registro público
- ❌ Sin pagos ni Stripe

## 🛠️ Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilos | CSS Vanilla |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (solo admin) |
| WhatsApp | Deep Links |
| Mobile | Capacitor (Android) |

## 📁 Estructura del Proyecto

```
AIRVERO/
├── src/
│   ├── components/    # Componentes reutilizables
│   ├── pages/
│   │   ├── admin/    # Solo admin (Dashboard, Clientes, Reservas, etc.)
│   │   └── auth/     # Solo Login
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Supabase, WhatsApp, utilidades
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

### 2. Sincronizar con Capacitor

```bash
npx cap sync android
```

### 3. Abrir en Android Studio

```bash
npx cap open android
```

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Verificar código |

## 🗂️ Funcionalidades v2.0

### 👥 Gestión de Clientes
- Agenda de contactos interna (no son usuarios auth)
- CRUD completo (crear, editar, eliminar)
- Búsqueda por nombre y teléfono
- Notas personalizadas
- Botón WhatsApp directo

### 📋 Gestión de Reservas
- Crear reservas manualmente para cualquier cliente
- Filtros por estado (pendiente, confirmada, completada)
- Cambiar estados de reservas
- WhatsApp para confirmar citas
- Mensajes prellenados con detalles de la cita

### 📅 Agenda Visual
- Calendario interno (no sincronización automática)
- Colores por estado de reserva
- Vista clara de citas del día/semana

### 💇 Servicios y Horarios
- Gestión de servicios ofrecidos
- Configuración de horarios semanales
- Ajustes del negocio

## 📄 Licencia

Proyecto privado.
