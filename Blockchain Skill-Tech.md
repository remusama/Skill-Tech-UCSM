
# Arquitectura Blockchain: Token Educativo en Solana — Skill-Tech UCSM

Documento técnico y estratégico para el piloto de tokenomía del **Programa de Liderazgo (UCSM)**, basado en la guía técnica del Laboratorio de Tokenomía y los estándares oficiales de **Solana Token Extensions (Token-2022)** ([solana.com/docs/tokens/extensions](https://solana.com/docs/tokens/extensions)).

---

## 1. Visión y Alcance del Piloto

- **Población Objetivo:** 40 a 45 estudiantes distribuidos en 4 Casas de Liderazgo.
- **Enfoque Inicial (Fase 1):**
  - Creación y asignación de **billeteras transparentes** para los estudiantes.
  - Implementación del **Token de Puntos** (y Fondo de Casa) en Solana mediante Token-2022.
  - **Accesorios y NFTs:** Pospuestos para una fase posterior según la estrategia acordada.
- **Regla Fundamental de Experiencia de Usuario (Cero Fricción Web3):**
  - El estudiante nunca ve términos técnicos cripto:
    - *Billetera* $\rightarrow$ **"Mi cuenta"**
    - *Token* $\rightarrow$ **"Moyoles"**
    - *Mint* $\rightarrow$ **"Ganar Moyoles"**
    - *Burn* $\rightarrow$ **"Canjear"**
    - *Gas / Fee* $\rightarrow$ **Invisible (0 SOL para el alumno, costeado por el backend)**.

---

## 2. Token-2022 y Solana Token Extensions

Para este piloto **no se utilizan contratos inteligentes personalizados (Anchor/Rust)**. Todo se construye sobre el programa estándar de Solana:
- **Program ID:** `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (*Token-2022*)

### Extensiones Utilizadas

| Extensión | Función Técnica en Solana | Propósito en Skill-Tech |
| :--- | :--- | :--- |
| **`NonTransferable`** | Bloquea a nivel de protocolo cualquier instrucción `Transfer` o `TransferChecked` entre billeteras. | Convierte los puntos en **Soulbound**. Ningún estudiante puede transferir ni comercializar sus puntos con terceros. |
| **`PermanentDelegate`** | Concede a una clave del backend la autoridad global e irrevocable de transferir o **quemar (`burn`)** tokens desde la cuenta de cualquier usuario. | Permite al sistema canjear puntos automáticamente en el backend sin requerir que el alumno firme con llaves privadas o extensiones como Phantom. |
| **`MetadataPointer`** + **`TokenMetadata`** | Guarda el nombre (*"Puntos Liderazgo UCSM"*), símbolo (*"PUNTOS"*), decimales y URI dentro de la propia cuenta de la Mint. | Almacena los metadatos de forma nativa en la Mint sin depender de librerías externas como Metaplex. |
| **`MintCloseAuthority`** | Permite cerrar la Mint y recuperar la renta depositada una vez el suministro finalice en 0 al terminar el ciclo. | Recuperación de fondos de renta para la universidad. |

---

## 3. Reglas Técnicas y Orden de Instrucciones en Solana

Por arquitectura de Solana Token-2022 (bloques TLV):
1. El tamaño de la cuenta de la Mint debe calcularse primero con `getMintLen([ExtensionType...])`.
2. Se consulta la renta mínima exenta con `connection.getMinimumBalanceForRentExemption(mintLen)`.
3. **Las instrucciones de inicialización de las extensiones DEBEN ejecutarse ANTES de la inicialización de la Mint.**

### Flujo Canónico de Creación (TypeScript)

```typescript
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeNonTransferableMintInstruction,
  createInitializePermanentDelegateInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import { createInitializeInstruction } from "@solana/spl-token-metadata";

export async function createPointsTokenMint(
  connection: Connection,
  feePayer: Keypair,
  mintAuthority: Keypair,
  permanentDelegate: Keypair
) {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // 1. Extensiones requeridas
  const extensions = [
    ExtensionType.NonTransferable,
    ExtensionType.PermanentDelegate,
    ExtensionType.MetadataPointer,
  ];

  // 2. Cálculo de espacio en bytes y renta mínima
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  // 3. Metadatos nativos
  const metaData = {
    updateAuthority: mintAuthority.publicKey,
    mint: mint,
    name: "Puntos Liderazgo UCSM",
    symbol: "PUNTOS",
    uri: "https://skill-tech-ucsm.netlify.app/api/token-metadata.json",
  };

  // 4. Transacción con orden estricto de ejecución
  const transaction = new Transaction().add(
    // A. Crear cuenta en System Program
    SystemProgram.createAccount({
      fromPubkey: feePayer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),

    // B. Inicializar NonTransferable
    createInitializeNonTransferableMintInstruction(mint, TOKEN_2022_PROGRAM_ID),

    // C. Inicializar PermanentDelegate (clave del backend)
    createInitializePermanentDelegateInstruction(
      mint,
      permanentDelegate.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),

    // D. Inicializar MetadataPointer
    createInitializeMetadataPointerInstruction(
      mint,
      mintAuthority.publicKey,
      mint,
      TOKEN_2022_PROGRAM_ID
    ),

    // E. Inicializar Mint (0 decimales para puntos enteros)
    createInitializeMintInstruction(
      mint,
      0,
      mintAuthority.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    ),

    // F. Inicializar Metadatos
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint,
      updateAuthority: mintAuthority.publicKey,
      mint: mint,
      mintAuthority: mintAuthority.publicKey,
      name: metaData.name,
      symbol: metaData.symbol,
      uri: metaData.uri,
    })
  );

  // 5. Envío y confirmación
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    feePayer,
    mintKeypair,
    mintAuthority,
  ]);

  console.log("Mint de Puntos:", mint.toBase58());
  console.log("Firma de confirmación:", signature);
  return mint.toBase58();
}
```

---

## 4. Gestión de Billeteras de los Estudiantes

### Modelo de Billetera Embebida (Privy / Custodia Transparente)
- **Inicio de Sesión:** El alumno se autentica en SkillTech como siempre (Google OAuth o correo UCSM).
- **Aprovisionamiento:** Privy (o un generador delegado seguro del servidor) asigna una clave pública de Solana (ej. `7xKZ...3bQw`) al usuario.
- **Persistencia en Base de Datos:** Se guarda la dirección en la tabla `users.solana_wallet_address`.
- **Saldo del Alumno en SOL:** **0 SOL**. El estudiante no necesita comprar ni transferir criptomonedas.
- **Fee Payer (Patrocinador de Gas):** Una billetera operativa del backend firma como pagador de renta y comisiones de red para la creación de las cuentas de token y emisión de puntos.

---

## 5. Arquitectura del Sistema e Integración con SkillTech

```
                               ┌──────────────────────────────────┐
                               │  Estudiante / Docente (Navegador) │
                               └────────────────┬─────────────────┘
                                                │ HTTPS (JWT)
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ BACKEND API (FastAPI - server_py)                                               │
│  ├─ Autenticación & Control de Roles (users, eleonor_sessions)                  │
│  ├─ Módulo de Asistencia (attendance_classes, attendance_records)              │
│  ├─ Base de Datos Operativa (PostgreSQL / Supabase):                            │
│  │    - Reglas de negocio en milisegundos (topes: 200 pts/alumno, 1200/casa)     │
│  │    - ledger_entries (Libro Mayor con estado: pendiente, confirmado, fallido) │
│  └─ Worker de Liquidación (Outbox Pattern)                                      │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ Transacción Firmada
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ SOLANA NETWORK (Devnet / Mainnet-Beta)                                          │
│  ├─ Fee Payer & Mint Authority                                                  │
│  ├─ Token-2022 Mint: "Puntos Liderazgo UCSM" (NonTransferable + PermanentDel)   │
│  └─ Associated Token Accounts (ATA) de cada estudiante                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Plan de Implementación por Etapas

