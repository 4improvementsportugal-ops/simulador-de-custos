/* Simulador de Custos N5 / N5 Cost Simulator — PT | EN */
(function () {
"use strict";

/* ---------- Idioma / Language ---------- */
const LANG_KEY = "n5-sim-lang";
let LANG = "pt";
try { const l = localStorage.getItem(LANG_KEY); if (l === "en" || l === "pt") LANG = l; } catch (e) {}
const LOC = () => (LANG === "en" ? "en-GB" : "pt-PT");

// Textos fixos da página
const UI = {
  pt: {
    title: "Simulador de Custos N5",
    subtitle: "Custo variável por conta e por mês, margem ao preço proposto e custo de cada unidade para o pay per use. Todos os valores a cinzento são pressupostos editáveis.",
    reset: "Repor valores iniciais",
    settings: "Configuração inicial", ariaProduct: "Produtos", ariaScenario: "Uso do utilizador", llms: "LLMs utilizadas", ariaInputs: "Pressupostos", ariaResults: "Resultado",
    scnLight: "Leve ×0,5", scnNormal: "Normal", scnHeavy: "Intenso ×2,5",
    chatAi: "IA das conversas", callCls: "IA para classificação das chamadas telefónicas",
    hCost: "Para onde vai o custo", hWho: "Quem paga cada custo", hUnits: "Preço por unidade para o pay per use",
    hModels: "O mesmo cliente com outro modelo de IA", hRefs: "Preços de referência usados",
    noteWho: "Sugestão: fica com a N5 o que é fixo, o que custa cêntimos ou o que a N5 controla; vai para o cliente o que cresce com o uso dele: minutos e leads acima do incluído. Sem números Twilio dedicados: cada consultor usa o seu próprio número.",
    noteUnits: "Preço sugerido = custo médio da unidade ÷ (1 − margem alvo).",
    noteRefs: "Recolhidos a 24 out 2026. Preços em USD convertidos com a taxa indicada nos pressupostos. Confirmar antes de fechar preços: a página da Twilio para Portugal mostra dois valores diferentes para chamadas para móvel (0,0495 e 0,495 USD/min), e esse número muda tudo nas chamadas.",
    assumptions: "Pressupostos", supplierPrices: "Preços dos fornecedores (comuns aos dois produtos)"
  },
  en: {
    title: "N5 Cost Simulator",
    subtitle: "Variable cost per account per month, margin at the proposed price and the cost of each unit for pay per use. All grey values are editable assumptions.",
    reset: "Reset to defaults",
    settings: "Initial settings", ariaProduct: "Products", ariaScenario: "User usage", llms: "LLMs used", ariaInputs: "Assumptions", ariaResults: "Results",
    scnLight: "Light ×0.5", scnNormal: "Normal", scnHeavy: "Heavy ×2.5",
    chatAi: "Conversation AI", callCls: "AI for phone call classification",
    hCost: "Where the cost goes", hWho: "Who pays each cost", hUnits: "Unit price for pay per use",
    hModels: "The same customer with another AI model", hRefs: "Reference prices used",
    noteWho: "Suggestion: N5 keeps what is fixed, costs cents or is under N5's control; the customer pays for what grows with their own usage: minutes and leads above the allowance. No dedicated Twilio numbers: each consultant uses their own number.",
    noteUnits: "Suggested price = average unit cost ÷ (1 − target margin).",
    noteRefs: "Collected on 24 Oct 2026. USD prices converted at the rate set in the assumptions. Confirm before setting prices: Twilio's Portugal page shows two different values for calls to mobiles (0.0495 and 0.495 USD/min), and that number changes everything for calls.",
    assumptions: "Assumptions", supplierPrices: "Supplier prices (shared by both products)"
  }
};
const u = k => UI[LANG][k];

// Etiquetas, ajudas e unidades (chave = texto em português)
const EN = {
  // modelos
  "Qwen3 235B (Bedrock, Frankfurt)": "Qwen3 235B (Bedrock, Frankfurt)",
  "Mistral Small 4 (UE)": "Mistral Small 4 (EU)",
  "Modelo de topo (referência)": "Top-tier model (reference)",
  "Gemma 3 27B (classificação)": "Gemma 3 27B (classification)",
  "Jev, TypeSafe AI (classificação)": "Jev, TypeSafe AI (classification)",
  // preços dos fornecedores
  "Taxa de câmbio": "Exchange rate",
  "WhatsApp, modelo de marketing": "WhatsApp, marketing template",
  "WhatsApp, modelo de utilidade": "WhatsApp, utility template",
  "WhatsApp, resposta de serviço acima das 1 000 grátis": "WhatsApp, service reply above the 1,000 free",
  "Respostas de serviço grátis por número": "Free service replies per number",
  "Twilio, reencaminhamento para móvel PT (único custo da chamada)": "Twilio, forwarding to PT mobile (the only call cost)",
  "Twilio, reencaminhamento para fixo PT": "Twilio, forwarding to PT landline",
  "Twilio, gravação": "Twilio, recording",
  "Twilio, armazenamento da gravação": "Twilio, recording storage",
  "Transcrição dos comandos de voz (Voxtral, UE)": "Voice command transcription (Voxtral, EU)",
  "Transcrição das chamadas (Deepgram Nova-3, gravado)": "Call transcription (Deepgram Nova-3, pre-recorded)",
  "Stripe, comissão do cartão": "Stripe, card fee",
  "Stripe, valor fixo por pagamento": "Stripe, fixed fee per payment",
  "Stripe Billing (subscrições)": "Stripe Billing (subscriptions)",
  "Fatura certificada AT (por fatura)": "AT-certified invoice (per invoice)",
  // unidades
  "€ por 1 USD": "€ per 1 USD", "msg/mês": "msg/month", "USD/min/mês": "USD/min/month", "USD/min por canal": "USD/min per channel",
  "€ com IVA": "€ incl. VAT", "€ sem IVA": "€ excl. VAT", "min/mês": "min/month", "leads/mês": "leads/month",
  "números": "numbers", "comandos": "commands", "relatórios": "reports", "chamadas": "calls", "meses": "months",
  "canais": "channels", "€/mês": "€/month", "contas": "accounts", "pessoas": "people",
  // produtos
  "conta de um consultor": "one consultant's account", "conta de uma agência": "one agency's account",
  // grupos
  "Preço": "Price", "Leads e WhatsApp": "Leads and WhatsApp", "Assistente de voz": "Voice assistant",
  "Relatórios semanais": "Weekly reports", "Chamadas gravadas": "Recorded calls", "Infraestrutura": "Infrastructure",
  "Equipa da agência": "Agency team", "Assistente de voz (por consultor)": "Voice assistant (per consultant)",
  "Chamadas gravadas (por consultor)": "Recorded calls (per consultant)",
  // campos
  "Mensalidade": "Monthly fee", "IVA": "VAT", "Margem bruta alvo": "Target gross margin",
  "Minutos de chamada incluídos": "Call minutes included", "Leads incluídas": "Leads included",
  "Minutos de chamada incluídos (agência)": "Call minutes included (agency)", "Leads incluídas (agência)": "Leads included (agency)",
  "Leads por mês": "Leads per month", "Leads por mês (agência)": "Leads per month (agency)",
  "Respostas do agente por lead": "Agent replies per lead", "Modelos de marketing por lead": "Marketing templates per lead",
  "Modelos de utilidade por lead": "Utility templates per lead", "Números WhatsApp ligados": "Connected WhatsApp numbers",
  "Tokens de entrada por resposta": "Input tokens per reply", "Tokens de saída por resposta": "Output tokens per reply",
  "Comandos de voz por mês": "Voice commands per month", "Comandos de voz por consultor": "Voice commands per consultant",
  "Duração média do áudio": "Average audio length", "Tokens de entrada por comando": "Input tokens per command",
  "Tokens de saída por comando": "Output tokens per command", "Relatórios por mês": "Reports per month",
  "Relatórios por consultor por mês": "Reports per consultant per month",
  "Tokens de entrada por relatório": "Input tokens per report", "Tokens de saída por relatório": "Output tokens per report",
  "Relatórios de gestão por mês": "Management reports per month",
  "Tokens de entrada por relatório de gestão": "Input tokens per management report",
  "Chamadas por mês": "Calls per month", "Chamadas por consultor por mês": "Calls per consultant per month",
  "Duração média": "Average length", "Chamadas para móvel": "Calls to mobiles",
  "Meses que a gravação fica guardada": "Months the recording is kept", "Canais transcritos por chamada": "Channels transcribed per call",
  "Tokens de entrada na análise por chamada": "Analysis input tokens per call", "Tokens de saída na análise por chamada": "Analysis output tokens per call",
  "Custo fixo mensal do produto": "Product's fixed monthly cost", "Contas pagantes que o partilham": "Paying accounts sharing it",
  "Agências pagantes que o partilham": "Paying agencies sharing it", "Consultores na agência": "Consultants in the agency",
  // ajudas
  "Particulares e ENI: preço com IVA incluído": "Individuals and sole traders: price includes VAT",
  "Acima disto, o cliente paga por minuto": "Above this, the customer pays per minute",
  "Acima disto, o cliente paga por conversa": "Above this, the customer pays per conversation",
  "Follow-ups fora da janela de 24 h": "Follow-ups outside the 24 h window",
  "Lembretes de visita, confirmações": "Viewing reminders, confirmations",
  "Instruções, ficha da lead e histórico": "Instructions, lead record and history",
  "Agenda, estado de uma lead, gravar contacto": "Calendar, lead status, save a contact",
  "2 se gravar consultor e cliente em canais separados (a Deepgram cobra por canal)": "2 if consultant and customer are recorded on separate channels (Deepgram charges per channel)",
  "2 se gravar consultor e cliente em canais separados": "2 if consultant and customer are recorded on separate channels",
  "Servidores, base de dados, monitorização": "Servers, database, monitoring",
  "Empresas: preço + IVA": "Companies: price + VAT",
  "Um por consultor; com um só número, paga-se acima de 1 000 respostas": "One per consultant; with a single number you pay above 1,000 replies",
  "Para o broker, com toda a equipa": "For the broker, covering the whole team",
  // categorias
  "IA (tokens)": "AI (tokens)", "Transcrição": "Transcription", "Chamadas e gravação": "Calls and recording",
  "Pagamento e fatura": "Payment and invoicing"
};
const t = s => (LANG === "en" && EN[s] !== undefined ? EN[s] : s);
const num = (n, o) => Number(n).toLocaleString(LOC(), o);

/* ---------- Dados ---------- */
const MODELS = {
  qwen:   {label:"Qwen3 235B (Bedrock, Frankfurt)", in:0.22, out:0.88},
  mistral:{label:"Mistral Small 4 (UE)", in:0.10, out:0.30},
  top:    {label:"Modelo de topo (referência)", in:3.00, out:15.00},
  gemma:  {label:"Gemma 3 27B (classificação)", in:0.10, out:0.20},
  jev:    {label:"Jev, TypeSafe AI (classificação)", in:0.042, out:0}
};
const CHAT_MODELS = ["qwen","mistral","top"];
const CLS_MODELS = ["jev","gemma","mistral"];
const shortName = k => t(MODELS[k].label).replace(/ \((classificação|classification)\)/, "");

const PRICE_FIELDS = [
  {k:"fx", label:"Taxa de câmbio", unit:"€ por 1 USD", step:0.01, v:0.87},
  {k:"wa_mkt", label:"WhatsApp, modelo de marketing", unit:"€/msg", step:0.0001, v:0.049},
  {k:"wa_util", label:"WhatsApp, modelo de utilidade", unit:"€/msg", step:0.0001, v:0.0142},
  {k:"wa_serv", label:"WhatsApp, resposta de serviço acima das 1 000 grátis", unit:"€/msg", step:0.0001, v:0.0142},
  {k:"wa_free", label:"Respostas de serviço grátis por número", unit:"msg/mês", step:100, v:1000},
  {k:"tw_mob", label:"Twilio, reencaminhamento para móvel PT (único custo da chamada)", unit:"USD/min", step:0.0001, v:0.0495},
  {k:"tw_fix", label:"Twilio, reencaminhamento para fixo PT", unit:"USD/min", step:0.0001, v:0.0171},
  {k:"tw_rec", label:"Twilio, gravação", unit:"USD/min", step:0.0001, v:0.0025},
  {k:"tw_sto", label:"Twilio, armazenamento da gravação", unit:"USD/min/mês", step:0.0001, v:0.0005},
  {k:"stt", label:"Transcrição dos comandos de voz (Voxtral, UE)", unit:"USD/min", step:0.001, v:0.003},
  {k:"stt_calls", label:"Transcrição das chamadas (Deepgram Nova-3, gravado)", unit:"USD/min por canal", step:0.0001, v:0.0043},
  {k:"st_pct", label:"Stripe, comissão do cartão", unit:"%", step:0.1, v:1.5},
  {k:"st_fix", label:"Stripe, valor fixo por pagamento", unit:"€", step:0.01, v:0.25},
  {k:"st_bill", label:"Stripe Billing (subscrições)", unit:"%", step:0.1, v:0.7},
  {k:"inv", label:"Fatura certificada AT (por fatura)", unit:"€", step:0.01, v:0.15}
];

const PRODUCTS = {
  clara: {
    name:"N5 Clara", who:"conta de um consultor", consultants:false,
    groups:[
      {t:"Preço", f:[
        {k:"price", label:"Mensalidade", unit:"€ com IVA", step:1, v:47, help:"Particulares e ENI: preço com IVA incluído"},
        {k:"vat", label:"IVA", unit:"%", step:1, v:23},
        {k:"target", label:"Margem bruta alvo", unit:"%", step:1, v:75},
        {k:"incl_min", label:"Minutos de chamada incluídos", unit:"min/mês", step:10, v:100, help:"Acima disto, o cliente paga por minuto"},
        {k:"incl_leads", label:"Leads incluídas", unit:"leads/mês", step:10, v:80, help:"Acima disto, o cliente paga por conversa"}
      ]},
      {t:"Leads e WhatsApp", f:[
        {k:"leads", label:"Leads por mês", unit:"leads", step:5, v:60},
        {k:"msgs", label:"Respostas do agente por lead", unit:"msg", step:1, v:10},
        {k:"tpl_mkt", label:"Modelos de marketing por lead", unit:"msg", step:0.1, v:0.5, help:"Follow-ups fora da janela de 24 h"},
        {k:"tpl_util", label:"Modelos de utilidade por lead", unit:"msg", step:0.1, v:1, help:"Lembretes de visita, confirmações"},
        {k:"wa_numbers", label:"Números WhatsApp ligados", unit:"números", step:1, v:1},
        {k:"tin", label:"Tokens de entrada por resposta", unit:"tokens", step:100, v:3000, help:"Instruções, ficha da lead e histórico"},
        {k:"tout", label:"Tokens de saída por resposta", unit:"tokens", step:10, v:200}
      ]},
      {t:"Assistente de voz", f:[
        {k:"cmds", label:"Comandos de voz por mês", unit:"comandos", step:10, v:120, help:"Agenda, estado de uma lead, gravar contacto"},
        {k:"cmd_min", label:"Duração média do áudio", unit:"min", step:0.1, v:0.3},
        {k:"cmd_in", label:"Tokens de entrada por comando", unit:"tokens", step:100, v:4000},
        {k:"cmd_out", label:"Tokens de saída por comando", unit:"tokens", step:10, v:300}
      ]},
      {t:"Relatórios semanais", f:[
        {k:"reports", label:"Relatórios por mês", unit:"relatórios", step:1, v:4},
        {k:"rep_in", label:"Tokens de entrada por relatório", unit:"tokens", step:1000, v:40000},
        {k:"rep_out", label:"Tokens de saída por relatório", unit:"tokens", step:100, v:1500},
        {k:"mgr_reports", label:"Relatórios de gestão por mês", unit:"relatórios", step:1, v:0},
        {k:"mgr_in", label:"Tokens de entrada por relatório de gestão", unit:"tokens", step:1000, v:0}
      ]},
      {t:"Chamadas gravadas", f:[
        {k:"calls", label:"Chamadas por mês", unit:"chamadas", step:5, v:40},
        {k:"call_min", label:"Duração média", unit:"min", step:0.5, v:4},
        {k:"share_mob", label:"Chamadas para móvel", unit:"%", step:5, v:70},
        {k:"retention", label:"Meses que a gravação fica guardada", unit:"meses", step:1, v:6},
        {k:"channels", label:"Canais transcritos por chamada", unit:"canais", step:1, v:1, help:"2 se gravar consultor e cliente em canais separados (a Deepgram cobra por canal)"},
        {k:"an_in", label:"Tokens de entrada na análise por chamada", unit:"tokens", step:500, v:6000},
        {k:"an_out", label:"Tokens de saída na análise por chamada", unit:"tokens", step:50, v:800}
      ]},
      {t:"Infraestrutura", f:[
        {k:"infra", label:"Custo fixo mensal do produto", unit:"€/mês", step:50, v:600, help:"Servidores, base de dados, monitorização"},
        {k:"accounts", label:"Contas pagantes que o partilham", unit:"contas", step:10, v:200}
      ]}
    ]
  },
  imob: {
    name:"N5 Imobiliário", who:"conta de uma agência", consultants:true,
    groups:[
      {t:"Preço", f:[
        {k:"price", label:"Mensalidade", unit:"€ sem IVA", step:1, v:299, help:"Empresas: preço + IVA"},
        {k:"vat", label:"IVA", unit:"%", step:1, v:23},
        {k:"target", label:"Margem bruta alvo", unit:"%", step:1, v:75},
        {k:"incl_min", label:"Minutos de chamada incluídos (agência)", unit:"min/mês", step:50, v:1000},
        {k:"incl_leads", label:"Leads incluídas (agência)", unit:"leads/mês", step:50, v:400}
      ]},
      {t:"Equipa da agência", f:[
        {k:"cons", label:"Consultores na agência", unit:"pessoas", step:1, v:10}
      ]},
      {t:"Leads e WhatsApp", f:[
        {k:"leads", label:"Leads por mês (agência)", unit:"leads", step:10, v:500},
        {k:"msgs", label:"Respostas do agente por lead", unit:"msg", step:1, v:10},
        {k:"tpl_mkt", label:"Modelos de marketing por lead", unit:"msg", step:0.1, v:0.5},
        {k:"tpl_util", label:"Modelos de utilidade por lead", unit:"msg", step:0.1, v:1},
        {k:"wa_numbers", label:"Números WhatsApp ligados", unit:"números", step:1, v:10, help:"Um por consultor; com um só número, paga-se acima de 1 000 respostas"},
        {k:"tin", label:"Tokens de entrada por resposta", unit:"tokens", step:100, v:3000},
        {k:"tout", label:"Tokens de saída por resposta", unit:"tokens", step:10, v:200}
      ]},
      {t:"Assistente de voz (por consultor)", f:[
        {k:"cmds", label:"Comandos de voz por consultor", unit:"comandos", step:10, v:100},
        {k:"cmd_min", label:"Duração média do áudio", unit:"min", step:0.1, v:0.3},
        {k:"cmd_in", label:"Tokens de entrada por comando", unit:"tokens", step:100, v:4000},
        {k:"cmd_out", label:"Tokens de saída por comando", unit:"tokens", step:10, v:300}
      ]},
      {t:"Relatórios semanais", f:[
        {k:"reports", label:"Relatórios por consultor por mês", unit:"relatórios", step:1, v:4},
        {k:"rep_in", label:"Tokens de entrada por relatório", unit:"tokens", step:1000, v:40000},
        {k:"rep_out", label:"Tokens de saída por relatório", unit:"tokens", step:100, v:1500},
        {k:"mgr_reports", label:"Relatórios de gestão por mês", unit:"relatórios", step:1, v:4, help:"Para o broker, com toda a equipa"},
        {k:"mgr_in", label:"Tokens de entrada por relatório de gestão", unit:"tokens", step:1000, v:150000}
      ]},
      {t:"Chamadas gravadas (por consultor)", f:[
        {k:"calls", label:"Chamadas por consultor por mês", unit:"chamadas", step:5, v:40},
        {k:"call_min", label:"Duração média", unit:"min", step:0.5, v:4},
        {k:"share_mob", label:"Chamadas para móvel", unit:"%", step:5, v:70},
        {k:"retention", label:"Meses que a gravação fica guardada", unit:"meses", step:1, v:6},
        {k:"channels", label:"Canais transcritos por chamada", unit:"canais", step:1, v:1, help:"2 se gravar consultor e cliente em canais separados"},
        {k:"an_in", label:"Tokens de entrada na análise por chamada", unit:"tokens", step:500, v:6000},
        {k:"an_out", label:"Tokens de saída na análise por chamada", unit:"tokens", step:50, v:800}
      ]},
      {t:"Infraestrutura", f:[
        {k:"infra", label:"Custo fixo mensal do produto", unit:"€/mês", step:50, v:600},
        {k:"accounts", label:"Agências pagantes que o partilham", unit:"contas", step:1, v:20}
      ]}
    ]
  }
};

const CATS = {
  ia:{label:"IA (tokens)", c:"--c1"},
  wa:{label:"WhatsApp", c:"--c2"},
  voz:{label:"Transcrição", c:"--c3"},
  tel:{label:"Chamadas e gravação", c:"--c4"},
  infra:{label:"Infraestrutura", c:"--c5"},
  pag:{label:"Pagamento e fatura", c:"--c6"}
};

// Linhas de custo: id -> [pt, en]
const LINES = {
  wa_ai:    ["Agente WhatsApp (IA)", "WhatsApp agent (AI)"],
  wa_serv:  ["Respostas acima das grátis", "Replies above the free tier"],
  wa_mkt:   ["Modelos de marketing (follow-ups)", "Marketing templates (follow-ups)"],
  wa_util:  ["Modelos de utilidade (lembretes)", "Utility templates (reminders)"],
  voice_a:  ["Assistente de voz: áudio", "Voice assistant: audio"],
  voice_ai: ["Assistente de voz: IA", "Voice assistant: AI"],
  reports:  ["Relatórios semanais", "Weekly reports"],
  fwd:      ["Reencaminhamento para a lead", "Forwarding to the lead"],
  rec:      ["Gravação e armazenamento", "Recording and storage"],
  stt:      ["Transcrição (Deepgram)", "Transcription (Deepgram)"],
  cls:      ["Classificação", "Classification"],
  infra:    ["Infraestrutura (parte do custo fixo)", "Infrastructure (share of fixed cost)"],
  fees_sub: ["Stripe e fatura da mensalidade", "Stripe and invoice for the monthly fee"],
  fees_over:["Stripe sobre o consumo extra", "Stripe on extra usage"]
};
const WHY = {
  voice_a:  ["É o uso normal da app e custa cêntimos; cobrar afastaria o uso", "It's normal app use and costs cents; charging would discourage use"],
  voice_ai: ["É o uso normal da app e custa cêntimos; cobrar afastaria o uso", "It's normal app use and costs cents; charging would discourage use"],
  reports:  ["Faz parte do valor do produto e é a N5 que decide quando corre", "It's part of the product's value and N5 decides when it runs"],
  infra:    ["Custo fixo da N5, não depende do cliente", "N5's fixed cost, independent of the customer"],
  fees_sub: ["Custo de cobrar; não se repassa", "Cost of collecting payment; not passed on"]
};
const L = (pair) => pair[LANG === "en" ? 1 : 0];
const lineLabel = l => l.id === "cls" ? `${L(LINES.cls)} (${shortName(l.model)})` : L(LINES[l.id]);

/* ---------- Estado ---------- */
const STORE_KEY = "n5-sim-v4";
function defaults(){
  const s = {prod:"clara", scn:1, model:"qwen", cls:"jev", prices:{}, vals:{}};
  PRICE_FIELDS.forEach(f=>s.prices[f.k]=f.v);
  for (const [p,def] of Object.entries(PRODUCTS)){ s.vals[p]={}; def.groups.forEach(g=>g.f.forEach(f=>s.vals[p][f.k]=f.v)); }
  return s;
}
let S = defaults();
try { const raw = localStorage.getItem(STORE_KEY); if (raw){ const saved = JSON.parse(raw); const d = defaults();
  S = {...d, ...saved, prices:{...d.prices, ...(saved.prices||{})}, vals:{clara:{...d.vals.clara, ...((saved.vals||{}).clara||{})}, imob:{...d.vals.imob, ...((saved.vals||{}).imob||{})}}}; } } catch(e){}
function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(S)); }catch(e){} }

