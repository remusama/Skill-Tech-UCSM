export interface UserSkill {
    id: number;
    area: string;
    level: number;
    skill_xp: number;
    current_diagnosis?: any; // AI diagnosis data
    last_updated: string;
}

export interface SkillSnapshot {
    [key: string]: string;
}

export interface ExamResponse {
    analysis: {
        area: string;
        nivel: number;
        razonamiento: string;
        confianza: string;
        potencial: string;
        observaciones: string;
    };
    session_state: {
        skill_snapshot: SkillSnapshot;
        trends: Record<string, string>;
        unified_prompt_preview: string;
    };
}

import { API_URL } from "../config";

const API_BASE_URL = API_URL;

function getAuthHeaders() {
    const token = localStorage.getItem("eleonor_token");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

export async function fetchUserSkills(): Promise<UserSkill[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/diagnosis/skills`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) {
            console.warn("⚠️ Unauthorized - returning empty skills");
            return [];
        }
        if (!response.ok) throw new Error("Failed to fetch skills");
        return await response.json();
    } catch (error) {
        console.error("Error fetching skills:", error);
        return [];
    }
}

export async function fetchStudentSkills(studentId: number): Promise<UserSkill[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/informante/students/${studentId}/skills`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch student skills");
        return await response.json();
    } catch (error) {
        console.error("Error fetching student skills:", error);
        return [];
    }
}

export async function fetchProgressHistory(): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/diagnosis/progress-history`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) return [];
        if (!response.ok) throw new Error("Failed to fetch progress history");
        return await response.json();
    } catch (error) {
        console.error("Error fetching progress history:", error);
        return [];
    }
}

export async function fetchBenchmarking(): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/diagnosis/benchmarking`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) return [];
        if (!response.ok) throw new Error("Failed to fetch benchmarking");
        return await response.json();
    } catch (error) {
        console.error("Error fetching benchmarking:", error);
        return [];
    }
}

export async function submitExam(payload: any): Promise<ExamResponse | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/diagnosis/`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        if (response.status === 401) throw new Error("Unauthorized");
        if (!response.ok) throw new Error("Failed to submit exam");
        return await response.json();
    } catch (error) {
        console.error("Error submitting exam:", error);
        return null;
    }
}
export async function explainQuestion(question: string, options: any[]): Promise<{ explanation: string } | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/diagnosis/explain`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ question, options }),
        });
        if (response.status === 401) throw new Error("Unauthorized");
        if (!response.ok) throw new Error("Failed to get explanation");
        return await response.json();
    } catch (error) {
        console.error("Error getting explanation:", error);
        return null;
    }
}