### Etapa 1: Base de Datos y Billeteras de Estudiantes
1. Agregar campo `solana_wallet_address` a la tabla `users` en `server_py/memoria/database.py`.
2. Asignar Casa a cada uno de los 40-45 participantes (ej. Casa Alpha, Beta, Gamma, Delta).
3. Aprovisionar direcciones públicas de Solana vinculadas a cada ID de estudiante.

### Etapa 2: Configuración de Llaves Maestras en Backend
1. Generar Keypair para **Fee Payer** y fondearlo con ~0.5 SOL en Devnet.
2. Generar Keypair para **Mint Authority** y **Permanent Delegate**.
3. Resguardar las llaves en variables de entorno seguras en Render / Netlify (`SOLANA_FEE_PAYER_KEY`, `SOLANA_MINT_AUTHORITY_KEY`).

### Etapa 3: Despliegue del Mint de Puntos en Devnet
1. Ejecutar el script TypeScript para inicializar la Mint con las extensiones `NonTransferable` + `PermanentDelegate` + `MetadataPointer`.
2. Registrar la dirección pública resultante en la configuración (`SOLANA_POINTS_MINT_ADDRESS`).

### Etapa 4: Automatización de la Emisión por Asistencia
1. Vincular el módulo de asistencias (`MentorAttendance.tsx` / `server_py/routers/attendance.py`) con la emisión de puntos.
2. Al registrarse asistencia válida (QR o NFC):
   - Registrar la entrada en `ledger_entries`.
   - Ejecutar `createAssociatedTokenAccountIdempotentInstruction` + `createMintToInstruction`.