/* ---------- Formatação ---------- */
const eur  = x => new Intl.NumberFormat(LOC(),{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(x);
const eur4 = x => new Intl.NumberFormat(LOC(),{style:"currency",currency:"EUR",minimumFractionDigits:4,maximumFractionDigits:4}).format(x);
const pct = n => (isFinite(n)? num(n*100,{maximumFractionDigits:1})+"%" : "–");
const fmtU = n => n < 0.1 ? eur4(n) : eur(n);
const N = x => num(Math.round(x));

/* ---------- Cálculo ---------- */
function compute(prodKey, modelKey, scn, clsKey){
  const v = S.vals[prodKey], P = S.prices, m = MODELS[modelKey], ck = clsKey || S.cls, mc = MODELS[ck], fx = P.fx;
  const n = PRODUCTS[prodKey].consultants ? Math.max(1, v.cons) : 1;
  const llm = (tin, tout) => (tin/1e6*m.in + tout/1e6*m.out) * fx;
  const llmCls = (tin, tout) => (tin/1e6*mc.in + tout/1e6*mc.out) * fx;
  const ch = Math.max(1, v.channels || 1);
  const lines = [];
  // grp: lead = cobrável por conversa · call = cobrável por minuto · num = cobrável direto · base = fica com a N5
  const add = (cat,grp,id,eurv,extra) => lines.push(Object.assign({cat,grp,id,eur:eurv}, extra||{}));

  const leads = v.leads * scn;
  const replies = leads * v.msgs;
  const paidServ = Math.max(0, replies - P.wa_free * Math.max(1, v.wa_numbers));
  add("ia","lead","wa_ai", llm(replies*v.tin, replies*v.tout));
  add("wa","lead","wa_serv", paidServ * P.wa_serv);
  add("wa","lead","wa_mkt", leads*v.tpl_mkt*P.wa_mkt);
  add("wa","lead","wa_util", leads*v.tpl_util*P.wa_util);

  const cmds = v.cmds * n * scn;
  add("voz","base","voice_a", cmds * v.cmd_min * P.stt * fx);
  add("ia","base","voice_ai", llm(cmds*v.cmd_in, cmds*v.cmd_out));
  const reps = v.reports * n;
  add("ia","base","reports", llm(reps*v.rep_in + v.mgr_reports*v.mgr_in, (reps + v.mgr_reports)*v.rep_out));

  const calls = v.calls * n * scn, mins = calls * v.call_min, sm = v.share_mob/100;
  add("tel","call","fwd", mins * (sm*P.tw_mob + (1-sm)*P.tw_fix) * fx);
  add("tel","call","rec", mins * (P.tw_rec + v.retention*P.tw_sto) * fx);
  add("voz","call","stt", mins * ch * P.stt_calls * fx);
  add("ia","call","cls", llmCls(calls*v.an_in, calls*v.an_out), {model:ck});

  add("infra","base","infra", v.infra / Math.max(1, v.accounts));

  const sum = g => lines.filter(l=>l.grp===g).reduce((a,l)=>a+l.eur,0);
  const leadCost = sum("lead"), callCost = sum("call"), numCost = sum("num"), baseCost = sum("base");
  const perLead = leads > 0 ? leadCost/leads : 0, perMin = mins > 0 ? callCost/mins : 0;
  const tg = v.target/100;
  const priceLead = perLead/(1-tg), priceMin = perMin/(1-tg);
  const inclMin = Math.max(0, v.incl_min), inclLeads = Math.max(0, v.incl_leads);
  const xMin = Math.max(0, mins - inclMin), xLeads = Math.max(0, leads - inclLeads);
  const inclCallCost = Math.min(mins, inclMin)*perMin, inclLeadCost = Math.min(leads, inclLeads)*perLead;
  const overMin = xMin*priceMin, overLead = xLeads*priceLead, overNum = numCost;
  const overRev = overMin + overLead + overNum;

  const vatF = 1 + v.vat/100;
  const net = prodKey==="clara" ? v.price / vatF : v.price;
  const gross = net * vatF;
  const payPct = (P.st_pct + P.st_bill)/100, payFixed = P.st_fix + P.inv;
  const feesSub = gross*payPct + payFixed;
  const feesOver = overRev*vatF*payPct;
  add("pag","base","fees_sub", feesSub);
  add("pag","fee","fees_over", feesOver);

  const absorbed = baseCost + inclCallCost + inclLeadCost + feesSub;
  const billCost = xMin*perMin + xLeads*perLead + numCost + feesOver;
  const total = lines.reduce((a,l)=>a+l.eur,0);
  const revenue = net + overRev;
  const margin = revenue - total, mPct = revenue > 0 ? margin/revenue : 0;
  const subMargin = net - absorbed, subPct = net > 0 ? subMargin/net : 0;
  const denom = (1-tg) - vatF*payPct;
  const netNeeded = denom > 0 ? (absorbed - feesSub + payFixed)/denom : Infinity;

  const en = LANG === "en";
  const units = [
    {u: en?"Call minute":"Minuto de chamada", n5:false, who: en?"Customer, above allowance":"Cliente, acima do incluído",
     d: en?"forwarding to the lead's number, recording, transcription and classification":"reencaminhamento para o número da lead, gravação, transcrição e classificação", c: perMin},
    {u: en?"Conversation with a lead":"Conversa com uma lead", n5:false, who: en?"Customer, above allowance":"Cliente, acima do incluído",
     d: en?`${num(v.msgs)} replies and the WhatsApp templates, on average`:`${num(v.msgs)} respostas e os modelos WhatsApp, em média`, c: perLead},
    {u: en?"Voice command":"Comando de voz", n5:true, who: en?"N5, included":"N5, incluído",
     d: en?`${num(v.cmd_min)} min of audio`:`${num(v.cmd_min)} min de áudio`, c: v.cmd_min*P.stt*fx + llm(v.cmd_in, v.cmd_out)},
    {u: en?"Weekly report":"Relatório semanal", n5:true, who: en?"N5, included":"N5, incluído",
     d: en?`${num(v.rep_in/1000)} thousand tokens read`:`${num(v.rep_in/1000)} mil tokens lidos`, c: llm(v.rep_in, v.rep_out)}
  ];
  return {lines,total,net,gross,vatF,revenue,margin,mPct,subMargin,subPct,netNeeded,absorbed,billCost,overRev,overMin,overLead,overNum,
    inclCallCost,inclLeadCost,feesSub,feesOver,baseCost,numCost,perMin,perLead,priceMin,priceLead,xMin,xLeads,inclMin,inclLeads,units,leads,calls,mins,replies,paidServ,t:tg};
}

/* ---------- Render ---------- */
function applyStatic(){
  document.documentElement.lang = LANG === "en" ? "en" : "pt-PT";
  document.title = u("title");
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent = u(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-aria]").forEach(el=>{ el.setAttribute("aria-label", u(el.dataset.i18nAria)); });
  document.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.lang===LANG)));
}

