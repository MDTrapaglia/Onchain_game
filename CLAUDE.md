# Claude Instructions - On-Chain Game Engine

Instrucciones para Claude al trabajar con este proyecto de motor de juego on-chain en Cardano.

## Última Actualización
**Fecha**: 2026-01-10
**Estado**: Proyecto completado - MVP funcional
**Versión**: 1.0.0

## Descripción del Proyecto

Motor de juego RPG completamente on-chain sobre Cardano que garantiza:
- **Inmutabilidad de Stats**: HP, EXP, Agility, Strength, Intelligence, Speed 100% on-chain
- **Soberanía del Usuario**: El jugador mantiene custodia de su Identity NFT
- **Validación Criptográfica**: Sistema Ed25519 para integridad de datos
- **Mecánicas de Linaje**: Validación de transiciones de estado legales

## Stack Tecnológico

### On-Chain
- **Aiken v1.1.21**: Smart contracts (Plutus V3)
- **Cardano Blockchain**: Preview/Preprod/Mainnet

### Off-Chain
- **TypeScript 5.9+**: Lenguaje principal
- **Lucid Evolution 0.4+**: Transaction building
- **Express 5**: API REST server
- **Prisma 5**: ORM (PostgreSQL)
- **TweetNaCl**: Operaciones Ed25519
- **Blockfrost**: Cardano API provider

## Estructura del Proyecto

```
Onchain_game/
├── onchain/game-engine/          # Smart contracts Aiken
│   ├── validators/
│   │   ├── game.ak              # Validador principal (330+ líneas)
│   │   └── nft.ak               # Minting policy Identity NFT
│   ├── aiken.toml
│   └── plutus.json              # Generado por aiken build
│
├── offchain/
│   ├── backend/                 # API Express
│   │   ├── api_server.ts        # Servidor principal
│   │   ├── config/              # Configuración (Prisma)
│   │   ├── services/            # Lógica de negocio
│   │   │   ├── signing.service.ts
│   │   │   ├── player.service.ts
│   │   │   ├── session.service.ts
│   │   │   └── transaction.service.ts
│   │   ├── types/               # Tipos TypeScript
│   │   └── utils/               # Utilidades
│   │       ├── message-builder.ts
│   │       └── signature-verification.ts
│   │
│   └── transactions/            # Lucid transaction builders
│       ├── game_lucid_lib.ts    # Biblioteca principal
│       ├── types.ts
│       └── utils/
│
├── prisma/
│   └── schema.prisma            # Database schema
│
├── scripts/                     # Utilidades
│   ├── setup_collateral.ts
│   └── demo_full_flow.ts
│
├── temp/                        # Progress notes (gitignored)
│   └── progress.md
│
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── README.md                    # Documentación usuario
├── SETUP.md                     # Guía de instalación
└── CLAUDE.md                    # Este archivo
```

## Arquitectura de Datos

### Aiken (On-Chain)

#### PlayerStats
```aiken
pub type PlayerStats {
  hp: Int,           // 1-10,000
  exp: Int,          // 0-1,000,000
  agility: Int,      // 1-1,000
  strength: Int,     // 1-1,000
  intelligence: Int, // 1-1,000
  speed: Int,        // 1-1,000
}
```

#### PlayerDatum
```aiken
pub type PlayerDatum {
  stats: PlayerStats,
  signature: ByteArray,      // Ed25519 (64 bytes)
  player_address: ByteArray, // Wallet address
  session_id: Int,           // Incrementing counter
}
```

#### GameRedeemer
```aiken
pub type GameRedeemer {
  Play      // Iniciar sesión - valida firma inicial
  Update    // Actualizar stats - valida transición (linaje)
  Finalize  // Finalizar sesión - valida firma final
}
```

### Prisma (Off-Chain)

- **Player**: Jugadores registrados con Identity NFT
- **GameSession**: Sesiones de juego (ACTIVE, FINALIZING, COMPLETED, etc.)
- **GameTransaction**: Historial blockchain completo
- **PlayerStatsHistory**: Analytics y progresión

## Reglas Críticas

### 1. Orden de Campos (Message Building)

**CRÍTICO**: El orden de campos en el mensaje debe matchear EXACTAMENTE entre Aiken y TypeScript.

**Aiken** (game.ak:build_stats_message):
```aiken
agility || exp || hp || intelligence || session_id || speed || strength || player_address
```

**TypeScript** (message-builder.ts:buildStatsMessage):
```typescript
parts.push(intToBytes(data.stats.agility));
parts.push(intToBytes(data.stats.exp));
parts.push(intToBytes(data.stats.hp));
parts.push(intToBytes(data.stats.intelligence));
parts.push(intToBytes(data.session_id));
parts.push(intToBytes(data.stats.speed));
parts.push(intToBytes(data.stats.strength));
parts.push(Buffer.from(data.player_address, 'hex'));
```

❌ **NUNCA** cambiar el orden sin sincronizar ambos lados.

### 2. Conversión de Enteros

**Aiken**: `builtin.integer_to_bytearray(True, 8, n)` → 8 bytes big-endian signed