### Etapa 5: Interfaz de Usuario ("Mis Puntos")
1. Mostrar el saldo oficial en el Header / Perfil del alumno (ejemplo: *"Puntos acumulados: 80"*).
2. Ocultar hashes, detalles de gas y direcciones criptográficas complejas para mantener la experiencia puramente educativa.

---

## 7. Plan B y Resiliencia

Si la red o el RPC de Solana experimentan saturación durante una sesión presencial:
- La base de datos relacional de SkillTech registra la asistencia y calcula los puntos inmediatamente (los estudiantes ven su balance al instante).
- El **Worker de Liquidación** procesa los registros pendientes hacia la blockchain de Solana en segundo plano cuando la conexión esté normalizada, garantizando cero interrupciones en el aula.

---

## 8. Especificación Funcional de Front-End & Plataforma MYL (Para Análisis)

### 8.1 Principios Rectores de Interfaz y Tokenomía
1. **Contabilidad Estricta en Números Enteros:**
   - Ningún módulo de interfaz permite ni muestra decimales (**0 decimales en toda la plataforma**).
   - Todas las transacciones, precios, bonos y cuotas se operan en unidades enteras de **MYL**.
2. **Mitigación de la Abstracción Monetaria:**
   - Para que el saldo digital conserve peso psicológico, las interfaces combinan representaciones gráficas tangibles de fichas, etiquetas de equivalencia en esfuerzo individual y advertencias de costo de oportunidad antes de confirmar compras discrecionales.
3. **Arquitectura Híbrida (Efectivo QR + Credencial NFC):**
   - La interfaz móvil interactúa con hardware físico en el aula:
     - **Códigos QR impresos en fichas de MDF** para auditoría de pagos en efectivo.
     - **Credenciales NFC personales** para autenticación, compras en tienda y conciliación de cuentas al cierre.

---

### 8.2 Matriz de Roles y Accesos

| Módulo / Funcionalidad | Participante (Estudiante) | Líder de Casa | Gestor (Facilitador / Banco) |
| :--- | :--- | :--- | :--- |
| **Módulo A: Dashboard y Billetera** | Lectura personal | Lectura personal | Modo auditoría (ver todos) |
| **Módulo B: Mesa de Control de Casa** | Aporte individual en MYL | Gestión de orden y envío | Validación física de despacho |
| **Módulo C: Tienda Oficial e Impulsos** | Compra y activación individual | Compra grupal (Impulso Bono) | Configuración de stock y precios |
| **Módulo D: Mercado Secundario P2P** | Publicación y compra de activos | Publicación y compra de activos | Supervisión y registro de alertas |
| **Consola del Gestor (Pestañas 1, 2 y 3)** | Sin acceso | Sin acceso | Control total y administración |

---

### 8.3 Módulos de la Aplicación del Participante

La interfaz del estudiante se organiza en cuatro vistas principales accesibles desde la barra de navegación inferior, integrando el estado competitivo de la casa directamente en la pantalla de inicio.

