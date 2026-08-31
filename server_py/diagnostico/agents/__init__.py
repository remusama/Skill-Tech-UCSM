import asyncio
from .judge_agent import JudgeAgent
from .behavioral_agent import BehavioralAgent
import json
from .math_agent import MathAgent
from .science_agent import ScienceAgent
from .humanities_agent import HumanitiesAgent
from .engineering_agent import EngineeringAgent
from .medical_agent import MedicalAgent
from .cognitive_agent import CognitiveAgent
from .unified_synthesizer import UnifiedSynthesizer
from .specialist_agent import SpecialistAgent
from .eleonor_synthesizer import EleonorSynthesizer

# Registry of Agents
AGENTS = {
    "matematicas": MathAgent(),
    "ciencias": ScienceAgent(),
    "humanidades": HumanitiesAgent(),
    "ingenieria": EngineeringAgent(),
    "medicina": MedicalAgent(),
    "cognitivo-academico": CognitiveAgent(),
    "razonamiento": SpecialistAgent("Razonamiento", "ERES EL TRADUCTOR ANALÍTICO DE RAZONAMIENTO. Interpreta Z-scores y clusters en términos de lógica y pensamiento lateral del tema evaluado."),
    "aprendizaje": SpecialistAgent("Aprendizaje", "ERES EL TRADUCTOR ANALÍTICO DE APRENDIZAJE. Interpreta Z-scores y clusters en términos de estrategias de estudio y foco del tema evaluado."),
    "criterio": SpecialistAgent("Criterio", "ERES EL TRADUCTOR ANALÍTICO DE CRITERIO. Interpreta Z-scores y clusters en términos de análisis crítico y ética del tema evaluado."),
    "adaptabilidad": SpecialistAgent("Adaptabilidad", "ERES EL TRADUCTOR ANALÍTICO DE ADAPTABILIDAD. Interpreta Z-scores y clusters en términos de flexibilidad cognitiva del tema evaluado."),
    "autonomia": SpecialistAgent("Autonomía", "ERES EL TRADUCTOR ANALÍTICO DE AUTONOMÍA. Interpreta Z-scores y clusters en términos de autogestión e iniciativa del tema evaluado."),
    "autonomía": SpecialistAgent("Autonomía", "ERES EL TRADUCTOR ANALÍTICO DE AUTONOMÍA. Interpreta Z-scores y clusters en términos de autogestión e iniciativa del tema evaluado.")
}


SYNTHESIZER = UnifiedSynthesizer()
ELEONOR_SYNTH = EleonorSynthesizer()


BEHAVIORAL_AGENT = BehavioralAgent()
JUDGE_AGENT = JudgeAgent()


async def analyze_exam(area: str, quiz_data: dict) -> dict:
    """
    Routes the analysis request to the specialized subject agent and behavioral agent,
    then combines them using the judge agent.
    """
    key = area.lower()
    subject_agent = AGENTS.get(key)

    if not subject_agent:
        # Fallback if area not found
        print(f"⚠️ Agente no encontrado para: {key}")
        return {
            "area": area,
            "error": "agente_no_encontrado",
            "nivel": 0,
            "razonamiento_tipo": "analitico",
            "razonamiento_vector": {"analitico": 0, "divergente": 0, "intuitivo": 0, "mecanico": 0, "estrategico": 0},
            "analisis_profundo": "No se encontró un agente especializado para esta área.",
            "puntos_fuertes": [],
            "recomendaciones": [],
            "errores": ["area_desconocida"],
            "confianza_score": 0,
            "metricas_base": {"precision": 0, "velocidad_normalizada": 0, "consistencia": 0, "tasa_error_conceptual": 0},
            "observaciones": "Fallo en el enrutamiento del agente de diagnóstico."
        }

    print(f"🧠 [MoE] Iniciando análisis paralelo (Conceptual + Conductual) para {area}...")

    subject_task = subject_agent.analyze(quiz_data)
    behavioral_task = BEHAVIORAL_AGENT.analyze_behavior(quiz_data)

    subject_result, behavioral_result = await asyncio.gather(subject_task, behavioral_task)

    print("⚖️ [MoE] Evaluando veredicto final en JudgeAgent...")
    final_result = await JUDGE_AGENT.generate_final_verdict(subject_result, behavioral_result)

    print("\n" + "=" * 50)
    print(f"🧠 [RAZONAMIENTO IA - Veredicto de {area.upper()}]")
    print(json.dumps(final_result, indent=2, ensure_ascii=False))
    print("=" * 50 + "\n")

    return final_result


async def generate_unified_prompt(latest_diagnosis: dict, skill_snapshot: dict = None, trends: dict = None, history: list = None, session_state: dict = None) -> str:
    """
    Calls the synthesizer and returns the enriched cognitive context.
    """
    context = await SYNTHESIZER.synthesize(
        latest_diagnosis,
        skill_snapshot or {},
        trends or {},
        history or [],
        session_state=session_state
    )

    # We no longer compress into a single line to allow for more density
    return f"MEMORIA ACTIVA:\n{context}"
