# On-Chain Game Engine

Motor de juego RPG completamente on-chain sobre Cardano, desarrollado con Aiken smart contracts.

## 🎯 Características

- **Stats 100% On-Chain**: HP, EXP, Agility, Strength, Intelligence, Speed totalmente inmutables
- **Soberanía del Usuario**: El jugador mantiene custodia de su NFT en su wallet
- **Validación Criptográfica**: Sistema de firmas Ed25519 para garantizar integridad
- **Mecánicas de Linaje**: Validación de transiciones de estado (incrementos legales)
- **Identity NFT**: Token único que representa al jugador
- **Three-Action System**: Play, Update, Finalize redeemers

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    PLAYER WALLET                        │
│               (Soberanía del Usuario)                   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Lock NFT
                         ▼
┌─────────────────────────────────────────────────────────┐
│               GAME SMART CONTRACT (Aiken)               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PlayerDatum:                                     │  │
│  │   - stats (HP, EXP, AGI, STR, INT, SPD)          │  │
│  │   - signature (Ed25519)                           │  │
│  │   - player_address                                │  │
│  │   - session_id                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Redeemers:                                             │
│   1. Play      → Validar firma inicial                 │
│   2. Update    → Validar transición de stats           │
│   3. Finalize  → Validar firma final + incremento      │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND API SERVER                     │
│               (Express + TypeScript)                    │
│                                                          │
│  - Gestión de sesiones de juego                        │
│  - Firma de stats finales (Ed25519)                    │
│  - Monitoreo de transacciones                          │
│  - Base de datos PostgreSQL                            │
└─────────────────────────────────────────────────────────┘
```

## 📦 Stack Tecnológico

### On-Chain
- **Aiken v1.1.21**: Smart contracts (Plutus V3)
- **Cardano**: Blockchain layer

### Off-Chain
- **TypeScript 5.9+**: Lenguaje principal
- **Lucid Evolution 0.4+**: Transaction building
- **Express 5**: API REST server
- **Prisma 5**: ORM para PostgreSQL
- **TweetNaCl**: Operaciones Ed25519
- **Blockfrost**: Cardano API provider

## 🚀 Quick Start

### 1. Requisitos Previos

```bash
# Instalar Aiken
curl -sSfL https://install.aiken-lang.org | bash

# Verificar instalación
aiken --version  # v1.1.21 o superior

# Node.js 20+
node --version
```

### 2. Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd Onchain_game

# Instalar dependencias
npm install

# Iniciar base de datos
docker-compose up -d

# Configurar Prisma
npm run db:generate
npm run db:push
```

### 3. Configuración

```bash
# Copiar plantilla de variables de entorno
cp .env.example .env

# Generar wallet y keys
npm run lucid:generate-wallet

# Editar .env con las keys generadas
nano .env
```

Variables requeridas en `.env`:
```env
DATABASE_URL="postgresql://game_user:game_pass@localhost:5432/onchain_game"
CARDANO_NETWORK="preview"
BLOCKFROST_API_KEY="your_blockfrost_key"
WALLET_SEED_PHRASE="your 24 word seed phrase"
GAME_PRIVATE_KEY="your_ed25519_private_key"
GAME_PUBLIC_KEY="your_ed25519_public_key"
ACCESS_TOKEN="your_api_access_token"
```

### 4. Compilar Smart Contracts

```bash
# Compilar validadores Aiken
cd onchain/game-engine
aiken build

# Verificar tests
aiken check

# El plutus.json se genera en onchain/game-engine/
```

### 5. Setup Inicial

```bash
# Asegurar collateral para Plutus transactions
npm run setup:collateral

# Verificar balance
npm run wallet:balance
```

### 6. Iniciar Servidor

```bash
# Desarrollo (hot reload)
npm run dev

# Producción
npm run build:backend
node dist/backend/api_server.js
```

## 📡 API Endpoints

Base URL: `http://localhost:3001/api`

Todos los endpoints requieren autenticación via token:
- Query parameter: `?token=YOUR_ACCESS_TOKEN`
- Header: `x-access-token: YOUR_ACCESS_TOKEN`

### Players

#### `POST /api/players/register`
Registrar nuevo jugador con Identity NFT

```json
{
  "wallet_address": "addr1...",
  "nft_policy_id": "policy_id_hex",
  "nft_asset_name": "asset_name_hex",
  "nft_tx_hash": "tx_hash",
  "stake_address": "stake1...",
  "script_address": "addr1..."
}
```

#### `GET /api/players/:wallet_address`
Obtener información de jugador

### Sessions

#### `POST /api/sessions/start`
Iniciar nueva sesión de juego

```json
{
  "wallet_address": "addr1...",
  "nft_policy_id": "policy_id_hex",
  "nft_asset_name": "asset_name_hex"
}
```

#### `POST /api/sessions/:session_id/finalize`
Finalizar sesión y firmar stats finales

```json
{
  "final_stats": {
    "hp": 95,
    "exp": 150,
    "agility": 12,
    "strength": 15,
    "intelligence": 10,
    "speed": 11
  }
}
```

#### `GET /api/sessions/:session_id`
Obtener detalles de sesión

#### `GET /api/sessions/player/:player_id`
Obtener sesiones de un jugador

### Transactions

#### `GET /api/transactions`
Listar transacciones blockchain

Query params: `page`, `limit`

### Utilities

#### `POST /api/sign`
Firmar stats con Ed25519 (testing)