function renderInputs(){
  const box = document.getElementById("inputs");
  const def = PRODUCTS[S.prod];
  const open = new Set([...box.querySelectorAll("details.grp")].map((d,i)=>d.open?i:-1).filter(i=>i>=0));
  const first = !box.children.length;
  let html = `<h2>${u("assumptions")}: ${def.name} <span class="unit">(${t(def.who)})</span></h2>`;
  def.groups.forEach((g,gi)=>{
    const isOpen = first ? gi<3 : open.has(gi);
    html += `<details class="grp" ${isOpen?"open":""}><summary>${t(g.t)}</summary><div class="fields">`;
    g.f.forEach(f=>{
      const id = `${S.prod}-${f.k}`;
      html += `<label for="${id}">${t(f.label)}${f.help?`<span class="help">${t(f.help)}</span>`:""}</label>
        <div><input id="${id}" type="number" inputmode="decimal" step="${f.step}" value="${S.vals[S.prod][f.k]}" data-k="${f.k}"><div class="unit">${t(f.unit)}</div></div>`;
    });
    html += `</div></details>`;
  });
  const pi = def.groups.length;
  html += `<details class="grp" ${!first && open.has(pi)?"open":""}><summary>${u("supplierPrices")}</summary><div class="fields">`;
  PRICE_FIELDS.forEach(f=>{
    html += `<label for="p-${f.k}">${t(f.label)}</label><div><input id="p-${f.k}" type="number" inputmode="decimal" step="${f.step}" value="${S.prices[f.k]}" data-p="${f.k}"><div class="unit">${t(f.unit)}</div></div>`;
  });
  html += `</div></details>`;
  box.innerHTML = html;
  box.querySelectorAll("input").forEach(inp=>inp.addEventListener("input",()=>{
    const x = parseFloat(inp.value.replace(",", "."));
    if (!isFinite(x)) return;
    if (inp.dataset.k) S.vals[S.prod][inp.dataset.k] = x; else S.prices[inp.dataset.p] = x;
    save(); renderResults();
  }));
}