#### 3.1 Módulo A: Dashboard y Billetera Personal (Vista Principal)
Es la pantalla principal tras la autenticación mediante Privy o credencial NFC. Unifica la identidad del estudiante, su liquidez personal y la posición competitiva de su casa.
- **Tarjeta de Identidad:** Muestra el nombre completo del participante, avatar e insignia de la Casa asignada (**Nexus, Apex, Visio o Ignis**) con su distintivo cromático institucional.
- **Widget de Balance en Enteros:** Destaca el saldo total disponible en números enteros (por ejemplo, `8 MYL`), desglosando entre:
  - *Efectivo en Mano:* Fichas físicas retiradas en caja o cobradas en clase pendientes de conciliación.
  - *Saldo Digital:* Fondos conciliados en cuenta.
- **Panel de Estado Competitivo de la Casa:**
  - *Puesto Actual:* Indicador de posición de la Casa (1.º, 2.º, 3.º o 4.º) en tiempo real.
  - *Marcador de Ventana Móvil (2 Sesiones):* Barra comparativa que suma los Puntos de Casa de la sesión anterior ($S_{t-1}$) más los de la sesión actual ($S_t$), indicando la diferencia numérica frente a la casa superior e inferior.
  - *Proyección de Bono:* Muestra el multiplicador preliminar y el pago que recibirá cada integrante al inicio de la siguiente sesión según el puesto actual:
    - **1.º Puesto:** $1.2\times$ (`6 MYL`)
    - **2.º Puesto:** $1.0\times$ (`5 MYL`)
    - **3.º Puesto:** $1.0\times$ (`5 MYL`)
    - **4.º Puesto:** $0.8\times$ (`4 MYL`)

#### 3.2 Módulo B: Mesa de Control de la Casa (Materiales y Presupuesto)
Espacio colaborativo para los 12 integrantes de cada casa donde seleccionan y financian los materiales requeridos para la actividad grupal de la sesión.
- **Catálogo de Materiales «a la Carta»:** Listado de insumos individuales con costo unitario en MYL y stock disponible en la sesión, diferenciando entre insumos básicos indispensables y materiales avanzados o especiales.
- **Hoja de Pedido Digital (Carrito Grupal):** Vista compartida en tiempo real que suma el costo de los materiales elegidos frente al gasto de referencia estimado (`48 MYL` por casa). Incluye un indicador de factibilidad presupuestaria basado en el techo del 60% del ingreso de la última casa ($\sim 50\text{ MYL}$).
- **Pasarela de Aportes Colaborativos y Matriz de Cohesión:** Selector numérico donde cada integrante transfiere MYL de su saldo al pozo del pedido (cuota equitativa sugerida: `4 MYL` por persona). La pantalla muestra la lista de los 12 miembros con su aporte en vivo, resaltando visualmente quién aún tiene aporte `0 MYL` para fomentar la transparencia y evitar conductas de polizón (*free-rider*).
- **Checkout de Mesa:** El botón «Confirmar y Pagar Pedido» permanece bloqueado hasta que los fondos recaudados cubran el 100% de la orden seleccionada. Al confirmarse, descuenta los saldos individuales y emite la orden de despacho físico para el facilitador.

#### 3.3 Módulo C: Tienda Oficial e Impulsos (Mercado Primario)
Plataforma de compra de consumibles tácticos, votos comprados y NFTs decorativos con precios expresados en múltiplos exactos de $0.2\times$ del Valor Base (pasos enteros de `1 MYL`).
- **Motor de Precios Dinámicos por Demanda:** El sistema monitorea el volumen de compras por artículo dentro de la sesión. Si un producto o insumo supera el umbral predefinido de rotación, su precio sube automáticamente en `+1 MYL` o `+2 MYL`, desplegando una etiqueta de «Alta Demanda / Escasez».
- **Activación y Declaración de Impulsos:**
  - *Impulso Fichas (`2 MYL` individual):* Botón de declaración previa a un reto individual de `2 MYL` base. Si el alumno acierta, triplica el premio cobrando `6 MYL` (ganancia neta de `+4 MYL`); si falla, recibe `0 MYL` y pierde los `2 MYL` invertidos.
  - *Impulso Bono (`12 MYL` grupal):* Compra grupal confirmada por la mesa antes de la actividad principal. Otorga `+24 MYL` (`+2` por integrante) en el bono de la sesión siguiente si la casa termina en 1.º o 2.º puesto, y `0 MYL` si termina en 3.º o 4.º puesto.
  - *Impulso Apoyo (`6 MYL` grupal):* Canje directo por un recurso del programa (pista, tiempo adicional o mentoría breve).
