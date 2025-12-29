
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFinancialAnalysis = async (transactions: Transaction[]): Promise<AIAnalysis> => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const lastMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === (currentMonth - 1) && d.getFullYear() === currentYear;
  });

  const prompt = `
    Analise os seguintes dados financeiros e retorne um objeto JSON.
    Transações do mês atual: ${JSON.stringify(currentMonthTransactions)}
    Transações do mês anterior: ${JSON.stringify(lastMonthTransactions)}

    Gere:
    1. Um resumo amigável e direto em português brasileiro.
    2. A porcentagem de mudança nos gastos comparado ao mês anterior.
    3. Três alertas ou dicas práticas baseadas nos hábitos de consumo.
    Use uma linguagem sofisticada mas acessível.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            percentageChange: { type: Type.NUMBER },
            alerts: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "percentageChange", "alerts"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "Não foi possível processar a análise inteligente neste momento. Continue registrando seus gastos para melhores insights.",
      percentageChange: 0,
      alerts: ["Mantenha seus registros atualizados."]
    };
  }
};
