# RESAKA

**Los datos que no recordabas.**

RESAKA es una app móvil social y humorística para registrar salidas: recorrido, garitos, cervezas, kalimotxos, chupitos y copas.

## Estado actual

Proyecto Expo + React Native + TypeScript + Expo Router con un MVP web y Android funcional:

- Home de RESAKA.
- Navegación inferior: Inicio, Explorar, Salida, Cuadrillas y Perfil.
- Pantalla de salida activa.
- Cronómetro en tiempo real.
- Cerveza con selector Quinto / Tercio / Litrona.
- Kalimotxo, chupito y copa a un toque.
- Contadores locales por bebida.
- Deshacer último registro.
- Confirmación para terminar la salida.
- Persistencia offline con AsyncStorage.
- GPS foreground, ruta, distancia y mapas web/nativos.
- Garitos reales mediante OpenStreetMap/Overpass.
- Resumen final y tarjeta PNG 9:16 para compartir en web y Android/iOS.
- Cuenta y sincronización de salidas terminadas mediante Supabase.

Pendiente para la experiencia móvil completa: validar Google OAuth en Android, tracking en segundo plano e historial completo desde Supabase.

## Desarrollo

```bash
npm install
npm start
```

Para exportar la versión web:

```bash
npm run export:web
```

Durante estas primeras iteraciones usamos Expo SDK 54 para facilitar pruebas en dispositivo físico con Expo Go. La arquitectura queda preparada para development builds y funcionalidades nativas más avanzadas.

## GitHub Pages

La app web se exporta de forma estática y está configurada para vivir bajo `/resaka`.

El workflow `.github/workflows/deploy-pages.yml` se ejecuta en cada push a `main` y realiza:

1. instalación de dependencias;
2. typecheck;
3. export de Expo Web a `dist/`;
4. subida del artefacto;
5. despliegue a GitHub Pages.

Una vez habilitado GitHub Pages con **Source = GitHub Actions**, la preview quedará disponible en:

`https://davidperez3.github.io/resaka/`

## Plan

Consulta `IMPLEMENTATION_PLAN.md` para ver el estado de cada fase.