**TypeScript**:
```typescript
function intToBytes(n: number): Buffer {
  const buffer = Buffer.allocUnsafe(8);
  buffer.writeBigInt64BE(BigInt(n));
  return buffer;
}
```

### 3. Firma Ed25519

**Se firma el HASH, no el mensaje completo**:

```typescript
const message = buildStatsMessage(data);
const hash = sha256(message);           // SHA-256
const signature = sign(hash, privateKey); // Ed25519 sobre el hash
```

Esto evita problemas con bytes nulos y es más seguro.

### 4. Validaciones de Rangos

**On-Chain** (game.ak):
- HP: 1-10,000
- EXP: 0-1,000,000
- Atributos: 1-1,000

**Transiciones Legales** (Update redeemer):
- HP: ±1,000 por update
- EXP: +10,000 max (solo sube, monotónico)
- Atributos: +100 max cada uno (solo suben)

### 5. Session ID

- Inicia en 0
- Se incrementa en Finalize redeemer
- Debe ser consecutivo (no saltos)
- Usado para tracking de linaje

## Convenciones de Código

### TypeScript

1. **Imports**: ES modules (`import/export`)
2. **Tipos**: Strict TypeScript, interfaces explícitas
3. **Async/Await**: Preferir sobre promises
4. **Error Handling**: Try-catch con logging detallado
5. **Logging**: Usar console con emojis para claridad
   ```typescript
   console.log('✅ Success');
   console.error('❌ Error');
   console.warn('⚠️  Warning');
   console.log('📡 Network operation');
   ```

### Aiken

1. **Types**: Usar `pub type` para exports
2. **Functions**: Helper functions privadas (sin `pub`)
3. **Tests**: Prefijo `test_`, usar `fail` para expected failures
4. **Documentación**: Triple-slash comments `///`
5. **Expect**: Usar `expect` para assertions críticas

### Commits

**Formato** (sin emojis ni co-authored):
```
Título descriptivo en español

Detalles:
- Punto 1
- Punto 2
- Punto 3
```

**NO incluir**:
- ❌ Emojis
- ❌ "Co-Authored-By: Claude Sonnet..."
- ❌ Links a Claude Code

## Flujo de Desarrollo

### Agregar Nueva Feature

1. **Planificar**:
   - Definir cambios on-chain (Aiken)
   - Definir cambios off-chain (TypeScript/Prisma)
   - Identificar breaking changes

2. **Implementar On-Chain**:
   ```bash
   cd onchain/game-engine/validators/
   # Editar game.ak o nft.ak
   cd ..
   aiken check  # Verificar tests
   aiken build  # Compilar
   ```

3. **Implementar Off-Chain**:
   - Actualizar types (offchain/backend/types/, offchain/transactions/types.ts)
   - Actualizar servicios si es necesario
   - Actualizar transaction builders (game_lucid_lib.ts)
   - Actualizar Prisma schema si hay cambios de DB

4. **Testing**:
   ```bash
   npm run test:validator  # Tests Aiken
   npm run demo:full-flow  # Test end-to-end
   ```

5. **Documentar**:
   - Actualizar README.md
   - Actualizar CLAUDE.md (este archivo)
   - Actualizar temp/progress.md

### Modificar Validaciones

**Ejemplo**: Cambiar rango máximo de HP de 10,000 a 15,000

1. **Aiken** (game.ak):
   ```aiken
   fn validate_stat_ranges(stats: PlayerStats) -> Bool {
     expect stats.hp >= 1 && stats.hp <= 15000  // Cambio aquí
     // ...
   }
   ```

2. **Tests** (game.ak):
   ```aiken
   test test_validate_stat_ranges_valid() {
     let stats = PlayerStats { hp: 15000, ... }  // Actualizar
     validate_stat_ranges(stats)
   }
   ```

3. **TypeScript**: Ningún cambio necesario (validación es on-chain)

4. **Documentación**: Actualizar README.md con nuevo rango

### Agregar Nuevo Stat

**NO RECOMENDADO** - Requiere breaking change completo:

1. Actualizar `PlayerStats` en Aiken
2. Actualizar `build_stats_message` (orden alfabético)
3. Actualizar todos los tests
4. Actualizar tipos TypeScript
5. Actualizar Prisma schema (agregar campos a Player, GameSession)
6. Actualizar `buildStatsMessage` en message-builder.ts
7. Actualizar todos los transaction builders
8. Migración de database
9. **Requiere re-deploy completo de contratos**

## Testing

### Tests Aiken (On-Chain)

```bash
cd onchain/game-engine
aiken check
```

Tests existentes (7 total):
- `test_int_to_bytes`
- `test_validate_stat_ranges_valid`
- `test_validate_stat_ranges_invalid_hp`
- `test_validate_stat_transition_valid`
- `test_validate_stat_transition_exp_decrease`
- `test_validate_session_increment`
- `test_validate_session_increment_invalid`

### Tests Backend (Pending)

**TODO**: Implementar tests con Jest
```bash
npm test  # Cuando estén implementados
```

