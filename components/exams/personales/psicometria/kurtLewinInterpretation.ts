import { LeadershipStyle } from "./kurtLewinItems";

export type TraitKey = "decision" | "futuro" | "participacion" | "intervencion" | "valoracion";

export const LEWIN_TRAITS: Record<TraitKey, Record<LeadershipStyle, string>> = {
  decision: {
    autoritario: "El líder toma las decisiones de forma unilateral, sin consultar al grupo.",
    democratico: "El líder basa su decisión en la participación y consenso del grupo.",
    "laissez-faire": "El líder deja que el grupo decida por sí mismo, sin intervenir.",
  },
  futuro: {
    autoritario: "El líder planifica el futuro sin considerar las opiniones del grupo.",
    democratico: "El líder construye la visión de futuro de manera colaborativa.",
    "laissez-faire": "El líder no se involucra en la planificación del futuro.",
  },
  participacion: {
    autoritario: "Participación limitada; el líder dirige y controla toda actividad.",
    democratico: "Alta participación; el líder fomenta la implicación activa.",
    "laissez-faire": "Participación sin guía; el líder no ejerce dirección.",
  },
  intervencion: {
    autoritario: "Intervención directa y constante sobre las tareas.",
    democratico: "Intervención orientadora y de apoyo al grupo.",
    "laissez-faire": "Intervención mínima o nula.",
  },
  valoracion: {
    autoritario: "Valoración centrada en el cumplimiento y la obediencia.",
    democratico: "Valoración basada en el aporte y el crecimiento del grupo.",
    "laissez-faire": "Valoración esporádica o inexistente.",
  },
};

export const LEWIN_STYLE_LABEL: Record<LeadershipStyle, string> = {
  autoritario: "Autoritario",
  democratico: "Democrático",
  "laissez-faire": "Laissez-faire",
};

export const LEWIN_STYLE_DESCRIPTION: Record<LeadershipStyle, string> = {
  autoritario: "Liderazgo centrado en la autoridad del jefe. Decide, ordena y controla.",
  democratico: "Liderazgo participativo. Consulta, consensua y orienta al grupo.",
  "laissez-faire": "Liderazgo delegativo extremo. Evita intervenir y deja hacer.",
};
