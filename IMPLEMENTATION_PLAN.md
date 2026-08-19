# RESAKA — Implementation plan

## Arquitectura

```text
src/
├── app/              # Rutas y composición de pantallas (Expo Router)
├── components/       # Componentes UI reutilizables
├── config/           # Branding y configuración global
├── domain/           # Modelos y reglas de negocio puras
├── features/         # Funcionalidades agrupadas por dominio
├── services/         # GPS, almacenamiento, backend y adaptadores
├── theme/            # Tokens visuales
└── types/            # Tipos compartidos que no pertenezcan al dominio
```

## Principios

- React Native + Expo + TypeScript strict.
- Expo Router para Android, iOS y web.
- La lógica de negocio no vive en componentes React.
- Solo existen cuatro categorías de bebida: cerveza, kalimotxo, chupito y copa.
- Solo la cerveza tiene tamaño: quinto, tercio o litrona.
- GPS y almacenamiento se consumen mediante interfaces para poder tener implementaciones específicas por plataforma.
- Primero funcionalidad local; Supabase se integra cuando el flujo principal esté estable.
- La preview web se publica desde `main` mediante GitHub Actions y Expo Web.

## Bloque 0 — Base técnica y despliegue

- [x] Expo + TypeScript + Expo Router
- [x] Branding centralizado
- [x] Tema inicial
- [x] Modelos `Outing` y `DrinkEntry`
- [x] Contrato `LocationTracker`
- [x] Contrato de almacenamiento
- [x] Workflow de build/deploy para GitHub Pages
- [x] GitHub Pages habilitado con Source = GitHub Actions
- [x] Export web configurado como SPA para GitHub Pages

## Bloque 1 — Núcleo de una salida

- [x] Navegación inferior
- [x] Empezar salida
- [x] Detectar y continuar una salida activa durante la sesión
- [x] Cronómetro basado en la hora real de inicio
- [x] Pantalla de salida activa
- [x] Cerveza: quinto / tercio / litrona
- [x] Kalimotxo one-tap
- [x] Chupito one-tap
- [x] Copa one-tap
- [x] Undo del último registro
- [x] Timestamp real de cada bebida
- [x] Timeline local
- [x] Confirmación para terminar salida
- [x] Snapshot de salida terminada
- [x] Resumen de duración y bebidas
- [x] Desglose de quintos / tercios / litronas
- [x] Timeline completo en el resumen
- [x] Acceso al último resumen desde Home mientras la app siga abierta

> Estado: **COMPLETADO**. Los datos de este bloque viven todavía en memoria. Persistirlos tras cerrar o refrescar pertenece al Bloque 2.

## Bloque 2 — Persistencia local

- [ ] Abstracción de almacenamiento web/native
- [ ] Guardar salida activa
- [ ] Guardar bebidas y timestamps
- [ ] Recuperar cronómetro real después de recargar
- [ ] Recuperar timeline
- [ ] Detectar una salida en curso al volver a abrir
- [ ] Evitar dos salidas simultáneas
- [ ] Mantener último resumen local

## Bloque 3 — GPS y recorrido

- [ ] Permisos GPS
- [ ] Tracking foreground
- [ ] Route points
- [ ] Filtro de accuracy y GPS spikes
- [ ] Cálculo de distancia
- [ ] Mapa y polyline
- [ ] Ruta en el resumen

## Bloque 4 — Garitos

- [ ] Modelo Venue
- [ ] Garito actual
- [ ] Cambiar de garito
- [ ] Stops y timestamps de entrada/salida
- [ ] Búsqueda/cercanía
- [ ] Creación manual
- [ ] Garitos en timeline y resumen

## Bloque 5 — Backend y cuentas

- [ ] Supabase
- [ ] Auth
- [ ] Perfiles
- [ ] Persistencia servidor
- [ ] Sincronización local ↔ Supabase
- [ ] RLS

## Bloques posteriores

- [ ] Perfil e historial
- [ ] Prestigio de Barra y rangos
- [ ] Logros y récords
- [ ] Currículum Etílico
- [ ] Social: follows, feed, Brindis y comentarios
- [ ] Salidas con amigos
- [ ] Mi Imperio
- [ ] Rondas
- [ ] Cuadrillas
- [ ] App móvil completa y tracking en segundo plano
