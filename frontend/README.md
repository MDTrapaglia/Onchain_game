# OnChain Game - Frontend

Frontend moderno y responsivo para el motor de juego on-chain en Cardano.

## 🎨 Características

- **Next.js 15** con App Router y TypeScript
- **Tailwind CSS** con tema oscuro y gradientes modernos
- **Lucid Evolution** para interacción con Cardano
- **Conexión de Wallets** - Soporta Eternl, Nami, Flint, Lace
- **Dashboard de Jugador** con stats visuales animadas
- **UI Moderna** con componentes reutilizables

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Iniciar el Backend

Primero asegúrate de que el backend API esté corriendo:

```bash
# En el directorio raíz del proyecto
npm run dev
```

El backend debe estar corriendo en `http://localhost:3001`

### 3. Iniciar el Frontend

```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 📱 Cómo Usar

### 1. Conectar Wallet

1. Abre `http://localhost:3000` en tu navegador
2. Haz clic en uno de los wallets (Eternl, Nami, Flint, Lace)
3. Autoriza la conexión en la extensión de tu wallet
4. **Importante**: Asegúrate de que tu wallet esté conectada a **Preprod testnet**

### 2. Ver Dashboard

Una vez conectado, verás:
- **Stats del Jugador**: HP, EXP, Agility, Strength, Intelligence, Speed
- **Información de Sesión**: Número de sesión actual
- **Controles**: Botones para iniciar/finalizar sesiones

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Blockchain**: Lucid Evolution (Cardano)
- **HTTP Client**: Axios

## 🔧 Configuración de Wallet

### Preprod Testnet

**IMPORTANTE**: Tu wallet debe estar en Preprod testnet.

#### Eternl/Nami/Flint/Lace
Settings → Network → Preprod

### Obtener tADA

Si no tienes tADA en Preprod:
1. Ve al [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)
2. Pega tu dirección de Preprod
3. Solicita fondos (~1000 tADA gratis)

## 🎨 Capturas

### Hero Section
- Título con gradiente animado
- Features cards
- Selector de wallets

### Dashboard
- Stats con barras de progreso coloridas
- Sesión activa/inactiva
- Botones de acción

## 📦 Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Build para producción
npm start        # Iniciar producción
npm run lint     # Linting
```

---

**Desarrollado con ♥ usando Next.js, Tailwind CSS y Lucid Evolution**
