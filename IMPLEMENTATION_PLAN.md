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
- GPS y almacenamiento se consumen mediante interfaces para poder cambiar implementaciones sin tocar el dominio.
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
- [x] Acceso al último resumen desde Home

> Estado: **COMPLETADO**.

## Bloque 2 — Persistencia local

- [x] Abstracción `KeyValueStorage`
- [x] Adaptador persistente multiplataforma con AsyncStorage
- [x] Snapshot versionado de la sesión
- [x] Guardar salida activa automáticamente
- [x] Guardar bebidas y timestamps automáticamente
- [x] Recuperar cronómetro real después de recargar/cerrar
- [x] Recuperar timeline y contadores
- [x] Detectar una salida en curso al volver a abrir
- [x] Evitar dos salidas simultáneas
- [x] Mantener último resumen local
- [x] Validar/sanear datos persistidos antes de restaurar
- [x] Estado visual mientras se recuperan los datos
- [x] Aviso si falla el almacenamiento local

> Estado: **COMPLETADO**. El almacenamiento actual es local al dispositivo/navegador. La sincronización entre dispositivos llegará con Supabase en el Bloque 5.

## Bloque 3 — GPS y recorrido

- [x] Permiso de ubicación foreground
- [x] Tracking foreground con `expo-location`
- [x] `RoutePoint` multiplataforma
- [x] Persistencia y recuperación de route points
- [x] Migración automática de snapshots del Bloque 2 a la nueva versión
- [x] Filtro de coordenadas inválidas
- [x] Filtro de accuracy muy mala
- [x] Umbral mínimo de distancia entre puntos
- [x] Filtro básico de GPS spikes por velocidad implícita imposible
- [x] Distancia Haversine acumulada
- [x] Estado de GPS: buscando / activo / denegado / error
- [x] Reintento de permiso/tracking sin bloquear la salida
- [x] Coordenadas de la última posición asociadas a nuevas bebidas
- [x] Mapa web con OpenStreetMap y polyline
- [x] Mapa nativo con `react-native-maps`
- [x] Mapa configurado para no bloquear el scroll de la pantalla
- [x] Ruta y distancia en directo
- [x] Ruta persistida en el resumen final
- [x] Ruta recuperada después de cerrar o recargar
- [x] Leyenda explícita: inicio verde y última posición/final rojo
- [x] Marcadores de consumiciones sobre la ruta
- [x] Agrupación de consumiciones registradas a menos de 25 m para evitar saturar el mapa
- [x] Badge agrupado por tipo de bebida (`🍺2 🍷 🥃`, etc.)
- [x] Detalle en resumen con hora, lugar y consumición
- [x] Lugar preparado para resolverse con el garito real en el Bloque 4
- [x] Navegación al resumen sincronizada con el estado para evitar la pantalla blanca al terminar

> Estado: **COMPLETADO para foreground**. El mapa ya reconstruye ruta + inicio/final + consumiciones y el resumen enseña el detalle de cada grupo. Hasta implementar Garitos, el lugar de una consumición se muestra como `Sin garito`. El tracking con la app en segundo plano/pantalla bloqueada se reserva para la fase nativa final porque requiere development build y permisos adicionales.

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
