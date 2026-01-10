# Setup Guide - On-Chain Game Engine

Guía paso a paso para configurar y ejecutar el motor de juego on-chain.

## 📋 Prerrequisitos

### 1. Instalar Node.js
```bash
# Requiere Node.js 20+
node --version  # Debe mostrar v20.x.x o superior
```

### 2. Instalar Aiken
```bash
# Instalar Aiken CLI
curl -sSfL https://install.aiken-lang.org | bash

# Verificar instalación
aiken --version  # Debe mostrar v1.1.21 o superior

# Agregar a PATH si es necesario
export PATH="$HOME/.aiken/bin:$PATH"
```

### 3. Obtener API Key de Blockfrost
1. Ir a [Blockfrost.io](https://blockfrost.io/)
2. Crear cuenta gratuita
3. Crear proyecto para **Preview Testnet**
4. Copiar API key

### 4. Obtener tADA (Test ADA)
1. Ir a [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)
2. Pegar tu dirección de wallet (generada en paso 6)
3. Recibir ~1000 tADA gratis

## 🚀 Instalación

### Paso 1: Clonar e Instalar Dependencias
```bash
git clone https://github.com/MDTrapaglia/Onchain_game.git
cd Onchain_game

# Instalar dependencias npm
npm install

# Instalar dependencias de Aiken (automático al compilar)
```

### Paso 2: Iniciar Base de Datos
```bash
# Iniciar PostgreSQL con Docker
docker-compose up -d

# Verificar que está corriendo
docker ps | grep onchain_game_db
```

### Paso 3: Generar Wallet y Keys
```bash
# Generar wallet de Cardano + keypair Ed25519
npm run lucid:generate-wallet
```

Este comando mostrará:
- **Seed phrase** (24 palabras) - para wallet de Cardano
- **Ed25519 Public Key** - para validación de firmas
- **Ed25519 Private Key** - para firma de stats (SECRETO)

**⚠️ IMPORTANTE:** Guarda estos valores de forma segura, los necesitarás en el siguiente paso.

### Paso 4: Configurar Variables de Entorno
```bash
# Copiar plantilla
cp .env.example .env

# Editar .env con tus valores
nano .env
```

Completar con los valores generados:
```env
# Database (dejar por defecto si usas Docker)
DATABASE_URL="postgresql://game_user:game_pass@localhost:5432/onchain_game?schema=public"

# Cardano Network
CARDANO_NETWORK="preview"
BLOCKFROST_API_KEY="preview_tu_api_key_aqui"

# API Server
PORT=3001
ACCESS_TOKEN="cambia_esto_por_un_token_seguro_aleatorio"
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Wallet (del paso 3)
WALLET_SEED_PHRASE="tu seed phrase de 24 palabras aqui"

# Ed25519 Keys (del paso 3)
GAME_PUBLIC_KEY="tu_public_key_hex_64_chars"
GAME_PRIVATE_KEY="tu_private_key_hex_128_chars"

# Auto-submit
AUTO_SUBMIT_ENABLED="false"
```

### Paso 5: Configurar Base de Datos
```bash
# Generar Prisma client
npm run db:generate

# Aplicar schema a la base de datos
npm run db:push

# Verificar que funcionó
npm run db:studio
# Abre GUI en http://localhost:5555
```

### Paso 6: Obtener Dirección de Wallet y Fondear
```bash
# Ver tu dirección de wallet
npm run wallet:balance
```

Copia la dirección (`addr1...`) y:
1. Ir al [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)
2. Pegar tu dirección
3. Solicitar fondos (~1000 tADA)
4. Esperar 1-2 minutos

Verificar fondos:
```bash
npm run wallet:balance
# Debe mostrar > 1000 ADA
```

### Paso 7: Setup Collateral
```bash
# Crear UTxO de colateral para transacciones Plutus
npm run setup:collateral

# Verificar
npm run wallet:balance
# Debe mostrar un UTxO de 5 ADA separado
```

### Paso 8: Compilar Smart Contracts
```bash
cd onchain/game-engine

# Compilar contratos Aiken
aiken build

# Verificar que se creó plutus.json
ls -la plutus.json

# Ejecutar tests
aiken check
```

Si todo está bien, verás:
```
✅ Summary
    7 tests | 7 passed | 0 failed
```

Volver al directorio raíz:
```bash
cd ../..
```

### Paso 9: Iniciar Servidor API
```bash
# Desarrollo (con hot reload)
npm run dev
```

Deberías ver:
```
🌐 Game API server running on http://0.0.0.0:3001
🎮 On-chain game engine ready
✅ Database connected
✅ Ed25519 signing service available
   Public key: abc123...
```

## ✅ Verificación

### Test 1: API Server
```bash
# En otra terminal
curl http://localhost:3001/api/statistics?token=tu_access_token
```

Debe retornar JSON con estadísticas.

### Test 2: Demo Completo
```bash
# Ejecutar demo del flujo completo
npm run demo:full-flow
```

Esto ejecuta:
1. Registro de jugador
2. Inicio de sesión
3. Simulación de gameplay
4. Finalización con firma
5. Estadísticas

## 🎮 Uso Básico

### Registrar Jugador
```bash
curl -X POST http://localhost:3001/api/players/register?token=TU_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "addr1...",
    "nft_policy_id": "policy_id_hex",
    "nft_asset_name": "asset_name_hex"
  }'
```

### Iniciar Sesión de Juego
```bash
curl -X POST http://localhost:3001/api/sessions/start?token=TU_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "addr1...",
    "nft_policy_id": "policy_id_hex",
    "nft_asset_name": "asset_name_hex"
  }'
```

### Finalizar Sesión
```bash
curl -X POST http://localhost:3001/api/sessions/SESSION_ID/finalize?token=TU_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "final_stats": {
      "hp": 95,
      "exp": 150,
      "agility": 12,
      "strength": 15,
      "intelligence": 10,
      "speed": 11
    }
  }'
```

## 🔧 Troubleshooting

### Error: "Database connection failed"
```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Si no está corriendo
docker-compose up -d

# Ver logs
docker logs onchain_game_db
```

### Error: "BLOCKFROST_API_KEY not set"
```bash
# Verificar .env
cat .env | grep BLOCKFROST

# Debe mostrar tu API key
```

### Error: "No UTxOs available"
```bash
# Verificar balance
npm run wallet:balance

# Si está vacío, fondear desde faucet
```

### Error: "Signing service not available"
```bash
# Verificar que GAME_PRIVATE_KEY y GAME_PUBLIC_KEY están en .env
cat .env | grep GAME_

# Regenerar si es necesario
npm run lucid:generate-wallet
```

### Aiken build falla
```bash
# Limpiar y reconstruir
cd onchain/game-engine
rm -rf build/
aiken build

# Si persiste, verificar versión
aiken --version  # Debe ser v1.1.21+
```

## 📚 Próximos Pasos

1. **Mintear Identity NFT**: `npm run game:mint-nft`
2. **Crear jugador**: `npm run game:create-player`
3. **Explorar API**: Ver `README.md` para endpoints completos
4. **Integrar Frontend**: Conectar con wallet (eternl, nami, etc.)

## 🆘 Soporte

- Issues: https://github.com/MDTrapaglia/Onchain_game/issues
- Documentación: Ver `README.md`
- Logs del servidor: Revisar consola donde corre `npm run dev`
- Database GUI: `npm run db:studio` → http://localhost:5555

## 📝 Checklist

- [ ] Node.js 20+ instalado
- [ ] Aiken v1.1.21+ instalado
- [ ] Blockfrost API key obtenida
- [ ] Dependencias npm instaladas
- [ ] PostgreSQL corriendo (Docker)
- [ ] Wallet generada y fondeada
- [ ] .env configurado correctamente
- [ ] Database schema aplicado
- [ ] Collateral UTxO creado
- [ ] Contratos Aiken compilados
- [ ] API server corriendo
- [ ] Demo ejecutado exitosamente

Una vez completado este checklist, estás listo para usar el motor de juego on-chain! 🎉
