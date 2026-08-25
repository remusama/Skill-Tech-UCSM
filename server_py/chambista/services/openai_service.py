import os
import json
from openai import OpenAI
from server_py.config import settings
from pydantic import BaseModel
from typing import List

class SearchAnalysis(BaseModel):
    categoria: str
    especialidad: str
    urgencia: str
    riesgo: str
    tipo_trabajo: str
    skills: List[str]
    keywords: List[str]

class OpenAIService:
    def __init__(self):
        # We read from settings, which loads from .env
        self.api_key = settings.OPENAI_API_KEY
        if not self.api_key:
            print("WARNING: OPENAI_API_KEY no está configurada")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key, timeout=20.0)

    def analyze_problem(self, problem_description: str) -> dict:
        if not self.client:
            raise Exception("OpenAI client not initialized")
            
        system_prompt = """Eres un asistente experto en clasificación de problemas de mantenimiento y servicios técnicos.
Tu objetivo es analizar la descripción del problema del usuario y devolver un JSON estructurado con los siguientes campos:
- categoria: (e.g. Plomería, Electricidad, Gasfitería, etc.)
- especialidad: La especialidad requerida (e.g. Reparación de duchas, Tableros eléctricos)
- urgencia: (Baja, Media, Alta)
- riesgo: (Bajo, Medio, Alto)
- tipo_trabajo: (e.g. Reparación, Instalación, Mantenimiento)
- skills: Arreglo de strings con habilidades clave.
- keywords: Arreglo de strings con palabras clave relevantes.
RESPONDE ÚNICAMENTE CON EL JSON."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo", # Use an affordable model, could be gpt-4o-mini
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": problem_description}
                ],
                response_format={ "type": "json_object" }
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error en OpenAI analyze_problem: {e}")
            raise

    def generate_explanation(self, problem: str, recommended_candidates: list) -> str:
        if not self.client:
            raise Exception("OpenAI client not initialized")
            
        system_prompt = """Eres un asistente amigable de 'Chambista'. 
El usuario ha reportado un problema y el sistema ha encontrado a los mejores profesionales.
Tu tarea es escribir un mensaje amigable y breve (2-3 oraciones) explicando por qué estos profesionales fueron seleccionados según su problema.
NO inventes nombres, básate en que hemos encontrado opciones con experiencia comprobada, buena reputación y precios justos.
RESPONDE SÓLO CON EL MENSAJE."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Problema: {problem}\nGenera la explicación."}
                ]
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error en OpenAI generate_explanation: {e}")
            return "Se han encontrado profesionales excelentes para ayudarte con tu problema."

openai_service = OpenAIService()
