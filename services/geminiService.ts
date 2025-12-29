
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIAnalysis } from '../types.ts';

export const getFinancialAnalysis = async (transactions: Transaction[]): Promise<AIAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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

  // Agrupar por categoria para facilitar a análise da IA
  const groupByCategory = (txs: Transaction[]) => {
    return txs.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const currentStats = groupByCategory(currentMonthTransactions);
  const lastStats = groupByCategory(lastMonthTransactions);

  const prompt = `
    Atue como um Consultor Financeiro Sênior da NEXO. Analise o comportamento financeiro deste usuário:
    
    DADOS DE CONSUMO (Agrupado por Categoria):
    Mês Atual: ${JSON.stringify(currentStats)}
    Mês Anterior: ${JSON.stringify(lastStats)}
    
    DADOS BRUTOS (Últimas Transações): ${JSON.stringify(currentMonthTransactions.slice(0, 10))}

    SUA MISSÃO:
    1. Identifique a categoria com maior aumento percentual de gastos.
    2. Detecte comportamentos que possam comprometer a saúde financeira (ex: excesso em Lazer vs baixo investimento).
    3. Calcule o delta percentual total de gastos entre os meses.
    
    FORMATO DE RETORNO (JSON APENAS):
    {
      "summary": "Um parágrafo sofisticado, direto e motivador sobre o estado atual.",
      "percentageChange": number (ex: 15.5 para aumento, -5.2 para redução),
      "alerts": [
        "Insight 1: Fato + Impacto + Ação específica (ex: Gastos com 'Alimentação' subiram 30%. Reduza pedidos de delivery para poupar R$ X/mês)",
        "Insight 2: Sugestão de realocação baseada nos dados.",
        "Insight 3: Alerta de oportunidade ou perigo identificado."
      ]
    }

    REGRAS:
    - Nunca use dicas genéricas como "economize mais".
    - Seja específico sobre os valores e nomes das categorias presentes nos dados.
    - Idioma: Português Brasileiro.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "Não foi possível consolidar sua análise estratégica neste momento. Continue registrando seus movimentos para uma auditoria completa.",
      percentageChange: 0,
      alerts: [
        "A análise requer um histórico mais robusto de transações.",
        "Certifique-se de categorizar todos os seus gastos corretamente.",
        "Tente novamente em alguns instantes para processar os dados atuais."
      ]
    };
  }
};
