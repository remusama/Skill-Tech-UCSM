export interface UserProfile {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    bio?: string;
    location?: string;
    occupation?: string;
    specialty?: string;
    phone?: string;
    website?: string;
    avatar_url?: string;
    preferences?: UserPreferences;
    created_at?: string;
}

export interface UserPreferences {
    theme?: "light" | "dark";
    email_notifications?: boolean;
    push_notifications?: boolean;
    language?: string;
    data_density?: "compact" | "comfortable" | "spacious";
    [key: string]: any;
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

export async function fetchUserProfile(): Promise<UserProfile | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: getAuthHeaders()
        });
        if (response.status === 401) {
            window.location.href = "/login";
            return null;
        }
        if (!response.ok) throw new Error("Failed to fetch profile");
        return await response.json();
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to update profile");
        return true;
    } catch (error) {
        console.error("Error updating profile:", error);
        return false;
    }
}

export async function updateUserSettings(preferences: UserPreferences): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/user/settings`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ preferences })
        });
        if (!response.ok) throw new Error("Failed to update settings");
        return true;
    } catch (error) {
        console.error("Error updating settings:", error);
        return false;
    }
}
