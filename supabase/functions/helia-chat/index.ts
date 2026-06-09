import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_DAILY_LIMIT = 5

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { message, history } = await req.json()
    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400, headers: corsHeaders })
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, plan')
      .eq('id', user.id)
      .single()

    const isPremium = profile?.plan === 'premium'

    // Daily limit check (free users only)
    if (!isPremium) {
      const today = new Date().toISOString().slice(0, 10)
      const { count } = await supabaseAdmin
        .from('helia_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user')
        .gte('created_at', `${today}T00:00:00.000Z`)

      if ((count ?? 0) >= FREE_DAILY_LIMIT) {
        return new Response(JSON.stringify({ error: 'daily_limit_reached' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Save user message immediately (so count increments even if OpenAI fails)
    await supabaseAdmin.from('helia_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message.trim(),
    })

    // Fetch user context in parallel
    const [areasRes, sessionsRes] = await Promise.all([
      supabase
        .from('life_areas')
        .select('area, score')
        .eq('user_id', user.id)
        .order('score', { ascending: true })
        .limit(3),
      supabase
        .from('focus_sessions')
        .select('completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const firstName = profile?.name?.split(' ')[0] ?? 'amigo'
    const sessionsThisWeek = (sessionsRes.data ?? []).length
    const weakAreas = (areasRes.data ?? [])
      .map((a) => `  - ${a.area.replace('_', ' ')}: ${a.score}/10`)
      .join('\n') || '  (sem dados ainda)'

    const systemPrompt = `Tu és a Helia, a companheira de crescimento pessoal de ${firstName} na app Elevia.

Sobre ${firstName}:
- Sessões de foco esta semana: ${sessionsThisWeek}
- Áreas com mais margem de crescimento:
${weakAreas}

A tua personalidade:
- Calorosa, empática e nunca julgadora — como uma amiga que acredita genuinamente em ${firstName}
- Celebras cada pequeno progresso, por menor que seja
- Fazes perguntas abertas que levam à reflexão genuína
- Quando notas padrões no percurso de ${firstName}, reflectes sobre eles com gentileza
- SEMPRE em português europeu (tu/teu, não você/seu)
- Mensagens curtas: 2 a 4 frases — o utilizador está no telemóvel
- Usas 1 emoji quando faz sentido, mas sem exagerar

Memória: tens acesso ao histórico completo de conversas com ${firstName}. Quando algo foi partilhado antes, reconhece-o de forma natural — como alguém que realmente se lembra, não como um chatbot a repetir dados.`

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...((history ?? []).slice(-14)), // last 7 exchanges for context
      { role: 'user', content: message },
    ]

    // Stream from OpenAI and collect full response for saving
    let fullResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        const send = (data: string) =>
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))

        try {
          const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              stream: true,
              max_tokens: 500,
              temperature: 0.8,
              messages: openaiMessages,
            }),
          })

          if (!openaiRes.ok) {
            send(JSON.stringify({ error: 'openai_unavailable' }))
            send('[DONE]')
            controller.close()
            return
          }

          const reader = openaiRes.body!.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            for (const line of decoder.decode(value).split('\n')) {
              if (!line.startsWith('data: ')) continue
              const raw = line.slice(6)
              if (raw === '[DONE]') continue
              try {
                const chunk = JSON.parse(raw)
                const delta = chunk.choices?.[0]?.delta?.content ?? ''
                if (delta) {
                  fullResponse += delta
                  send(JSON.stringify({ delta }))
                }
              } catch { /* ignore malformed chunks */ }
            }
          }

          // Save assistant response
          if (fullResponse) {
            await supabaseAdmin.from('helia_messages').insert({
              user_id: user.id,
              role: 'assistant',
              content: fullResponse,
            })
          }
        } catch (err) {
          send(JSON.stringify({ error: String(err) }))
        } finally {
          send('[DONE]')
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
