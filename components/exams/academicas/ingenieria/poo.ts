import { Question } from "../../types"

export const programacionOrientadaObjetos: Question[] = [
    {
        id: 1,
        text: "Explique con sus palabras qué es la 'Encapsulación' y por qué es útil.",
        options: [],
        correctAnswer: "Ocultar detalles internos (estado) y exponer solo una interfaz pública (métodos). Protege datos y reduce acoplamiento.",
        type: "open-ended",
        skill: "conceptos-poo"
    },
    {
        id: 2,
        text: "Diferencia clave entre una Clase y un Objeto.",
        options: [],
        correctAnswer: "Clase: Plano/Molde. Objeto: Instancia concreta creada con ese molde.",
        type: "open-ended",
        skill: "fundamentos"
    },
    {
        id: 3,
        text: "Si la clase Perro hereda de Animal, y sobreescribimos el método 'hacerSonido', esto es un ejemplo de:",
        options: [
            { id: "A", text: "Polimorfismo" },
            { id: "B", text: "Composición" },
            { id: "C", text: "Singleton" },
        ],
        correctAnswer: "A",
        type: "multiple-choice",
        skill: "polimorfismo"
    },
    {
        id: 4,
        text: "¿Cuándo usarías una Interfaz (Interface) en lugar de una Clase Abstracta?",
        options: [],
        correctAnswer: "Cuando solo quieres definir un contrato de comportamiento (qué hace) sin ninguna implementación base, o para herencia múltiple de tipos.",
        type: "open-ended",
        skill: "diseno-software"
    },
    {
        id: 5,
        text: "El principio SOLID de 'Responsabilidad Única' establece que una clase debe tener:",
        options: [
            { id: "A", text: "Muchos métodos pequeños" },
            { id: "B", text: "Una sola razón para cambiar" },
            { id: "C", text: "Un solo constructor" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "solid"
    },
    {
        id: 6,
        text: "¿Qué problema resuelve el patrón de diseño Singleton?",
        options: [],
        correctAnswer: "Asegura que una clase tenga solo una instancia y provee acceso global a ella.",
        type: "open-ended",
        skill: "patrones-diseno"
    },
    {
        id: 7,
        text: "En términos de memoria, ¿qué pasa cuando asignas `a = b` donde ambos son objetos?",
        options: [
            { id: "A", text: "Se copia todo el objeto nuevo" },
            { id: "B", text: "Se copia la referencia (apuntan al mismo sitio)" },
            { id: "C", text: "Se borra b" },
        ],
        correctAnswer: "B",
        type: "multiple-choice",
        skill: "manejo-memoria"
    },
    {
        id: 8,
        text: "Ventaja de la Composición sobre la Herencia ('prefer composition over inheritance').",
        options: [],
        correctAnswer: "Más flexible, menos acoplamiento, se puede cambiar comportamiento en tiempo de ejecución.",
        type: "open-ended",
        skill: "arquitectura"
    }
]
