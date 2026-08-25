import { Question, ExamData } from "../exams/types"

// Importar exámenes por área
import * as ciencias from "../exams/academicas/ciencias"
import * as matematicas from "../exams/academicas/matematicas"
import * as humanidades from "../exams/academicas/humanidades"
import * as ingenieria from "../exams/academicas/ingenieria"
import * as medicina from "../exams/academicas/medicina"
import * as razonamiento from "../exams/personales/razonamiento"
import * as aprendizaje from "../exams/personales/aprendizaje"
import * as criterio from "../exams/personales/criterio"
import * as adaptabilidad from "../exams/personales/adaptabilidad"
import * as autonomia from "../exams/personales/autonomia"

// Re-exportar tipos para compatibilidad
export type { Question, Option, ExamData } from "../exams/types"

// Construir el objeto central de datos
export const examData: Record<string, Record<string, Question[]>> = {
  ciencias: {
    "Física I: Mecánica Clásica": ciencias.fisicaClasica,
    "Química Orgánica": ciencias.quimicaOrganica,
    "Biología Celular": ciencias.biologiaCelular,
  },
  matematicas: {
    "Cálculo Diferencial": matematicas.calculoDiferencial,
    "Álgebra Lineal": matematicas.algebraLineal,
    "Estadística y Probabilidad": matematicas.estadistica,
  },
  humanidades: {
    "Historia Universal Contemporánea": humanidades.historiaUniversalContemporanea,
    "Filosofía Moderna": humanidades.filosofiaModerna,
    "Literatura Latinoamericana": humanidades.literaturaLatinoamericana,
  },
  ingenieria: {
    "Programación Orientada a Objetos": ingenieria.programacionOrientadaObjetos,
    "Análisis de Estructuras": ingenieria.analisisEstructuras,
    "Circuitos Eléctricos": ingenieria.circuitosElectricos,
  },
  medicina: {
    "Anatomía Humana": medicina.anatomiaHumana,
    "Fisiología Médica": medicina.fisiologiaMedica,
    "Farmacología Básica": medicina.farmacologiaBasica,
  },
  "razonamiento": {
    "Razonamiento Lógico": razonamiento.razonamiento_logico,
    "Abstracción de Patrones": razonamiento.razonamiento_abstraccion,
    "Resolución de Ambigüedad": razonamiento.razonamiento_ambiguedad,
  },
  "aprendizaje": {
    "Metacognición y Control": aprendizaje.aprendizaje_metacognicion,
    "Estrategias de Aprendizaje": aprendizaje.aprendizaje_estrategia,
    "Transferencia de Conocimiento": aprendizaje.aprendizaje_transferencia,
  },
  "criterio": {
    "Juicio Ético": criterio.criterio_etico,
    "Análisis Crítico": criterio.criterio_analitico,
    "Criterio Decisional": criterio.criterio_decisional,
  },
  "adaptabilidad": {
    "Flexibilidad Cognitiva": adaptabilidad.adaptabilidad_flexibilidad,
    "Respuesta al Cambio": adaptabilidad.adaptabilidad_cambio,
    "Adaptación Estratégica": adaptabilidad.adaptabilidad_estrategica,
  },
  "autonomia": {
    "Autogestión del Aprendizaje": autonomia.autonomia_autogestion,
    "Iniciativa Operativa": autonomia.autonomia_iniciativa,
    "Autodirección Personal": autonomia.autonomia_autodireccion,
  }
}

// Función auxiliar
export const getRandomQuestions = (
  area: string,
  subtopic: string,
  count: number = 12 // Reducido por defecto para el nuevo sistema, aunque la UI puede pedir más
): Question[] => {
  const questions = examData[area]?.[subtopic]
  if (!questions) return []

  const shuffled = [...questions].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}
