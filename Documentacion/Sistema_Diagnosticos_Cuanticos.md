# Sistema de Diagnósticos Cuánticos - Documentación Técnica

Este documento detalla la arquitectura, el diseño y la implementación del sistema de visualización de diagnósticos dentro del componente `QuantumResultsView.tsx`. Este sistema ha sido diseñado para proporcionar una experiencia inmersiva, técnica y altamente organizada del progreso cognitivo del estudiante.

## 1. Visión General

El sistema de diagnósticos cuánticos es una interfaz de análisis de datos avanzada que permite a los instructores y administradores navegar por el historial de sesiones de un estudiante mediante una estructura de carpetas anidadas y gráficos dinámicos.

### Características Principales:
- **Topografía de Habilidades**: Una visualización a pantalla completa de los niveles cognitivos del sujeto.
- **Métricas Técnicas Integradas (KPIs)**: Indicadores clave (PERF_AVG, ENG_LVL, RISK_IDX, SUPP_NEED) integrados directamente en el encabezado de la sección de datos.
- **Sistema de Navegación por Carpetas**: Organización jerárquica de diagnósticos por grupos, áreas y sesiones individuales.
- **Análisis de Eleonor AI**: Generación de reportes detallados y recomendaciones personalizadas basadas en el rendimiento.

---

## 3. Conexión con la Base de Datos

El sistema no se conecta directamente a la base de datos SQL, sino que consume un objeto de datos estructurado (`QuantumData`) proporcionado por el backend a través de un WebSocket o API REST.

### Estructura del Objeto de Datos:
```typescript
interface QuantumData {
    performance_avg: number;     // Promedio general de rendimiento
    learning_energy: string;     // Estado cualitativo (Estable, Alto, etc.)
    energy_percentage: number;   // % de engagement
    academic_risk: string;       // Nivel de riesgo (Bajo, Medio, Alto)
    history: {
        academic: SessionHistory[];
        personal: SessionHistory[];
    };
}
```

### Origen de la Información:
- **Sesiones**: Los datos en `history` provienen generalmente de la tabla de sesiones de diagnóstico, donde se almacenan las respuestas crudas y el análisis de la IA.
- **Campos Dinámicos**: El campo `data` dentro de cada sesión contiene el JSON con recomendaciones y análisis profundo generado por Eleonor.
- **Colores**: Los colores de las carpetas y gráficos se vinculan al campo `area` de la base de datos, mapeado internamente mediante la constante `AREA_COLORS`.

---

## 4. Guía de Uso para el Usuario

El componente `QuantumResultsView` está integrado en el panel del administrador/docente para el seguimiento personalizado.

### Cómo navegar:
1. **Vista de Gráfico**: Al entrar, se muestra un gráfico lineal del progreso temporal. Se puede alternar entre "Académico" y "Personal" usando las pestañas superiores.
2. **Acceso a Diagnósticos**: Haga clic en el botón naranja **"Diagnósticos"** para entrar al sistema de archivos.
3. **Exploración**:
   - Seleccione la carpeta del grupo deseado.
   - Elija el curso o área específica para ver sus sesiones.
   - Haga clic en una sesión individual para abrir el reporte completo.
4. **Lectura de Reporte**: Deslícese por el análisis de la IA, revise las recomendaciones y consulte el transcriptor para ver las respuestas exactas del estudiante.
5. **Regresar**: Use las migas de pan (breadcrumbs) o el botón de flecha para subir niveles en la jerarquía.

---

## 5. Componentes Técnicos

### `TechnicalMetric`
Un componente de micro-datos diseñado para la densidad informativa.
- **Estética**: Fuentes mono-espaciadas, indicadores de pulso de estado y etiquetas técnicas.
- **Propósito**: Mostrar promedios y riesgos sin ocupar espacio excesivo.

### `QuantumResultsView` (Lógica de Datos)
- **Recharts Integration**: Uso de `LineChart` para visualizar el historial temporal de puntajes.
- **Mapeo de Colores**: Función `getAreaColor` para garantizar consistencia visual entre carpetas, gráficos y reportes.
- **Framer Motion**: Animaciones suaves de transición entre niveles de navegación y estados de vista (`viewMode`).

---

## 6. Estética y Lenguaje Visual

El sistema se adhiere a un diseño **"Quantum/Premium"**:
- **Colores**: Uso de gradientes oscuros (`from-[#120530] to-[#050110]`), glassmorphism y efectos de desenfoque (`backdrop-blur`).
- **Layout**: Diseño responsivo de ancho completo que prioriza la densidad de datos y la claridad de lectura.
- **Optimización**: Se ha reducido el tamaño de los títulos y componentes secundarios para maximizar la visibilidad de las métricas principales y los gráficos.

---

## 7. Mantenimiento y Extensibilidad

Para agregar nuevas áreas o colores, actualice el objeto `AREA_COLORS` en `QuantumResultsView.tsx`. El sistema detectará automáticamente las nuevas áreas presentes en el historial del estudiante y generará las carpetas correspondientes.
