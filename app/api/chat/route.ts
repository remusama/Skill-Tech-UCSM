import { OpenAI } from "openai"
import { triggerVtsExpression } from "@/lib/vts-service";


export async function POST(req: Request) {
  try {
    // Verify API key is set
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Parse the request body
    const { messages } = await req.json()

    if (!messages) {
      return new Response(JSON.stringify({ error: "Messages are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages.map((message: any) => ({
        content: message.content,
        role: message.role,
      })),
      temperature: 1.1,
      max_tokens: 200,
      top_p: 1.0,
      frequency_penalty: 0.9,
      presence_penalty: 0.5,
    })

    let responseContent = response.choices[0]?.message?.content || "Lo siento, no pude generar una respuesta."

    // Regex para encontrar comandos de expresión
    const expressionRegex = /\s*\[expression:(.*?)\]\s*/g;
    const match = responseContent.match(expressionRegex);

    if (match) {
      // Extraer el nombre de la expresión del primer comando encontrado
      const firstMatch = /\s*\[expression:(.*?)\]\s*/.exec(match[0]);
      if (firstMatch && firstMatch[1]) {
        const expressionName = firstMatch[1].trim();
        console.log(`[API Chat] Found expression command: ${expressionName}`);
        // Dispara y olvida la activación de la expresión
        triggerVtsExpression(expressionName);
      }
      
      // Limpia el contenido de la respuesta para no mostrar ningún comando
      responseContent = responseContent.replace(expressionRegex, "").trim();
    }

    return new Response(JSON.stringify({ content: responseContent }), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (error: any) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
