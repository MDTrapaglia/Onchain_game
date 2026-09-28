# Ruta de aprendizaje de Midnight mediante un juego onchain

**Proyecto guía:** un mundo de casillas persistente donde la privacidad permite explorar, preparar tácticas y sorprender; las consecuencias visibles de cada acción quedan como historia compartida. Versión inicial del plan: septiembre de 2026.

## La visión jugable

Empezamos con un encuentro PvE que puede jugar una sola persona. Cada iteración agrega una mecánica y una pieza de Midnight hasta llegar a un MUD de mundo cuadriculado y modificable. Un druida podrá cultivar un bosque en su territorio, esconder parte de sus defensas y dejar senderos que otros descubran. Una guerra podrá quemar un claro, levantar ruinas y dejar un monumento con la fecha y los participantes. El mundo recuerda lo ocurrido sin publicar todos los secretos que lo hicieron posible.

La privacidad no debe convertir el juego en una caja negra: cada efecto público necesita una transición validable y reglas conocidas. **Se oculta información táctica; se publican consecuencias y pruebas de legalidad.**

## Contrato de diseño desde el primer día

- **Público:** identificador y versión del encuentro, turnos, resultado, vida visible cuando corresponda, propiedad y aspecto de las casillas, construcciones descubiertas, eventos históricos.
- **Privado del jugador:** elección táctica antes de resolver, composición de recursos ocultos, rutas no reveladas, posiciones de trampas, detalles de una base aún no explorada.
- **Compromisos y pruebas:** una raíz o hash fija secretos antes de conocer la respuesta del rival; una prueba valida que la acción respeta límites y recursos sin revelar todos los detalles. Si un dato privado determina el estado compartido, la regla de revelación o validación debe definirse explícitamente.
- **Fuera de cadena cuando convenga:** arte, textos extensos, animaciones, búsqueda e indexación del mapa. El estado canónico y las reglas críticas pertenecen al contrato; el cliente reconstruye vistas a partir de datos públicos y datos privados de su dueño.
- **Regla de honestidad:** un secreto guardado solo en el dispositivo del jugador puede perderse y puede facilitar abandono estratégico. Cada fase incluye recuperación, plazos o resolución de ausencias antes de llamarla competitiva.

## Etapas del juego y del aprendizaje

### Etapa 0 Preparar el taller

**Aprendemos:** modelo de ledger público, estado privado, testigos, circuitos Compact, compilación, pruebas locales, Midnight.js y generación de pruebas. Usar la documentación vigente para instalar compilador, entorno local, wallet y proof server; en Windows, evaluar WSL.

**Construimos:** repositorio con un contrato mínimo de `crear partida` y `registrar resultado de demostración`, pruebas de reglas y una interfaz de texto. Hacer una transacción real en el entorno de desarrollo y leer el estado público resultante.

**Criterio de salida:** podemos explicar dónde vive cada dato y reproducir el mismo flujo desde cero. Registrar versiones concretas de herramientas, pues la plataforma evoluciona.

### Etapa 1 Un monstruo y una decisión secreta

**Juego:** arena PvE de un turno. El personaje elige **golpe, bloqueo o hechizo**. El monstruo usa una conducta determinista y anunciada para que el primer prototipo no dependa de un operador secreto. La elección del jugador se mantiene privada durante su preparación; el resultado publica daño y victoria o derrota.

**Aprendemos:** tipos y circuitos Compact, entradas privadas, límites verificables, ejecución desde TypeScript y pruebas de transiciones. Empezamos con números pequeños y reglas discretas; ninguna simulación de combate compleja todavía.

**Entrega:** partida jugable de principio a fin, con invariantes probados: vida dentro de rango, una única acción válida y una sola resolución por encuentro.

### Etapa 2 Riesgo real con encuentros repetidos

**Juego:** tres salas consecutivas, energía limitada y una recompensa elegida entre dos mejoras. Antes de entrar en una sala elegimos una táctica privada. Se publican progreso y recompensas obtenidas, sin exponer inmediatamente toda la preparación.

**Aprendemos:** persistencia entre turnos, identidad de partidas, control de repetición, pruebas de elegibilidad y separación entre estado local y compartido. Medimos latencia de pruebas y coste de cada interacción para decidir qué agrupar en una transacción.

**Entrega:** una mini expedición PvE rejugable; cerrar y reabrir el cliente conserva el avance.

### Etapa 3 Enemigos con secretos sin confiar ciegamente en un servidor

**Juego:** el monstruo prepara un patrón entre varios posibles. El jugador obtiene pistas y decide entre atacar, defender o investigar. Primero usamos **un mazo público precomprometido** de patrones y una política verificable de selección; después experimentamos con un director PvE que precompromete semillas, da pruebas y tiene plazos de revelación.

**Aprendemos:** compromisos, revelación selectiva, aleatoriedad, sesgos y disponibilidad. Documentamos que un operador que conoce los secretos del monstruo puede influir o filtrarlos; no vender esa versión como plenamente descentralizada.

**Entrega:** el jugador no puede cambiar su acción al ver el patrón y el director no puede elegir retroactivamente un patrón favorable. Si alguien no revela a tiempo, el contrato aplica una salida determinista.

### Etapa 4 Primer PvP asíncrono opcional

**Juego:** duelo de dos rondas, con elección simultánea de ataque, guardia o engaño. Ambos fijan sus decisiones antes de resolver. El PvE sigue siendo el modo principal y permite probar todas las novedades sin depender de otra persona.

**Aprendemos:** compromisos por ronda, expiración de turnos, abandono, desempate y amenazas de collusion o múltiples cuentas. Diseñamos una experiencia por turnos, sin pretender tiempo real onchain.

