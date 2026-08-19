# RESAKA — Implementation plan

## Objetivo inmediato

Construir primero un vertical slice usable en móvil:

1. Home
2. Empezar salida
3. Salida activa
4. Registrar bebidas
5. Cambiar de garito
6. Terminar salida
7. Ver resumen

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
- La preview web se preparará para GitHub Pages, pero las capacidades móviles avanzadas se validarán mediante Expo Go/development builds.

## Fase 0 — Scaffold

- [x] Expo + TypeScript + Expo Router
- [x] Branding centralizado
- [x] Tema inicial
- [x] Home mínima
- [x] Modelos `Outing` y `DrinkEntry`
- [x] Contrato `LocationTracker`
- [x] Contrato de almacenamiento
- [ ] Instalar dependencias y validar build
- [ ] Configurar despliegue web en GitHub Pages

## Fase 1 — Salida local

- [ ] Navegación inferior
- [ ] Empezar salida
- [ ] Cronómetro
- [ ] Pantalla de salida activa
- [ ] Cerveza: quinto / tercio / litrona
- [ ] Kalimotxo one-tap
- [ ] Chupito one-tap
- [ ] Copa one-tap
- [ ] Undo
- [ ] Timeline local
- [ ] Terminar salida
- [ ] Resumen

## Fase 2 — Dispositivo

- [ ] Permisos GPS
- [ ] Tracking foreground
- [ ] Mapa y polyline
- [ ] Persistencia local
- [ ] Recuperación tras cerrar/refrescar
- [ ] Sincronización pendiente

## Fase 3 — Backend y social

- [ ] Supabase
- [ ] Auth
- [ ] Perfiles
- [ ] Garitos
- [ ] Feed
- [ ] Brindis
- [ ] Comentarios
- [ ] Follows

## Fase 4 — Gamificación

- [ ] Prestigio de Barra
- [ ] Rangos
- [ ] Logros
- [ ] Logros secretos
- [ ] Récords personales
- [ ] Currículum Etílico
- [ ] Mi Imperio

## Fase 5 — Expansión

- [ ] Rondas
- [ ] Cuadrillas
- [ ] Salidas en grupo
- [ ] Tracking nativo en segundo plano
