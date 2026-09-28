# Etapa 1 Guía de aprendizaje y laboratorio de arena PvE en Midnight

**Proyecto:** un personaje enfrenta a un monstruo en un turno y elige golpe, bloqueo o hechizo. Esta guía acompaña el [plan general](plan_midnight_mud.md). Está pensada para estudiar y construir, no para copiar una solución terminada. Revisión de referencias: 28 de septiembre de 2026.

## Resultado esperado

Al terminar, deberías poder compilar un contrato Compact, ejecutar sus circuitos desde TypeScript, probar sus invariantes sin levantar una red y, como cierre opcional, desplegarlo en un entorno de desarrollo. El juego debe aceptar una acción válida, calcular el resultado y rechazar una segunda resolución del mismo encuentro. Debes poder decir exactamente qué se hizo público y qué valor permaneció privado.

**Tiempo orientativo:** cuatro sesiones de 60 a 90 minutos más una sesión opcional de despliegue. Si la instalación te lleva más, no recortes las pruebas: son donde se aprende a pensar como diseñador de contratos.

## Antes de empezar

Conocimientos previos: funciones y tipos básicos de TypeScript, terminal, pruebas unitarias y noción de estado. No hace falta dominar criptografía de conocimiento cero. En Windows, trabaja con WSL: la instalación oficial no soporta desarrollo nativo de Windows por ahora. Elige la versión del compilador y del runtime compatible con el entorno de destino, consultando la matriz oficial; no fijes una versión encontrada en un tutorial viejo. [Instalación oficial](https://docs.midnight.network/getting-started/installation) · [Matriz de compatibilidad](https://docs.midnight.network/relnotes/support-matrix).

Carpeta sugerida para código futuro, dentro de este mismo directorio: `midnight-mud/arena-pve/`, con `contract/`, `src/`, `test/` y un `README.md` que registre versiones y comandos usados. Esta guía es el material docente; todavía no presupone que ese código exista.

## Sesión 1 El modelo mental

### Teoría

Midnight combina un **ledger público**, **circuitos que comprueban reglas** y **cómputo local**. El ledger registra estado observable. Compact define las transiciones y genera los artefactos necesarios para ejecutar y probar el contrato. Un *witness* es una función local que puede proporcionar datos privados al circuito; su implementación corre en el equipo del usuario y no se considera confiable por sí sola. Por eso la regla importante debe quedar dentro del circuito, con restricciones y `assert`, y nunca depender de que la interfaz “se porte bien”. [Seguridad de contratos Compact](https://docs.midnight.network/compact/smart-contract-security) · [Lenguaje Compact](https://docs.midnight.network/compact).

**Entrada privada no equivale a secreto perpetuo.** Compact trata las entradas del circuito como privadas por defecto y exige declarar la publicación de datos derivados antes de escribirlos al ledger. Aun así, un resultado público puede permitir deducir la acción: si solo el hechizo causa 7 de daño, publicar “7” revela la elección. En esta etapa queremos aprender el límite y mostrar la consecuencia pública; el ocultamiento táctico entre turnos llegará con compromisos y revelaciones en etapas posteriores. [Seguridad y divulgación explícita](https://docs.midnight.network/compact/smart-contract-security).

Una prueba local del módulo generado verifica la lógica, pero no genera la prueba criptográfica ni envía una transacción. El proof server y los proveedores de Midnight.js entran en el ejercicio de integración. [Usar Compact desde JavaScript](https://docs.midnight.network/guides/compact-javascript-runtime) · [Pruebas locales](https://docs.midnight.network/guides/local-proving).

### Preguntas para pensar antes de programar

1. Si el resultado revela victoria y daño, ¿qué puede inferir un observador sobre la acción?
2. Si el cliente manda `damage = 999`, ¿qué parte del sistema debe impedirlo?
3. ¿Dónde guardarías una preferencia local que no afecta las reglas? ¿Y dónde guardarías la vida compartida?
4. Si el atacante conoce el código y crea su propio cliente, ¿qué validaciones siguen funcionando?

**Ejercicio de pizarra:** dibuja tres cajas llamadas `cliente y estado privado`, `circuito Compact` y `ledger público`. Sitúa cada dato de la tabla siguiente. Justifica los datos cuya posición te resulte dudosa.

| Dato | Ubicación inicial | Motivo |
| --- | --- | --- |
| Vida inicial y final, turno, resultado | Ledger público | Son el estado compartido que todos deben reconstruir. |
| Acción elegida antes de resolver | Entrada privada del circuito o estado local | La red no necesita recibir el nombre de la acción como campo público. |
| Tabla de daño y coste de acciones | Código del contrato | Todos deben verificar la misma regla. |
| Animación y dibujo del monstruo | Cliente | No afecta la transición canónica. |
| Clave o dato local del usuario | Estado privado protegido | No debe terminar en logs, repositorio ni ledger. |

## Sesión 2 Especificar el combate antes de Compact

Escribe primero una función pura en TypeScript que reciba `estado` y `acción` y devuelva `estado nuevo` o un error. Es una referencia de diseño, **no** una fuente de autoridad: luego trasladarás sus reglas al contrato.

### Reglas propuestas para la versión 0

- El personaje empieza con **10 PV** y el monstruo con **8 PV**. Solo existe un encuentro de una ronda, con identificador y estado `abierto` o `resuelto`.
- `golpe`: causa 4 al monstruo; el monstruo contraataca por 3 si sobrevive.
- `bloqueo`: causa 1; reduce el contraataque a 1 si el monstruo sobrevive.
- `hechizo`: causa 7; el personaje recibe 2 de retroceso y, si el monstruo sobrevive, recibe además el contraataque de 3.
- Se aplica el ataque del jugador primero. Si el monstruo llega a 0, no contraataca. La vida nunca baja de 0. El encuentro queda `resuelto` después de una única acción. Victoria si el monstruo queda a 0; derrota si el personaje queda a 0; en otro caso `supervivencia`.
- Para evitar que la acción privada resulte un parámetro libre sin dueño, **la primera implementación es un laboratorio de un solo jugador y una instancia de encuentro controlada por él**. La autenticación de jugadores externos y múltiples partidas quedan para la siguiente ampliación. No afirmes que un identificador proporcionado por el cliente autentica a nadie.

**Tabla de comprobación:** golpe → monstruo 4, personaje 7; bloqueo → monstruo 7, personaje 9; hechizo → monstruo 1, personaje 5. Con estos valores ninguna acción mata al monstruo. Ese resultado poco heroico es intencional: obliga a entender que un combate de un turno con estas cifras no puede producir victoria. Para tener un final interesante sin violar la especificación, elige y documenta una de estas dos modificaciones **antes de codificar**: bajar la vida inicial del monstruo a 7 para que el hechizo gane, o permitir una segunda ronda en la siguiente etapa. En esta clase usaremos **monstruo de 7 PV**. La tabla final queda: golpe → monstruo 3, personaje 7; bloqueo → monstruo 6, personaje 9; hechizo → monstruo 0, personaje 8, victoria. El retroceso del hechizo se aplica aunque venza.

**Actividad de profesor:** intenta explicar en voz alta por qué el personaje termina con 8 PV al ganar con hechizo. Si la respuesta depende de una animación o de un `if` escondido en el frontend, todavía falta especificación.

### Invariantes que escribirás como pruebas

1. Solo se admiten tres acciones codificadas; un cuarto valor falla.
2. Los PV finales están entre cero y su máximo inicial.
3. El daño no puede proporcionarlo el cliente.
4. Un encuentro resuelto no vuelve a resolverse, aunque cambien la acción o el frontend.
5. Para un estado inicial dado y la misma acción, el resultado es determinista.
6. El monstruo no contraataca después de morir y el retroceso del hechizo siempre se aplica.

## Sesión 3 El contrato mínimo

### Lectura guiada

Lee [la referencia de Compact](https://docs.midnight.network/compact/reference/compact-reference) para tipos enteros, `ledger`, circuitos, `assert` y control de flujo. Luego sigue la guía [usar contratos Compact desde JavaScript](https://docs.midnight.network/guides/compact-javascript-runtime), especialmente compilación, `Contract`, `initialState`, `impureCircuits` y `ledger()`. El módulo generado permite probar transiciones sin nodo, indexador ni proof server.

### Laboratorio paso a paso

1. Instala Compact y comprueba `compact --version` y `compact compile --version` con la [guía de instalación](https://docs.midnight.network/getting-started/installation). Anota versiones de compilador, runtime y Node. Si los bindings fallan al importar, revisa la [matriz de compatibilidad](https://docs.midnight.network/relnotes/support-matrix).
2. Define estado público mínimo: `heroHp`, `monsterHp`, `phase` y `outcome`. Usa un estado finito para fase y resultado, no cadenas arbitrarias si un `enum` es suficiente.
3. Inicializa 10 y 7 PV; `phase = open`. Decide si la instancia del contrato representa un solo encuentro, que es la opción más sencilla aquí. Escribe la regla de ataque del jugador, retroceso, contraataque y saturación a cero dentro del circuito.
4. Expón una sola operación `resolve(action)` y valida `phase == open`. La acción debe tener un tipo restringido; el resultado puede ser visible, pero **no guardes la acción en el ledger**. Revisa los puntos de publicación explícita exigidos por el compilador y documenta cualquier valor inferible.
5. Compila con `compact compile <ruta del contrato> <directorio de salida>` siguiendo la documentación de tu versión. Inspecciona `contract/index.js` e `index.d.ts` generados, sin editarlos. Elige nombres propios para tus circuitos y adapta las importaciones a ellos.
6. Implementa un cliente TypeScript que cree estado inicial, invoque `impureCircuits.resolve(context, action)` y lea el ledger resultante. Construye los contextos con `createConstructorContext` y `createCircuitContext` del runtime, según la guía oficial; no fabriques objetos parciales a mano.
7. Muestra una pantalla de texto o CLI: PV iniciales → acción → PV finales y resultado. La interfaz lee del resultado del circuito; no recalcula la verdad por su cuenta.

**Pseudocódigo de reglas, deliberadamente no sintaxis Compact lista para compilar:**

```text
resolve(action):
  exigir phase == OPEN
  exigir action en {GOLPE, BLOQUEO, HECHIZO}
  daño = tabla_fija[action]
  monsterHp = max(0, monsterHp - daño)
  si action == HECHIZO: heroHp = max(0, heroHp - 2)
  si monsterHp > 0:
    heroHp = max(0, heroHp - (1 si BLOQUEO; 3 en otro caso))
  outcome = VICTORY si monsterHp == 0; DEFEAT si heroHp == 0; SURVIVED si no
  phase = RESOLVED
```

**Punto de pausa:** `max`, tablas y enums se implementan con construcciones permitidas por tu versión de Compact. Los enteros finitos pueden tener comportamiento distinto del `number` de JS; prueba explícitamente límites y evita restas que desborden antes de aplicar saturación.

### Sobre el witness

Para esta clase puedes pasar la acción como entrada privada del circuito si tu versión y contrato lo permiten; no necesitas inventar un witness para que haya privacidad. Si quieres practicar witnesses, crea uno que lea una elección del estado privado local, pero valida el valor dentro del circuito y no trates el witness como fuente de verdad. La documentación aclara que cada usuario puede implementar el suyo. Más adelante usaremos estado privado persistente para tácticas y defensas. [Contextos y witnesses](https://docs.midnight.network/guides/compact-javascript-runtime) · [Límites de confianza](https://docs.midnight.network/compact/smart-contract-security).

## Sesión 4 Pruebas como adversario

Usa Vitest o el framework indicado por la plantilla oficial. Cada test construye un estado fresco. La ejecución del módulo generado comprueba la lógica del contrato sin depender de red; aún falta comprobar integración y prueba ZK. [Guía de pruebas del módulo generado](https://docs.midnight.network/guides/compact-javascript-runtime).

| Caso | Entrada | Comprobación |
| --- | --- | --- |
| Golpe | Abierto, golpe | Monstruo 3, personaje 7, resuelto, supervivencia. |
| Bloqueo | Abierto, bloqueo | Monstruo 6, personaje 9, resuelto, supervivencia. |
| Hechizo | Abierto, hechizo | Monstruo 0, personaje 8, resuelto, victoria. |
| Valor inválido | Acción fuera del dominio | El contrato rechaza la llamada. |
| Repetición | Resolver dos veces | La segunda llamada falla y no cambia el estado. |
| Cliente mentiroso | Intenta imponer daño o PV | No existe tal parámetro; el circuito los calcula. |
| Límite | Variante de prueba con pocos PV | No hay negativos ni desbordamientos. |

**Experimento de privacidad:** inspecciona qué campos quedan visibles en el ledger y qué datos aparecen en la transacción al integrar. Pregunta si el resultado `monstruo 0, personaje 8` delata el hechizo. Sí: **esta versión protege la entrada explícita, pero no la inferencia a partir de la salida**. Escribe esta limitación en el README del prototipo. La siguiente etapa puede introducir decisiones simultáneas, sal y compromisos si se requiere secreto temporal más fuerte.

**Pregunta de profesor:** ¿pasarían las pruebas si el frontend alterase su copia local del daño? Si la respuesta es sí porque el contrato ignora esa copia, el límite de confianza está bien puesto.

## Sesión 5 Opcional Red local o testnet

Cuando todas las pruebas de lógica pasen, sigue [desplegar y operar un contrato](https://docs.midnight.network/guides/deploy-and-operate) y [probar transacciones localmente](https://docs.midnight.network/guides/local-proving). Necesitarás artefactos de compilación completos, proof server, wallet y proveedores de Midnight.js. Empieza por red local o entorno de pruebas y fondos de prueba; los endpoints y versiones dependen de la [guía de redes](https://docs.midnight.network/guides/networks-and-environments).

Haz una partida, conserva el identificador de transacción y comprueba que la lectura del estado desplegado coincide con la predicción de tus pruebas. Registra tiempo total de prueba y envío. Si se produce un error de compatibilidad, verifica primero las versiones del compilador, runtime, red y proof server. No publiques semillas de wallet en el repositorio ni en capturas.

## Entregables y evaluación

- **Contrato y pruebas:** código fuente Compact, suite que cubra los siete casos de la tabla y un comando reproducible para compilar y ejecutar tests.
- **Cliente mínimo:** CLI con tres elecciones y visualización de PV y resultado extraídos del estado del contrato.
- **README técnico:** versiones exactas, instrucciones de ejecución, diagrama público/privado y un apartado titulado `Qué puede inferir un observador`.
- **Reflexión de una página:** cuál fue la invariante más fácil de romper, qué dato no debería aparecer en el ledger y cómo lo comprobarías.

**Aprobado para avanzar:** puedes explicar el recorrido de una llamada desde el cliente hasta el estado público, provocar un rechazo desde el contrato, mostrar que la segunda resolución falla y reconocer la inferencia sobre el hechizo. El despliegue real es un plus útil, pero no sustituye entender las reglas.

## Lecturas oficiales en orden recomendado

1. [Instalar herramientas](https://docs.midnight.network/getting-started/installation) y [compatibilidad entre versiones](https://docs.midnight.network/relnotes/support-matrix).
2. [Conceptos y seguridad de Compact](https://docs.midnight.network/compact/smart-contract-security), en particular los tres contextos de ejecución, witnesses y divulgación.
3. [Referencia del lenguaje Compact](https://docs.midnight.network/compact/reference/compact-reference), para resolver dudas puntuales de sintaxis y tipos.
4. [Ejecutar y probar Compact desde JavaScript](https://docs.midnight.network/guides/compact-javascript-runtime). Es la referencia central para el laboratorio.
5. [Ejemplo oficial Bulletin Board](https://github.com/midnightntwrk/example-bboard), como proyecto de referencia completo; adapta patrones, no sus reglas de juego.
6. [Pruebas locales](https://docs.midnight.network/guides/local-proving) y [despliegue](https://docs.midnight.network/guides/deploy-and-operate), al llegar a la sesión opcional.

**Próximo paso del juego:** tres salas encadenadas, energía y recompensa persistente. Allí importará de verdad mantener una preparación privada entre interacciones y diseñar cómo se revela o prueba cuando produce un efecto compartido.
