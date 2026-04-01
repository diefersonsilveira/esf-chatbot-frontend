# ESF Painel — Next.js 14 + Firebase

Painel administrativo para gestão de atendimentos via WhatsApp da Estratégia de Saúde da Família.

---

## Stack

- **Next.js 14** (App Router) — framework React com SSR e API Routes
- **Firebase Auth** — autenticação com e-mail e senha
- **Firestore** — banco de dados em tempo real
- **Tailwind CSS** — estilização
- **TypeScript** — tipagem completa
- **Vercel** — deploy recomendado

---

## Estrutura de pastas

```
panel/
├── app/
│   ├── (auth)/login/         → Tela de login
│   ├── acs/                  → Área do ACS
│   │   ├── page.tsx          → Dashboard ACS
│   │   ├── fila/             → Fila de atendimento
│   │   ├── meus-atendimentos/
│   │   └── atendimento/[id]/ → Chat em tempo real
│   ├── admin/                → Área do Admin
│   │   ├── page.tsx          → Dashboard Admin
│   │   ├── atendimentos/
│   │   ├── usuarios/
│   │   ├── relatorios/
│   │   ├── configuracoes/
│   │   └── logs/
│   └── api/                  → API Routes (servidor)
│       ├── atendimentos/
│       │   └── [id]/
│       │       ├── assumir/
│       │       ├── responder/
│       │       ├── finalizar/
│       │       └── observacao/
│       └── painel-usuarios/
├── components/
│   ├── chat/                 → ChatBubble, ChatInput, AtendimentoCard
│   ├── dashboard/            → StatsCard
│   ├── layout/               → AcsSidebar, AdminSidebar
│   └── ui/                   → StatusBadge
├── hooks/
│   ├── useAtendimentos.ts    → Listener Firestore em tempo real
│   └── useMensagens.ts       → Listener de mensagens em tempo real
├── lib/
│   ├── firebase.ts           → Firebase client SDK
│   ├── firebase-admin.ts     → Firebase Admin SDK (API Routes)
│   ├── types.ts              → Tipos TypeScript
│   └── utils.ts              → Helpers, formatação, constantes
├── providers/
│   └── AuthProvider.tsx      → Contexto de autenticação
├── services/
│   └── api.ts                → Client-side API calls
└── middleware.ts             → Proteção de rotas por role
```

---

## Configuração

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

- As variáveis `NEXT_PUBLIC_*` vêm do Firebase Console → Configurações do projeto → Seus apps → SDK setup
- `FIREBASE_SERVICE_ACCOUNT_JSON` é o conteúdo completo do `firebase-key.json` em uma única linha