- **Temporizador de Bloqueo de Mercado:** Cuenta regresiva sincronizada con la consola del gestor que deshabilita la compra y declaración de Impulsos en el instante en que inicia la actividad.

#### 3.4 Módulo D: Mercado Secundario P2P (Intercambio entre Alumnos)
Bolsa de comercio libre entre participantes de la misma casa o de casas distintas para comprar y vender Impulsos y NFTs decorativos.
- **Publicación de Órdenes y Tope de Inventario:** Permite listar activos fijando un precio entero en MYL. El sistema bloquea automáticamente la compra si el usuario receptor ya posee 2 unidades del mismo Impulso en su inventario.
- **Liquidación Automática de Cuota Escalonada:** En intercambios entre casas distintas, el motor calcula y retiene al vendedor una cuota en enteros que se quema en Solana:
  - *Transacciones de 1 a 5 MYL ($\le 1.0\times$ Valor Base):* Cuota de `0 MYL` (Exento).
  - *Transacciones de 6 a 20 MYL ($1.2\times$ a $4.0\times$ Valor Base):* Cuota fija de `1 MYL`.
  - *Transacciones de 21 MYL o más ($\ge 4.2\times$ Valor Base):* Cuota fija de `2 MYL`.
  - *Exención Intracasa:* Si comprador y vendedor pertenecen a la misma casa, la cuota es siempre `0 MYL`.
- **Modal Obligatorio de Alerta por Intercambio Desigual:**
  Cuando el precio pactado en una oferta P2P se desvía significativamente (más de $\pm 30\%$) respecto al precio de referencia del mercado (mediana de los últimos 5 intercambios de ese activo en una ventana de 2 sesiones), el front-end despliega una ventana de advertencia antes de firmar:
  > *«Alerta de Intercambio Desigual: El valor acordado difiere sustancialmente del promedio histórico del mercado. Esta operación quedará registrada en el historial de auditoría. ¿Deseas confirmar la transacción bajo tu responsabilidad?»*

---

### 8.4 Pestañas de la Consola del Gestor (Dashboard Administrativo)

La interfaz de escritorio o tablet para los facilitadores y administradores del Banco Central se divide en tres pestañas operativas de monitoreo y control.

#### 4.1 Pestaña 1: Visión Global (Macroeconomía y Flujo Monetario)
Supervisa los agregados monetarios en tiempo real, el ritmo de quema y el respeto estricto de los topes presupuestarios de la edición.
- **Indicadores Macroeconómicos (KPIs en Vivo):**
  - *Emisión Acumulada de la Edición:* Progreso frente al Techo Total de `7,000 MYL`, diferenciando el tramo activo (`1,800` a `2,000 MYL` en sesiones 1 a 4) y la reserva (`1,000 MYL` para 12 sesiones o `2,000 MYL` para 10 sesiones).
  - *Emisión de la Sesión Actual:* Suma en vivo del Bono Fijo (`240 MYL`) más el mérito individual emitido ($\sim 144\text{ MYL}$ proyectados, `384 MYL` esperados) frente al Tope Ordinario de Sesión (`500 MYL`).
  - *Masa Circulante Activa y Tasa de Quema:* Muestra el saldo circulante (Emitido menos Quemado) y el porcentaje de quema alcanzado en la sesión frente a la meta del 75% al 85% ($\sim 312\text{ MYL}$ quemados).
  - *Semáforo de Alertas de Emisión:*
    - 🟢 **Indicador Verde:** $\le 384\text{ MYL}$.
    - 🟡 **Alerta Amarilla:** Al alcanzar `420 MYL` (109%).
    - 🔴 **Alerta Roja:** En `480`–`500 MYL` (130%) con bloqueo preventivo de emisión discrecional.
- **Distribución de Absorción y Control de Fases:** Desglose de quema por rubro (Materiales a la carta: meta `192 MYL`, Impulsos, NFTs, Votos y Cuotas), publicación de la Tasa de Referencia (`1 Punto de Casa = 2 MYL`) para comunicados de *forward guidance*, e interruptor maestro para cambiar de fase en la sesión (*Apertura $\rightarrow$ Bloque Individual $\rightarrow$ Ventana de Mercado $\rightarrow$ Actividad Grupal $\rightarrow$ Cierre*).