**Entrega:** dos jugadores pueden terminar una partida incluso si uno desaparece; las acciones tardías o repetidas se rechazan.

### Etapa 5 Primer mapa de casillas

**Juego:** un tablero pequeño, por ejemplo 16 × 16, con biomas, nodos de recursos y una parcela reclamable por personaje. El movimiento y la propiedad se vuelven públicos; los descubrimientos personales pueden permanecer privados hasta una interacción relevante.

**Aprendemos:** representación compacta de coordenadas, permisos sobre casillas, índices y eventos. Evitamos escribir cada paso del avatar en cadena si su coste o latencia estropea el juego: fijamos hitos y resultados, mientras la navegación fluida se presenta en el cliente.

**Entrega:** se puede reclamar, visitar y modificar una casilla respetando su dueño y los recursos disponibles; un observador reconstruye el mismo mapa público.

### Etapa 6 El bosque del druida

**Juego:** cada jugador elige una vocación inicial. El druida planta árboles, crea senderos y mejora un santuario. La forma visible del bosque y su evolución son públicas; la ubicación de algunas trampas, reservas o hechizos preparados permanece oculta hasta activarse.

**Aprendemos:** compromisos de configuraciones ocultas, pruebas de pertenencia y gasto de recursos, autorización de modificaciones, recuperación del estado privado y privacidad de metadatos. Definimos qué ve el dueño, qué ve un visitante y qué aparece tras una incursión.

**Entrega:** un visitante puede explorar el bosque, disparar una defensa válida y recibir un resultado comprobable sin acceder a todas las defensas restantes.

### Etapa 7 Historia escrita en el terreno

**Juego:** asedios PvE y luego conflictos PvP pueden transformar casillas: incendio, regeneración, cráter, ruina o monumento. Una victoria no borra todo; deja marcas que admiten restauración o reinterpretación.

**Aprendemos:** máquinas de estado de terreno, límites de destrucción, permisos y arbitraje de conflictos simultáneos. Definimos ventanas de ataque y protección para que una persona desconectada no pierda semanas de trabajo mientras duerme.

**Entrega:** el mapa conserva un historial mínimo verificable de cambios con autor, causa, instante de cadena y reglas aplicadas; el arte narrativo puede vivir fuera de cadena con un identificador o hash de referencia.

### Etapa 8 MUD persistente

**Juego:** regiones conectadas, profesiones que alteran el entorno, exploración cooperativa, comercio de recursos, expediciones y crónicas de guerras. El mapa tiene capas: territorio visible, información descubierta personalmente y secretos que solo se prueban cuando afectan a otros.

**Aprendemos:** modularidad de contratos, migraciones, indexación, rendimiento, recuperación de partidas y economía de acciones. Abrimos gradualmente el mundo a más jugadores después de probar abuso, congestión y equilibrio.

**Entrega:** una persona nueva puede entrar, explorar, construir y encontrar huellas anteriores sin coordinación manual con los autores del juego.

## Arquitectura sugerida

1. **Compact:** invariantes de combate, permisos, recursos y cambios persistentes del mapa.
2. **Estado privado y testigos:** elecciones y configuraciones secretas bajo control del jugador. Diseñar respaldo y migración desde temprano.
3. **Midnight.js y proof server:** llamadas al contrato, generación de pruebas y envío de transacciones.
4. **Indexador y API de lectura:** proyección del mapa y cronología a partir del ledger público; el índice acelera la lectura, pero no decide reglas.
5. **Cliente web:** primero interfaz textual y tablero simple; luego tiles y exploración visual. El motor gráfico puede cambiar sin rehacer las reglas.

## Orden de trabajo para cada etapa

Escribir una página con la regla jugable y la tabla de datos públicos y privados. Implementar un circuito mínimo. Probar invariantes y ataques obvios. Conectar un cliente rudimentario. Jugar cinco partidas completas y anotar fricciones de latencia, pruebas y comprensión. Solo entonces añadir una mecánica nueva.

**Primer sprint concreto:** instalar el entorno siguiendo la guía oficial, crear el contrato de la Etapa 1, escribir casos de golpe, bloqueo, hechizo y acción inválida, y mostrar el resultado en una CLI. El éxito no es tener arte bonito: es que exista una decisión secreta cuya consecuencia pública sea correcta.

## Preguntas de diseño para revisar al avanzar

- ¿El secreto sigue oculto después de la transacción o solo hasta resolver el turno?
- ¿Quién genera la información secreta del enemigo y quién puede verla?
- ¿Qué pasa si falta una revelación, se pierde el dispositivo o alguien intenta repetir una prueba?
- ¿Cuánto tarda y cuesta el ciclo de juego real? ¿Qué vale la pena anclar en cadena?
- ¿Qué cambios del mundo deben ser permanentes, reversibles o protegidos por tiempo?

## Referencias oficiales

- [Documentación de Midnight](https://docs.midnight.network/)
- [Lenguaje Compact](https://docs.midnight.network/compact)
- [Guías de desarrollo](https://docs.midnight.network/category/guides)
- [Uso de contratos Compact desde JavaScript](https://docs.midnight.network/guides/use-compact-contracts-from-javascript)
- [Desplegar y operar un contrato](https://docs.midnight.network/guides/deploy-and-operate)
- [API de Midnight.js](https://docs.midnight.network/api-reference/midnight-js)

Las etapas son una propuesta de arquitectura de juego, no una promesa de que cada mecánica ya exista como componente listo para usar en Midnight. En cada hito validaremos los límites concretos del SDK y del entorno vigente.
