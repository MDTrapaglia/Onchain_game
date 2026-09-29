# Etapa 1 Arena PvE

Implementación de la [guía de la primera etapa](../etapa_1_arena_pve.md). Un combate de una ronda: golpe, bloqueo o hechizo. El contrato Compact calcula la transición y conserva los PV y el resultado en el ledger; una función local aporta la acción privada al circuito.

## Requisitos

- Node.js 24 y npm.
- Compact CLI y compilador **0.31.1**; runtime Compact **0.16.0**. Comprueba la [matriz de compatibilidad](https://docs.midnight.network/relnotes/support-matrix) si cambias de red o versión.
- En Windows, ejecuta el entorno de desarrollo dentro de WSL.

## Ejecutar

Desde esta carpeta:

```bash
compact update 0.31.1
npm ci
npm run compile
npm test
npm run check
npm run play -- hechizo
```

Puedes reemplazar `hechizo` por `golpe` o `bloqueo`. El directorio `build/` se genera al compilar y no se versiona; compila antes de probar o jugar. La CLI simula el contrato con el módulo JavaScript generado por Compact. **No envía una transacción a Midnight ni produce una prueba ZK.** La integración con wallet, proof server y red se estudia después de verificar esta lógica local.

## Reglas

| Acción | Daño | Retroceso | Contraataque si el monstruo vive | PV finales héroe / monstruo |
| --- | ---: | ---: | ---: | --- |
| Golpe | 4 | 0 | 3 | 7 / 3 |
| Bloqueo | 1 | 0 | 1 | 9 / 6 |
| Hechizo | 7 | 2 | 0 | 8 / 0 |

Inicialmente el héroe tiene 10 PV y el monstruo 7. Solo hay una resolución por instancia del contrato. Las restas no desbordan porque los valores iniciales son fijos, las tres acciones están validadas y el estado pasa a `RESOLVED` tras una acción. Si se añade una segunda ronda o se permiten PV iniciales configurables, hay que introducir saturación y probar los nuevos límites antes de reutilizar esta fórmula.

## Qué puede inferir un observador

`localAction` lee la elección desde el estado privado local. Compact obliga a declarar la publicación de los PV calculados mediante `disclose`; la acción no queda guardada como campo del ledger. Pero el par de PV finales identifica cada acción en esta versión. La elección es **una entrada privada de la prueba, no una táctica secreta después de resolver**. Además, esta instancia didáctica no autentica a un jugador: cualquiera que pueda invocar el contrato abierto puede resolverlo. No se debe usar para premios o PvP hasta añadir control de acceso y reglas contra abandono.

## Pruebas y siguiente paso

La suite comprueba las tres transiciones, acciones inválidas, repetición y determinismo. Puedes modificar deliberadamente el daño en `arena.compact`, recompilar y observar cuál prueba falla. El siguiente ejercicio añade encuentros persistentes; entonces tendremos que decidir cómo mantener secretos entre turnos y cómo manejar estado privado recuperable.
