# AIRVERO — App de Reservas para Peluquería Individual

## Objetivo del proyecto

Desarrollar una **aplicación web de reservas para una única peluquería** (uso individual), que permita al profesional gestionar sus servicios, horarios y reservas, y a los clientes reservar citas de forma sencilla.

👉 **No es un marketplace**
👉 **No hay múltiples peluquerías**
👉 **No existe sistema de pagos ni Stripe**
👉 **La app es para un solo negocio**

---

## Descripción general

La aplicación está pensada para **una sola peluquería** y tiene dos tipos de usuarios:

1. **Administrador / Peluquero**

   * Gestiona servicios, horarios y reservas
   * Sincroniza las reservas con Google Calendar
   * Configura disponibilidad y ajustes del negocio

2. **Clientes(modo manual por el peluquero) **

   * Consultare disponibilidad
   * Reservare citas
   * Gestionare o cancelare las reservas
   * TODAS LAS ACTUALIZACIONES DE LA APP SERAN REGISTRADAS CON UN COMINT PARA GITHUB, DANDO LA VERSION QUE SE SUBE

---

## Contexto tecnológico fijo

* **Base de datos y autenticación:** Supabase
* **Calendario:** Google Calendar
* **Pagos:** ❌ No se utilizan pagos ni Stripe
* **Plataforma:** app para android
* **Estética:** moderna, minimalista (fondo blanco, texto negro)

---

## Estructura por fases

El desarrollo del proyecto se divide en **tres fases**:

### Fase 1 — Base de datos

Diseño e implementación del modelo de datos en Supabase para una peluquería individual.

Incluye:

* Usuarios (admin y clientes)
* Perfil único de la peluquería
* Servicios
* Horarios y reglas de disponibilidad
* Reservas
* Integración con Google Calendar

---

### Fase 2 — Interfaz web

Construcción de la UI web completa, separando claramente:

* Área privada del **administrador** (dashboard)
* Área pública / privada de **clientes**

---

### Fase 3 — Backend e integración con Google Calendar

Implementación de la lógica de negocio, API REST y sincronización con Google Calendar.

---

## Fase 1 — Base de Datos (Supabase)

### Contexto fijo

* Supabase como base de datos principal
*
* Una sola peluquería (registro único)
* Google Calendar para reflejar reservas

### Tu tarea

* Diseñar e implementar el modelo de datos

* Crear tablas, relaciones, constraints e índices

* Incluir entidades para:

  * usuarios
  * perfil_de_peluqueria (único)
  * roles (admin / cliente)
  * servicios
  * horarios y reglas básicas
  * reservas
  * integración con Google Calendar (ids externos, estado)

* Añadir datos seed mínimos para pruebas

### Entrega

* Explicación del modelo de datos
* SQL/migraciones ejecutables
* Políticas RLS claras
* Datos de ejemplo

---

## Fase 2 — Interfaz Visual

Construir la UI web con estética moderna y minimalista.

### Requisitos generales

* Autenticación con Supabase Auth:

  * registro por email
  * confirmación de correo
  * login, logout y recuperación de contraseña

---

### Área ADMIN / PELUQUERO

Dashboard con navegación lateral:

* Dashboard (resumen del día)
* Servicios
* Horarios / Disponibilidad
* Reservas
* Integración Google Calendar
* Ajustes del negocio

---

### Área CLIENTES

* Página pública de la peluquería
* Flujo de reserva
* Mis reservas
* Perfil

Requisitos:

* Estados de carga
* Estados vacíos
* Manejo de errores
* UX simple y clara

---

## Fase 3 — Backend y Google Calendar

### Integraciones obligatorias

* Supabase (DB + Auth)
* Google Calendar (OAuth Client ID y Client Secret)

### Tu tarea

Implementar endpoints REST para:

* Gestión de servicios y horarios (admin)
* Consulta de disponibilidad (clientes)
* Creación de reservas
* Cancelación de reservas
* Conexión y desconexión con Google Calendar

Implementar la lógica para:

* Crear eventos en Google Calendar al confirmar una reserva
* Actualizar o cancelar eventos
* Evitar duplicados
* Resolver conflictos simples de horario

Definir cómo se calcula la disponibilidad combinando:

* Reglas almacenadas en Supabase
* Eventos existentes en Google Calendar

Implementar autorización por roles (admin / cliente).

---

## Nota final

Este documento define **una app de reserva para un  profesional  peluquería individual**, pensada para uso real por un solo negocio, sin pagos, sin suscripciones y sin marketplace.

El objetivo es simplicidad, control total del peluquero y una experiencia clara para llevar el control de los clientes.