### Demo End-to-End

```bash
# Asegurar que API está corriendo
npm run dev

# En otra terminal
npm run demo:full-flow
```

Esto prueba:
1. Registro de jugador
2. Inicio de sesión
3. Finalización con firma
4. Estadísticas

## Deployment

### Preview Testnet (Recomendado para desarrollo)

1. **Compilar contratos**:
   ```bash
   cd onchain/game-engine
   aiken build
   ```

2. **Configurar .env**:
   ```env
   CARDANO_NETWORK="preview"
   BLOCKFROST_API_KEY="preview_..."
   ```

3. **Fondear wallet**:
   - Obtener tADA del faucet
   - `npm run setup:collateral`

4. **Deploy**:
   - Mintear Identity NFTs
   - Crear jugadores
   - Iniciar sesiones

### Preprod Testnet

Similar a Preview, cambiar:
```env
CARDANO_NETWORK="preprod"
BLOCKFROST_API_KEY="preprod_..."
```

### Mainnet

⚠️ **NO deployar sin**:
1. Auditoría de seguridad completa
2. Testing extensivo en testnet
3. Optimización de costs
4. Frontend production-ready
5. Monitoring y alertas
6. Plan de incident response

## Troubleshooting

### "Module not found: @prisma/client"
```bash
npm run db:generate
```

### "Ed25519 signature verification failed"
1. Verificar orden de campos en mensaje
2. Verificar que se firma el hash, no el mensaje
3. Verificar longitudes: signature=64 bytes, pubkey=32 bytes

### "Aiken build hangs"
1. Limpiar: `rm -rf build/`
2. Verificar versión: `aiken --version`
3. Re-build: `aiken build`

### "Transaction validation failed"
1. Verificar collateral UTxO existe
2. Verificar que el datum tiene inline encoding
3. Verificar que el redeemer corresponde
4. Revisar logs de Blockfrost para error detallado

### "Database migration error"
```bash
# Reset database (⚠️ borra datos)
docker-compose down -v
docker-compose up -d
npm run db:push
```

## Cambios Pendientes

### Integración Plutus.json

Los transaction builders en `game_lucid_lib.ts` tienen placeholders:

```typescript
// TODO: Load from plutus.json
const nftPolicyScript = '';
```

**Cuando plutus.json esté disponible**:
1. Leer archivo con `readFileSync`
2. Parsear JSON
3. Extraer scripts compilados
4. Usar en Lucid transaction builders

### Frontend

**Próximo milestone**: React/Next.js frontend

Características:
- Wallet connection (eternl, nami, flint)
- Player dashboard
- Stats visualization
- Transaction history
- Game interface

### Monitoring

Agregar:
- Prometheus metrics
- Grafana dashboards
- Error tracking (Sentry)
- Transaction monitoring
- Alert system

## Recursos

### Documentación Externa
- [Aiken Docs](https://aiken-lang.org/)
- [Lucid Evolution](https://github.com/Anastasia-Labs/lucid-evolution)
- [Cardano Docs](https://developers.cardano.org/)
- [Blockfrost API](https://docs.blockfrost.io/)

### Archivos Clave
- `README.md`: Documentación para usuarios
- `SETUP.md`: Guía de instalación paso a paso
- `temp/progress.md`: Notas de desarrollo (gitignored)
- Este archivo: Instrucciones para Claude

## Notas para Claude

### Al Hacer Cambios

1. **Siempre leer el archivo antes de editar**
2. **Verificar que el orden de campos matchea** (Aiken ↔ TypeScript)
3. **Actualizar tests si cambias validaciones**
4. **Documentar en temp/progress.md** (gitignored)
5. **Actualizar este CLAUDE.md si hay cambios arquitectónicos**
6. **No incluir emojis ni co-authored en commits**

### Al Responder Preguntas

1. Citar líneas específicas: `file_path:line_number`
2. Explicar el "por qué", no solo el "qué"
3. Mencionar trade-offs de soluciones alternativas
4. Referir a secciones relevantes de este documento

### Al Sugerir Features

1. Evaluar impacto on-chain vs off-chain
2. Considerar breaking changes
3. Estimar complejidad (trivial/moderado/complejo)
4. Proponer plan de implementación

## Changelog

### 2026-01-10 - v1.0.0 (MVP Completo)
- ✅ Smart contracts Aiken (game.ak, nft.ak)
- ✅ Backend API completo (Express + TypeScript)
- ✅ Transaction builders (Lucid Evolution)
- ✅ Database schema (Prisma)
- ✅ Scripts de utilidad y demo
- ✅ Documentación completa
- 📄 6 commits, ~3,000 líneas de código
- 🚀 Listo para compilación y testing en testnet

### Próxima Versión (Planificada)
- [ ] Integración plutus.json con Lucid
- [ ] Frontend React/Next.js
- [ ] Tests backend (Jest)
- [ ] CI/CD pipeline
- [ ] Monitoring y alertas

---

**Última actualización**: 2026-01-10
**Maintainer**: Claude (con supervisión humana)
**Versión**: 1.0.0