#### 4.2 Pestaña 2: Desglose (Por Casa y Por Participante)
Permite auditar el desempeño competitivo, el pago de insumos y las métricas individuales de esfuerzo en dos subvistas:
- **Subvista 2.1 — Nivel Casas (Gobernanza Grupal):**
  - *Tabla de Ventana Móvil (2 Sesiones):* Muestra los puntos de $S_{t-1}$, los puntos de $S_t$ (sumando aciertos individuales y la Actividad Grupal de escala 20, 12, 6 y 3 puntos), el ranking resultante y el desempate automático por el resultado de la Actividad Grupal más reciente.
  - *Monitor de Hojas de Pedido y Sanciones:* Verificación de órdenes pagadas por cada casa para entrega física de materiales, y formulario de descuento de Puntos de Casa acotado exclusivamente a infracciones grupales con tope y motivo registrado.
- **Subvista 2.2 — Nivel Participantes (Directorio de 48 Alumnos):**
  - *Ficha Individual Filtrable por Casa:* Muestra el saldo en cuenta digital, fichas físicas pendientes de conciliación y el Índice de Esfuerzo (Bono vs. Mérito), que compara cuántos MYL recibió por bono grupal frente a cuántos ganó respondiendo preguntas individuales.
  - *Auditoría de Aportes y Tope de Puntos:* Registra cuánto aportó el estudiante a la Hoja de Pedido de materiales de su casa (identificando perfiles pasivos o sobrecargados) y contabiliza sus Puntos de Casa individuales del día, bloqueando automáticamente nuevas sumas al alcanzar el tope máximo de **3 puntos por integrante y sesión**.

#### 4.3 Pestaña 3: Mercado, Intercambios y Comportamiento
Monitorea la dinámica comercial de la tienda oficial y del mercado secundario P2P para evaluar el comportamiento financiero del grupo.
- **Monitor de Tienda Oficial y Precios Dinámicos:** Registro de unidades vendidas por producto e Impulso, destacando qué artículos activaron el alza automática de `+1` o `+2 MYL` por alta demanda y el stock remanente.
- **Feed del Mercado P2P en Tiempo Real:** Cronología de intercambios entre participantes indicando vendedor, comprador, casas involucradas, precio pactado y cuota quemada (`0`, `1` o `2 MYL`).
- **Registro de Auditoría de Intercambios Desiguales:** Lista de transacciones que dispararon la alerta de desviación de precio, indicando si las partes aceptaron continuar o cancelaron la oferta, permitiendo detectar colusión o presiones entre pares.
- **Analítica Conductual:** Indicadores de velocidad de rotación de las fichas antes de su quema y distribución de saldos entre los 48 participantes para vigilar la concentración de liquidez.

---

### 8.5 Resumen de Validaciones y Reglas de Negocio en el Front-End

| Regla de Sistema | Módulo Afectado | Comportamiento y Validación en Interfaz |
| :--- | :--- | :--- |
| **Enteros Estrictos** | Toda la Plataforma | Los controles numéricos solo aceptan enteros positivos (pasos de `1 MYL`); se rechazan decimales y fracciones. |
| **Tope Individual de Puntos** | Pestaña 2 (Gestor) | Al llegar a **3 Puntos de Casa** por mérito individual en la sesión, el sistema deshabilita puntos extra para ese alumno (solo sigue cobrando MYL). |
| **Cierre de Declaración** | Módulo C (Tienda) | Al cambiar el estado de la sesión a **Actividad Grupal**, se bloquean los botones de compra y activación de Impulsos. |
| **Límite Antiacaparamiento** | Módulo C y Módulo D | Impide completar una compra en tienda o P2P si el comprador ya posee **2 unidades activas** del mismo Impulso. |
| **Ajuste por Demanda** | Módulo C y Pestaña 3 | Incrementa en `+1` o `+2 MYL` el precio del catálogo cuando el conteo de compras de la sesión cruza el umbral configurado. |
| **Cobertura de Materiales** | Módulo B (Mesa Casa) | No permite enviar la Hoja de Pedido si la suma de aportes individuales en la mesa es menor al costo total de los insumos. |

