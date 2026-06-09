import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_AREAS = ['career', 'health', 'relationships', 'finances', 'personal_growth', 'leisure', 'environment', 'family']

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { weakAreas, streak, profileName } = await req.json()

    const areasText = weakAreas
      .map((a: { key: string; label: string; score: number }) =>
        `  - ${a.label} (pontuação: ${a.score}/10)`
      )
      .join('\n')

    const systemPrompt = `És a Helia, a companheira de crescimento pessoal da Elevia.
Gera exactamente 2 missões diárias personalizadas para ${profileName ?? 'o utilizador'}.

Contexto:
- Sequência de foco: ${streak ?? 0} dias seguidos
- Áreas mais fracas hoje:
${areasText}

Regras:
- Máximo 12 palavras por missão
- Começa sempre com verbo no imperativo (Dedica, Escreve, Faz, Lê, Partilha, etc.)
- Realizável em menos de 30 minutos
- Em português europeu (tu/teu, não você/seu)
- Criativa e específica — evita missões genéricas
- Se pontuação ≤ 3: missão muito simples e de baixa fricção
- Se pontuação 4–6: moderadamente desafiante
- Se pontuação ≥ 7: mais ambiciosa e profunda

Responde APENAS com JSON válido, sem texto adicional:
{"missions": [{"title": "...", "area": "career"}, {"title": "...", "area": "health"}]}

Chaves de área válidas: career, health, relationships, finances, personal_growth, leisure, environment, family`

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.88,
        max_tokens: 250,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Gera as 2 missões de hoje.' },
        ],
      }),
    })

    if (!openaiRes.ok) throw new Error(`OpenAI error: ${openaiRes.status}`)

    const openaiData = await openaiRes.json()
    const raw = openaiData.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)

    // Validate and sanitize output
    const missions = (parsed.missions ?? [])
      .filter((m: { title?: string; area?: string }) =>
        typeof m.title === 'string' &&
        m.title.length > 0 &&
        VALID_AREAS.includes(m.area ?? '')
      )
      .slice(0, 2)

    if (missions.length < 1) throw new Error('No valid missions returned')

    return new Response(JSON.stringify({ missions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('generate-missions error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