function renderResults(){
  const en = LANG === "en";
  const r = compute(S.prod, S.model, S.scn);
  const v = S.vals[S.prod];
  const isClara = S.prod==="clara";
  const cl = p => p >= v.target/100 ? "ok" : (p >= 0.5 ? "mid" : "low");
  const withVat = en ? "incl. VAT" : "com IVA", noVat = en ? "excl. VAT" : "sem IVA";

  document.getElementById("kpis").innerHTML = `
    <div class="kpi"><div class="k">${en?"Monthly fee (excl. VAT)":"Mensalidade (sem IVA)"}</div><div class="v">${eur(r.net)}</div><div class="n">${eur(isClara?v.price:r.gross)} ${withVat}</div></div>
    <div class="kpi"><div class="k">${en?"Extra usage charged":"Consumo extra cobrado"}</div><div class="v">${eur(r.overRev)}</div><div class="n">${en?`${N(r.xMin)} min and ${N(r.xLeads)} leads above the allowance`:`${N(r.xMin)} min e ${N(r.xLeads)} leads acima do incluído`}</div></div>
    <div class="kpi"><div class="k">${en?"What the monthly fee covers":"O que a mensalidade paga"}</div><div class="v">${eur(r.absorbed)}</div><div class="n">${en?"monthly fee margin":"margem da mensalidade"} <span class="pill ${cl(r.subPct)}">${pct(r.subPct)}</span></div></div>
    <div class="kpi"><div class="k">${en?"Total account margin":"Margem total da conta"}</div><div class="v ${cl(r.mPct)}">${eur(r.margin)}</div><div class="n"><span class="pill ${cl(r.mPct)}">${pct(r.mPct)}</span> ${en?"target":"alvo"} ${num(v.target)}%</div></div>
    <div class="kpi"><div class="k">${en?"Total account cost":"Custo total da conta"}</div><div class="v">${eur(r.total)}</div><div class="n">${en?`${N(r.leads)} leads, ${N(r.calls)} calls, ${N(r.mins)} min`:`${N(r.leads)} leads, ${N(r.calls)} chamadas, ${N(r.mins)} min`}</div></div>
    <div class="kpi"><div class="k">${en?`Minimum monthly fee for ${num(v.target)}%`:`Mensalidade mínima para ${num(v.target)}%`}</div><div class="v">${isFinite(r.netNeeded)?eur(isClara? r.netNeeded*r.vatF : r.netNeeded):"–"}</div><div class="n">${isClara?withVat:noVat}, ${en?"with the current allowance":"com o incluído atual"}</div></div>`;

  const byCat = {}; r.lines.forEach(l=>byCat[l.cat]=(byCat[l.cat]||0)+l.eur);
  const max = Math.max(...Object.values(byCat), 0.0001);
  document.getElementById("stack").innerHTML = Object.entries(byCat).filter(([,x])=>x>0)
    .map(([c,x])=>`<span title="${t(CATS[c].label)}" style="width:${x/r.total*100}%;background:var(${CATS[c].c})"></span>`).join("");
  document.getElementById("bars").innerHTML = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([c,x])=>{
    const detail = r.lines.filter(l=>l.cat===c && l.eur>0.004).map(l=>`${lineLabel(l)}: ${eur(l.eur)}`).join(" · ");
    return `<div class="bar" title="${detail}"><span><i class="sw" style="background:var(${CATS[c].c})"></i>${t(CATS[c].label)}</span>
      <div class="track"><div class="fill" style="width:${x/max*100}%;background:var(${CATS[c].c})"></div></div>
      <span class="val">${eur(x)}</span></div>`;}).join("");

  // Quem paga / Who pays
  const base = r.lines.filter(l=>l.grp==="base" && l.eur>0.0049);
  const rowN = (label, cost, why) => `<tr><td>${label}<div class="unit">${why}</div></td><td class="num">${eur(cost)}</td><td class="num">–</td></tr>`;
  const rowC = (label, cost, charged, why) => `<tr><td>${label}<div class="unit">${why}</div></td><td class="num">${eur(cost)}</td><td class="num">${eur(charged)}</td></tr>`;
  let html = `<thead><tr><th>${en?"Cost":"Custo"}</th><th class="num">${en?"Cost/month":"Custo/mês"}</th><th class="num">${en?"Charged to customer":"Cobrado ao cliente"}</th></tr></thead><tbody>`;
  html += `<tr class="grp"><td colspan="3">${en?"N5 keeps it: included in the monthly fee":"Fica com a N5: incluído na mensalidade"}</td></tr>`;
  base.forEach(l=> html += rowN(lineLabel(l), l.eur, WHY[l.id]?L(WHY[l.id]):""));
  html += en
    ? rowN(`Calls: ${N(Math.min(r.mins,r.inclMin))} min included`, r.inclCallCost, `The plan includes ${N(r.inclMin)} min; gives the customer predictability`)
    : rowN(`Chamadas: ${N(Math.min(r.mins,r.inclMin))} min incluídos`, r.inclCallCost, `O plano inclui ${N(r.inclMin)} min; dá previsibilidade ao cliente`);
  html += en
    ? rowN(`Leads: ${N(Math.min(r.leads,r.inclLeads))} conversations included`, r.inclLeadCost, `The plan includes ${N(r.inclLeads)} leads; it's the core of the product`)
    : rowN(`Leads: ${N(Math.min(r.leads,r.inclLeads))} conversas incluídas`, r.inclLeadCost, `O plano inclui ${N(r.inclLeads)} leads; é o núcleo do produto`);
  html += `<tr class="sub"><td>${en?"Total covered by the monthly fee":"Total pago pela mensalidade"}</td><td class="num">${eur(r.absorbed)}</td><td class="num">${eur(r.net)}</td></tr>`;
  html += `<tr class="grp"><td colspan="3">${en?"Charged to the customer: pay per use":"Imputável ao cliente: pago por uso"}</td></tr>`;
  html += en
    ? rowC(`Minutes above allowance: ${N(r.xMin)} × ${fmtU(r.priceMin)}`, r.xMin*r.perMin, r.overMin, "Grows with how much the customer calls: Twilio forwarding, recording and transcription")
    : rowC(`Minutos acima do incluído: ${N(r.xMin)} × ${fmtU(r.priceMin)}`, r.xMin*r.perMin, r.overMin, "Cresce com quanto o cliente liga: reencaminhamento Twilio, gravação e transcrição");
  html += en
    ? rowC(`Leads above allowance: ${N(r.xLeads)} × ${fmtU(r.priceLead)}`, r.xLeads*r.perLead, r.overLead, "Grows with the customer's lead volume; WhatsApp and AI per conversation")
    : rowC(`Leads acima do incluído: ${N(r.xLeads)} × ${fmtU(r.priceLead)}`, r.xLeads*r.perLead, r.overLead, "Cresce com o volume de leads do cliente; WhatsApp e IA por conversa");
  if (r.feesOver > 0.0049) html += rowC(L(LINES.fees_over), r.feesOver, 0, en?"Already built into the unit price":"Já está dentro do preço por unidade");
  html += `<tr class="sub"><td>${en?"Total extra usage":"Total do consumo extra"}</td><td class="num">${eur(r.billCost)}</td><td class="num">${eur(r.overRev)}</td></tr></tbody>`;
  document.getElementById("split").innerHTML = html;

  const flags = [];
  const tel = byCat.tel||0;
  if (tel > r.total*0.4) flags.push(en
    ? `Calls are ${pct(tel/r.total)} of the cost, almost all from Twilio forwarding to the lead. Confirm the per-minute price in Twilio's call log.`
    : `As chamadas são ${pct(tel/r.total)} do custo, quase tudo do reencaminhamento Twilio para a lead. Confirmar o preço por minuto no registo de chamadas da Twilio.`);
  if (r.paidServ > 0) flags.push(en
    ? `${N(r.paidServ)} WhatsApp replies go over the free limit. Connecting more numbers (one per consultant) lowers this cost.`
    : `${N(r.paidServ)} respostas WhatsApp passam o limite grátis. Ligar mais números (um por consultor) baixa este custo.`);
  if (S.cls==="jev") flags.push(en
    ? "Jev runs in the US, with no EU data residency or published GDPR certifications. Transcripts are personal data: ask for zero retention and a DPA before using it."
    : "O Jev corre nos EUA, sem residência de dados na UE nem certificações RGPD publicadas. As transcrições são dados pessoais: pedir zero retenção e um DPA antes de usar.");
  if (S.prices.tw_mob >= 0.2) flags.push(en
    ? `With mobile forwarding at ${num(S.prices.tw_mob)} USD/min, phone costs no longer fit the price.`
    : `Com o reencaminhamento para móvel a ${num(S.prices.tw_mob)} USD/min, o telefone deixa de caber no preço.`);
  document.getElementById("flags").innerHTML = flags.map(f=>`<div class="flag">${f}</div>`).join("");

  document.getElementById("units").innerHTML = `<thead><tr><th>${en?"Unit":"Unidade"}</th><th>${en?"Who pays":"Quem paga"}</th><th class="num">${en?"Cost":"Custo"}</th><th class="num">${en?"Suggested price":"Preço sugerido"}</th></tr></thead><tbody>` +
    r.units.map(x=>`<tr><td>${x.u}<div class="unit">${x.d}</div></td><td>${x.who}</td><td class="num">${fmtU(x.c)}</td><td class="num">${x.n5?"–":fmtU(x.c/(1-r.t))}</td></tr>`).join("") + `</tbody>`;

  document.getElementById("models").innerHTML = `<thead><tr><th>${en?"Model":"Modelo"}</th><th class="num">${en?"AI cost":"Custo IA"}</th><th class="num">${en?"Total cost":"Custo total"}</th><th class="num">${en?"Margin":"Margem"}</th></tr></thead><tbody>` +
    CHAT_MODELS.map(k=>{ const x = compute(S.prod,k,S.scn); const ia = x.lines.filter(l=>l.cat==="ia").reduce((a,l)=>a+l.eur,0);
      return `<tr${k===S.model?' style="font-weight:600"':""}><td>${t(MODELS[k].label)}<div class="unit">${num(MODELS[k].in)} / ${num(MODELS[k].out)} ${en?"USD per million tokens":"USD por milhão de tokens"}</div></td><td class="num">${eur(ia)}</td><td class="num">${eur(x.total)}</td><td class="num ${cl(x.mPct)}">${pct(x.mPct)}</td></tr>`;}).join("") + `</tbody>`;
}