```json
{
  "stats": { ... },
  "player_address": "hex_string",
  "session_id": 0
}
```

#### `GET /api/statistics`
Obtener estadísticas agregadas

## 🎮 Flujo de Juego

### 1. Minteo de Identity NFT
```bash
npm run game:mint-nft
```

El jugador mintea su Identity NFT único usando la one-shot minting policy.

### 2. Registro de Jugador
```bash
curl -X POST http://localhost:3001/api/players/register?token=... \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "addr1...",
    "nft_policy_id": "...",
    "nft_asset_name": "..."
  }'
```

### 3. Inicio de Sesión (Play Redeemer)
```bash
# Backend firma los stats iniciales
curl -X POST http://localhost:3001/api/sessions/start?token=... \
  -H "Content-Type: application/json" \
  -d '{ "wallet_address": "addr1...", ... }'

# Jugador lock NFT en script con datum firmado
npm run game:start-session
```

### 4. Gameplay (Update Redeemer)
Durante el juego, los stats se actualizan validando transiciones:
- HP puede subir/bajar (±1000 por update)
- EXP solo sube (máx +10,000 por update)
- Atributos solo suben (máx +100 cada uno)

```bash
npm run game:update-stats
```

### 5. Finalización (Finalize Redeemer)
```bash
# Backend firma stats finales
curl -X POST http://localhost:3001/api/sessions/SESSION_ID/finalize?token=... \
  -H "Content-Type: application/json" \
  -d '{ "final_stats": { ... } }'

# Jugador puede:
# A) Retirar NFT a su wallet (withdraw_to_wallet: true)
# B) Continuar jugando (incrementa session_id)
npm run game:finalize
```

## 🔐 Seguridad

### Validaciones On-Chain

El validador `game.ak` garantiza:

1. **Rangos de Stats**:
   - HP: 1-10,000
   - EXP: 0-1,000,000
   - AGI/STR/INT/SPD: 1-1,000

2. **Transiciones Legales** (Update):
   - HP: delta ∈ [-1000, +1000]
   - EXP: solo incrementa, max +10,000
   - Atributos: solo incrementan, max +100 cada uno

3. **Firma Ed25519**:
   - Message = agility || exp || hp || intelligence || session_id || speed || strength || player_address
   - Se firma SHA-256(message)
   - Validado contra game_public_key

4. **Identity NFT**:
   - Debe estar presente en input
   - Debe estar presente en output
   - Solo 1 token (quantity = 1)

### Validaciones Off-Chain

El backend valida:
- Tokens de autenticación
- Rate limiting (100 req/15min)
- Payload size limits (10kb)
- Formato de datos

## 🧪 Testing

```bash
# Tests de validadores Aiken
cd onchain/game-engine
aiken check

# Tests de backend (TODO)
npm test

# Lint
npm run lint:backend
npm run lint:fix
```

## 📊 Base de Datos

Schema Prisma con 4 modelos principales:

- **Player**: Jugadores registrados
- **GameSession**: Sesiones de juego
- **GameTransaction**: Transacciones blockchain
- **PlayerStatsHistory**: Historial de stats (analytics)

```bash
# Prisma Studio (GUI)
npm run db:studio

# Migrations
npm run db:migrate
```

## 🛠️ Scripts Disponibles

### Desarrollo
- `npm run dev` - Servidor con hot reload
- `npm run build:backend` - Compilar TypeScript
- `npm run lint:backend` - ESLint
- `npm run lint:fix` - Auto-fix linting

### Base de Datos
- `npm run db:generate` - Generar Prisma client
- `npm run db:push` - Push schema
- `npm run db:migrate` - Crear migration
- `npm run db:studio` - Prisma Studio GUI

### Wallet
- `npm run lucid:generate-wallet` - Generar wallet + Ed25519 keys
- `npm run wallet:balance` - Ver balance

### Smart Contracts
- `npm run test:validator` - Tests Aiken
- `npm run build:validator` - Compilar Aiken

### Transacciones
- `npm run game:mint-nft` - Mintear Identity NFT
- `npm run game:start-session` - Iniciar sesión
- `npm run game:update-stats` - Actualizar stats
- `npm run game:finalize` - Finalizar sesión

## 📝 Estructura del Proyecto

```
Onchain_game/
├── onchain/                    # Smart contracts Aiken
│   └── game-engine/
│       ├── validators/
│       │   ├── game.ak        # Validador principal
│       │   └── nft.ak         # Minting policy
│       ├── aiken.toml
│       └── plutus.json        # Compilado
│
├── offchain/                   # Backend TypeScript
│   ├── backend/
│   │   ├── api_server.ts      # Express API
│   │   ├── config/            # Configuración
│   │   ├── services/          # Lógica de negocio
│   │   ├── types/             # Tipos TypeScript
│   │   └── utils/             # Utilidades
│   │
│   └── transactions/          # Lucid builders
│       ├── game_lucid_lib.ts
│       ├── types.ts
│       └── utils/
│
├── prisma/
│   └── schema.prisma          # DB schema
│
├── scripts/                    # Utilidades
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── .env.example
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Apache-2.0

## 🔗 Links

- [Aiken Documentation](https://aiken-lang.org/)
- [Lucid Evolution](https://github.com/Anastasia-Labs/lucid-evolution)
- [Cardano Developer Portal](https://developers.cardano.org/)

## ⚠️ Disclaimer

Este proyecto es experimental y educativo. No usar en producción sin auditoría completa de seguridad.