Para converter o JSON em uma linha:
```bash
cat firebase-key.json | jq -c . 
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

### 4. Build para produção

```bash
npm run build
npm start
```

---

## Primeiro usuário Admin

Como não existe interface de criação sem estar logado, crie o primeiro admin via Firebase Console:

1. Acesse Firebase Console → Authentication → Users → Add user
2. Crie o usuário com e-mail e senha
3. Copie o UID gerado
4. Vá em Firestore → `painel_usuarios` → Adicionar documento com ID = UID
5. Adicione os campos:
   ```json
   {
     "uid": "<UID>",
     "email": "seu@email.com",
     "nome": "Seu Nome",
     "role": "admin",
     "ativo": true,
     "criadoEm": "2026-03-27T00:00:00.000Z"
   }
   ```

Após isso, use o painel `/admin/usuarios` para criar novos usuários.

---

## Coleções Firestore necessárias

| Coleção              | Descrição                                              |
|----------------------|--------------------------------------------------------|
| `painel_usuarios`    | Perfis dos ACS e Admins                               |
| `usuarios`           | Contatos do WhatsApp                                  |
| `atendimentos_abertos` | Atendimentos ativos (1 doc por usuário)             |
| `mensagens`          | Todas as mensagens (subcoleção virtual por atendimento_id) |
| `estado_conversas`   | Estado do fluxo do bot por usuário                    |
| `mensagens_pendentes`| Fila de saída para o WhatsApp                         |
| `observacoes`        | Observações internas dos ACS                          |
| `logs_eventos`       | Eventos do bot                                        |
| `configuracoes`      | Configurações do bot (doc: "bot")                     |

---

## Índices Firestore necessários

Crie os seguintes índices compostos no Firebase Console → Firestore → Índices:

| Coleção               | Campos                                    | Escopo   |
|-----------------------|-------------------------------------------|----------|
| `atendimentos_abertos`| `aberto` ASC + `ultima_mensagem_em` DESC  | Coleção  |
| `atendimentos_abertos`| `assignedTo` ASC + `aberto` ASC + `ultima_mensagem_em` DESC | Coleção |
| `atendimentos_abertos`| `status` ASC + `aberto` ASC + `ultima_mensagem_em` DESC | Coleção |
| `mensagens`           | `atendimento_id` ASC + `criado_em` ASC    | Coleção  |
| `observacoes`         | `atendimento_id` ASC + `criado_em` ASC    | Coleção  |

---

## Fluxo de atendimento

```
Usuário manda mensagem no WhatsApp
         ↓
   chatbot.js recebe
         ↓
   Verifica isHuman no atendimento
         ↓
   isHuman = false → Bot processa e responde
   isHuman = true  → Bot silencioso, só registra
         ↓
   Mensagem persistida em "mensagens"
         ↓
   Front escuta via onSnapshot → aparece em tempo real
         ↓
   ACS vê nova mensagem no painel, clica "Assumir"
         ↓
   POST /api/atendimentos/[id]/assumir
         ↓
   isHuman = true, assignedTo = uid do ACS
         ↓
   ACS digita resposta no chat
         ↓
   POST /api/atendimentos/[id]/responder
         ↓
   Mensagem salva em "mensagens" + enfileirada em "mensagens_pendentes"
         ↓
   chatbot.js detecta mensagem pendente e envia pelo WhatsApp
         ↓
   Usuário recebe no WhatsApp em tempo real
```

---

## Regras de segurança Firestore (básicas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuth() &&
        get(/databases/$(database)/documents/painel_usuarios/$(request.auth.uid)).data.role == 'admin';
    }

    function isACSOrAdmin() {
      return isAuth() &&
        get(/databases/$(database)/documents/painel_usuarios/$(request.auth.uid)).data.ativo == true;
    }

    match /painel_usuarios/{uid} {
      allow read: if isACSOrAdmin();
      allow write: if isAdmin();
    }

    match /atendimentos_abertos/{id} {
      allow read: if isACSOrAdmin();
      allow write: if isAdmin(); // Escritas via API Route (Admin SDK)
    }

    match /mensagens/{id} {
      allow read: if isACSOrAdmin();
      allow write: if isAdmin();
    }

    match /observacoes/{id} {
      allow read, write: if isACSOrAdmin();
    }

    match /configuracoes/{id} {
      allow read: if isACSOrAdmin();
      allow write: if isAdmin();
    }

    match /logs_eventos/{id} {
      allow read: if isAdmin();
    }
  }
}
```

---

## Deploy na Vercel

1. Push para GitHub
2. Importe o projeto na Vercel
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático

> **Importante:** A variável `FIREBASE_SERVICE_ACCOUNT_JSON` deve ser configurada como uma string JSON minificada (sem quebras de linha).

---

## Integração com o chatbot

O painel e o chatbot compartilham o mesmo projeto Firebase. O chatbot (`chatbot.js`) já está configurado para:

- Verificar `isHuman` antes de responder
- Registrar mensagens em `mensagens`
- Processar a fila `mensagens_pendentes`
- Atualizar `atendimentos_abertos`

**A única alteração necessária no chatbot** é garantir que ele leia o campo `isHuman` em vez de apenas `acs_id`:

```javascript
// Em chatbot.js, na verificação de handoff:
if (atendimento.isHuman) {
  // Bot silencioso
  return;
}
```