function renderRefs(){
  const en = LANG === "en";
  const rows = [
    ["Qwen3 235B no Amazon Bedrock","Qwen3 235B on Amazon Bedrock","0,22 / 0,88 USD por milhão de tokens","0.22 / 0.88 USD per million tokens","https://www.llmreference.com/provider/aws-bedrock/qwen3-235b-a22b-instruct-2507"],
    ["Qwen3 no Bedrock em Frankfurt","Qwen3 on Bedrock in Frankfurt","disponível na região UE","available in the EU region","https://aws.amazon.com/about-aws/whats-new/2025/10/deepseek-openai-qwen-models-amazon-bedrock-additional-regions"],
    ["Mistral Small 4 e Voxtral","Mistral Small 4 and Voxtral","0,10 / 0,30 USD por milhão; transcrição a partir de 0,003 USD/min","0.10 / 0.30 USD per million; transcription from 0.003 USD/min","https://developer.puter.com/tutorials/mistral-api-pricing/"],
    ["WhatsApp (Meta)","WhatsApp (Meta)","Serviço: 1 000 grátis por número/mês desde 1 out 2026; utilidade paga dentro da janela","Service: 1,000 free per number/month since 1 Oct 2026; utility paid within the window","https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing"],
    ["WhatsApp, tabela Europa Ocidental","WhatsApp, Western Europe rate card","marketing 0,0490 €; utilidade e serviço 0,0142 €","marketing €0.0490; utility and service €0.0142","https://whautomate.com/whatsapp-business-api-pricing-portugal"],
    ["Twilio Voice Portugal","Twilio Voice Portugal","reencaminhamento para fixo 0,0171; para móvel 0,0495 ou 0,495 (página inconsistente); gravação 0,0025","forwarding to landline 0.0171; to mobile 0.0495 or 0.495 (page inconsistent); recording 0.0025","https://www.twilio.com/en-us/voice/pricing/pt"],
    ["Deepgram Nova-3","Deepgram Nova-3","0,0043 USD/min gravado (0,0077 em tempo real); português suportado; cobrança por canal a confirmar","0.0043 USD/min pre-recorded (0.0077 streaming); Portuguese supported; per-channel billing to be confirmed","https://convertaudiototext.com/blog/deepgram-nova-3-explained"],
    ["Jev (TypeSafe AI)","Jev (TypeSafe AI)","0,042 USD por milhão de tokens de entrada, saída grátis; corre nos EUA","0.042 USD per million input tokens, output free; runs in the US","https://www.beri.net/tools/typesafe-jev"],
    ["Gemma 3 27B (Gemini API)","Gemma 3 27B (Gemini API)","0,10 / 0,20 USD por milhão de tokens","0.10 / 0.20 USD per million tokens","https://anotherwrapper.com/llm-pricing/gemma-3-27b-it"],
    ["Stripe","Stripe","Billing 0,7%; comissão de cartões EEA a confirmar na página portuguesa","Billing 0.7%; EEA card fee to be confirmed on the Portuguese page","https://stripe.com/pricing"]
  ];
  document.getElementById("refs").innerHTML = `<thead><tr><th>${en?"Source":"Fonte"}</th><th>${en?"Value used":"Valor usado"}</th></tr></thead><tbody>` +
    rows.map(r=>`<tr><td><a href="${r[4]}" target="_blank" rel="noopener">${en?r[1]:r[0]}</a></td><td>${en?r[3]:r[2]}</td></tr>`).join("") + `</tbody>`;
}

