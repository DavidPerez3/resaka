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
- Los garitos se obtienen desde proveedores reales; no se mantienen listas mockeadas dentro de la app.
- El flujo principal conserva persistencia local aunque exista backend, para mantener uso offline y no bloquear el registro de una salida.
- Supabase usa RLS y una publishable key en cliente; secretos y service-role keys nunca viven en la app.
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

> Estado: **COMPLETADO**.

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

> Estado: **COMPLETADO**. AsyncStorage sigue siendo la capa local/offline aunque exista sincronización con Supabase.

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
- [x] Finalización con navegación directa al resumen y fallback persistido

> Estado: **COMPLETADO para foreground**. El mapa reconstruye ruta + inicio/final + garitos + consumiciones. El tracking con la app en segundo plano/pantalla bloqueada se reserva para la fase nativa final porque requiere development build y permisos adicionales.

## Bloque 4 — Garitos

- [x] Modelo `Venue` y `OutingStop`
- [x] Contrato `VenueProvider` intercambiable
- [x] Proveedor real OpenStreetMap / Overpass sin garitos mockeados
- [x] Búsqueda GPS en un radio inicial de 500 m
- [x] Resultados ordenados por distancia
- [x] Filtro local por nombre sin llamadas de autocomplete
- [x] Garito actual
- [x] Cambiar de garito durante una salida
- [x] Cierre automático de la parada anterior al cambiar
- [x] Timestamps de entrada y salida
- [x] Creación manual en la posición GPS actual como fallback
- [x] Persistencia y migración automática a snapshot v4
- [x] Reutilización local de garitos ya conocidos
- [x] Asociación de cada nueva consumición al garito activo
- [x] Nombre real del garito en el detalle de consumiciones del mapa
- [x] Marcadores de garitos sobre el mapa
- [x] Garitos en timeline
- [x] Garitos en resumen con entrada, salida, duración y bebidas

> Estado: **COMPLETADO funcionalmente**. La fuente inicial es OpenStreetMap mediante Overpass y está encapsulada detrás de `VenueProvider`, por lo que se podrá sustituir por Google Places u otro proveedor sin cambiar el dominio ni el flujo de la salida. No hay ningún garito mockeado.

## Bloque 5 — Backend y cuentas

- [x] Proyecto Supabase independiente para RESAKA
- [x] Esquema servidor para perfiles, salidas, garitos, paradas, consumiciones y route points
- [x] Migraciones Supabase versionadas en GitHub
- [x] Cliente Supabase tipado con publishable key
- [x] Auth con email + contraseña
- [x] Creación automática de perfil desde `auth.users`
- [x] Pantalla de cuenta integrada en Perfil
- [x] Edición de nombre y alias único
- [x] Persistencia de sesión de Auth
- [x] Cerrar sesión
- [x] Google OAuth implementado en cliente web y callback/deep link nativo
- [x] Credenciales Google Cloud + activación del provider Google en Supabase
- [x] Validación real de Google OAuth en web
- [ ] Validación Google OAuth en development build Android
- [x] Persistencia servidor de salidas terminadas
- [x] Sincronización local → Supabase de garitos, paradas, bebidas y recorrido
- [x] La app sigue funcionando como invitado/offline sin cuenta
- [x] RLS en todas las tablas de usuario
- [x] Auditoría Supabase sin avisos de seguridad
- [x] Índices para claves foráneas y consultas principales

> Estado: **COMPLETADO para web**. Google OAuth funciona en la preview web. La validación nativa de Google se hará junto con la development build Android. La lectura de historial completo desde nube se implementa en el siguiente bloque de Perfil e Historial.

## Bloques posteriores

- [ ] Perfil e historial
- [ ] Compartir salida en redes
  - [ ] Botón `Compartir` desde resumen e historial
  - [ ] Generar una imagen/tarjeta de la salida con branding RESAKA
  - [ ] Plantilla vertical 9:16 para Stories/TikTok/WhatsApp
  - [ ] Plantilla 4:5 o cuadrada para publicaciones
  - [ ] Mostrar datos seleccionables: duración, distancia, bebidas, garitos y fecha
  - [ ] Mostrar la ruta como elemento visual principal al estilo Strava
  - [ ] Permitir elegir una foto del usuario como fondo y superponer los datos de RESAKA
  - [ ] Alternativa sin foto con mapa/fondo oscuro de RESAKA
  - [ ] Previsualización antes de compartir
  - [ ] Controles de privacidad para ocultar ruta, inicio/final, garitos o consumiciones
  - [ ] Compartir mediante Share Sheet nativo en Android/iOS
  - [ ] Web Share API cuando esté disponible y descarga de imagen como fallback web
- [ ] Prestigio de Barra y rangos
- [ ] Logros y récords
- [ ] Currículum Etílico
- [ ] Social: follows, feed, Brindis y comentarios
- [ ] Salidas con amigos
- [ ] Mi Imperio
- [ ] Rondas
- [ ] Cuadrillas
- [ ] App móvil completa y tracking en segundo plano
