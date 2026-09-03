import { API_URL } from "../config";

const API_BASE_URL = API_URL;

function getAuthHeaders() {
    const token = localStorage.getItem("eleonor_token");
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

export interface AttendanceRecord {
    id: number;
    student_id: number;
    student_name: string;
    student_username: string;
    status: "presente" | "tardanza" | "falta";
    registered_at: string | null;
    scan_type: "qr" | "nfc" | null;
}

export interface AttendanceClass {
    id: number;
    name: string;
    code: string;
    group_id: number | null;
    group_name: string;
    date: string;
    start_time: string;
    late_time: string;
    is_active: boolean;
    stats?: {
        total: number;
        present: number;
        tardy: number;
        absent: number;
        rate: number;
    };
    records?: AttendanceRecord[];
}

export interface StudentStats {
    total: number;
    present: number;
    tardy: number;
    absent: number;
    rate: number;
    group_average: number;
}

export interface AttendanceHistoryItem {
    class_name: string;
    date: string;
    start_time: string;
    status: "presente" | "tardanza" | "falta";
    registered_at: string | null;
    scan_type: "qr" | "nfc" | null;
}

export interface StudentAttendanceResponse {
    student_id?: number;
    student_name?: string;
    stats: StudentStats;
    history: AttendanceHistoryItem[];
}

export async function fetchMentorClasses(): Promise<AttendanceClass[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/classes`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) return [];
        if (!response.ok) throw new Error("Failed to fetch classes");
        return await response.json();
    } catch (error) {
        console.error("Error fetching mentor classes:", error);
        return [];
    }
}

export async function fetchClassDetails(classId: number): Promise<AttendanceClass | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/classes/${classId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch class details");
        return await response.json();
    } catch (error) {
        console.error(`Error fetching details for class ${classId}:`, error);
        return null;
    }
}

export async function createClass(payload: { name: string; group_id: number | null; date: string; start_time: string; late_time: string }): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/classes`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || "Failed to create class");
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating class:", error);
        throw error;
    }
}

export async function scanAttendance(payload: { class_code: string; secure_token: string; scan_type: string }): Promise<{ message: string; student_name: string; status: "presente" | "tardanza"; registered_at: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/scan`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.detail || "Failed to register scan");
        }
        return await response.json();
    } catch (error) {
        console.error("Error sending scan payload:", error);
        throw error;
    }
}

export async function fetchStudentToken(): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/student/token`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch secure token");
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error("Error fetching student secure token:", error);
        return "";
    }
}

export async function regenerateStudentToken(): Promise<string> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/student/regenerate_token`, {
            method: "POST",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to regenerate token");
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error("Error regenerating student secure token:", error);
        return "";
    }
}

export async function fetchStudentAttendanceStats(studentId: number): Promise<StudentAttendanceResponse | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/student/${studentId}/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch student attendance stats");
        return await response.json();
    } catch (error) {
        console.error(`Error fetching attendance stats for student ${studentId}:`, error);
        return null;
    }
}

export async function fetchMyAttendanceStats(): Promise<StudentAttendanceResponse | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/my/stats`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) return null;
        if (!response.ok) throw new Error("Failed to fetch my attendance stats");
        return await response.json();
    } catch (error) {
        console.error("Error fetching my attendance stats:", error);
        return null;
    }
}