function syncControls(){
  document.querySelectorAll("[data-prod]").forEach(b=>b.setAttribute("aria-pressed", String(b.dataset.prod===S.prod)));
  document.querySelectorAll("[data-scn]").forEach(b=>b.setAttribute("aria-pressed", String(parseFloat(b.dataset.scn)===S.scn)));
  document.getElementById("model").innerHTML = CHAT_MODELS.map(k=>`<option value="${k}" ${k===S.model?"selected":""}>${t(MODELS[k].label)}</option>`).join("");
  document.getElementById("cls").innerHTML = CLS_MODELS.map(k=>`<option value="${k}" ${k===S.cls?"selected":""}>${shortName(k)}</option>`).join("");
}

function renderAll(){ applyStatic(); syncControls(); renderInputs(); renderResults(); renderRefs(); }

/* ---------- Eventos ---------- */
document.querySelectorAll("[data-lang]").forEach(b=>b.addEventListener("click",()=>{
  LANG = b.dataset.lang; try{ localStorage.setItem(LANG_KEY, LANG); }catch(e){} renderAll();
}));
document.querySelectorAll("[data-prod]").forEach(b=>b.addEventListener("click",()=>{S.prod=b.dataset.prod; save(); syncControls(); document.getElementById("inputs").innerHTML=""; renderInputs(); renderResults();}));
document.querySelectorAll("[data-scn]").forEach(b=>b.addEventListener("click",()=>{S.scn=parseFloat(b.dataset.scn); save(); syncControls(); renderResults();}));
document.getElementById("model").addEventListener("change",e=>{S.model=e.target.value; save(); renderResults();});
document.getElementById("cls").addEventListener("change",e=>{S.cls=e.target.value; save(); renderResults();});
document.getElementById("reset").addEventListener("click",()=>{S=defaults(); save(); syncControls(); document.getElementById("inputs").innerHTML=""; renderInputs(); renderResults();});

renderAll();
})();
