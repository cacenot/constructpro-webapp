# QA Fix Request: 2.2

**Gerado:** 2026-05-30
**Reviewer:** Quinn (Test Architect)
**Severidade máxima:** CRITICAL
**Total de issues:** 2

---

## Instruções para @dev

Corrija APENAS os issues listados abaixo. Não adicione features nem refatore código não relacionado.

**Processo:**
1. Leia cada issue com atenção
2. Corrija o problema específico descrito
3. Verifique usando os passos de verificação
4. Marque o issue como corrigido neste documento
5. Execute todos os testes antes de marcar como completo

---

## Resumo

| Severidade | Qtd | Status |
|------------|-----|--------|
| CRITICAL   | 1   | Deve corrigir antes do merge |
| MAJOR      | 1   | Deve corrigir antes do merge |
| MINOR      | 0   | — |

---

## Issues a Corrigir

---

### 1. [CRITICAL] Validação de telefone no schema Zod não detecta números inválidos

**Issue ID:** FIX-2.2-001

**Localização:** `src/schemas/broker.schema.ts:13–23`

**Contexto:**
A API retorna erro de validação real em produção:
```json
{
  "error_code": 3000,
  "error_category": "validation",
  "message": "Erro de validação",
  "details": {
    "errors": [
      {
        "field": "body.phone",
        "message": "Value error, Invalid phone number",
        "type": "value_error"
      }
    ]
  },
  "path": "/api/v1/brokers"
}
```

**Problema:**
O schema usa apenas regex de formato E.164, que valida estrutura mas não validade real do número:

```typescript
// src/schemas/broker.schema.ts (linhas 13-23)
const phoneOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      return /^\+[1-9]\d{1,14}$/.test(val)  // ← só valida formato, não validade
    },
    { message: 'Telefone inválido. Use formato E.164' }
  )
```

O regex `/^\+[1-9]\d{1,14}$/` aceita valores como `+5511987` (incompleto) ou outros números sintaticamente corretos mas inválidos. O backend usa a biblioteca `phonenumbers` (Python) que valida se o número é de fato discável — e rejeita.

O `PhoneInput` já importa `isValidPhoneNumber` de `react-phone-number-input` e mostra erro visual, mas isso é **desacoplado** do Zod. O usuário pode ver a mensagem de erro inline e ainda assim submeter o formulário.

**Esperado:**
Usar `isValidPhoneNumber` de `react-phone-number-input` no refine do Zod, garantindo que a mesma validação do componente também bloqueie o submit:

```typescript
import { isValidPhoneNumber } from 'react-phone-number-input'
import { validateCPF } from '@cacenot/construct-pro-api-client'
import { z } from 'zod'

const phoneOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      return isValidPhoneNumber(val)
    },
    { message: 'Telefone inválido' }
  )
```

**Verificação:**
- [ ] `npx vitest run src/schemas/broker.schema.test.ts` passa 100%
- [ ] Teste: `+5511987` (incompleto) → schema rejeita com mensagem 'Telefone inválido'
- [ ] Teste: `+5511987654321` (válido BR mobile) → schema aceita
- [ ] Teste: `+351912345678` (válido PT) → schema aceita
- [ ] Teste: campo vazio → schema aceita (campo opcional)
- [ ] Criar corretor com telefone válido → sem erro de API

**Status:** [ ] Corrigido

---

### 2. [MAJOR] `international` prop no BrokerForm sobrescreve configuração do PhoneInput

**Issue ID:** FIX-2.2-002

**Localização:** `src/components/corretores/broker-form.tsx:154–159`

**Problema:**
O `BrokerForm` passa `international` como prop para `PhoneInput`:

```tsx
// src/components/corretores/broker-form.tsx (linhas 154-159)
<PhoneInput
  value={field.value || ''}
  onChange={field.onChange}
  defaultCountry="BR"
  international   // ← sobrescreve o `international={false}` hardcoded em phone-input.tsx
/>
```

Em `src/components/ui/phone-input.tsx` (linha 78–79), o componente tem:
```tsx
international={false}   // hardcoded
...
{...props}              // spread DEPOIS → `international={true}` do broker-form VENCE
```

Isso cria inconsistência: o componente foi projetado com `international={false}` (exibe formato nacional) mas `broker-form` força `international={true}` (exibe formato internacional). O comportamento do `onChange` não muda (ambos retornam E.164), mas a UX de exibição diverge do design original do componente.

**Esperado:**
Remover o prop `international` do `BrokerForm`. O `PhoneInput` já tem `withCountryCallingCode={true}` que garante que o código do país seja exibido mesmo com `international={false}`:

```tsx
<PhoneInput
  value={field.value || ''}
  onChange={field.onChange}
  defaultCountry="BR"
/>
```

**Verificação:**
- [ ] Campo telefone exibe formato nacional com código de país visível (ex: `+55 (11) 98765-4321`)
- [ ] `onChange` continua retornando E.164 (`+5511987654321`)
- [ ] `npm run lint` sem warnings
- [ ] `npm run build` sem erros TypeScript

**Status:** [ ] Corrigido

---

## Constraints

**CRÍTICO: @dev deve seguir estas constraints:**

- [ ] Corrigir APENAS os issues listados acima
- [ ] NÃO adicionar novas features
- [ ] NÃO refatorar código não relacionado
- [ ] Executar testes unitários antes de marcar completo: `npx vitest run src/schemas/broker.schema.test.ts src/hooks/use-brokers-table.test.ts`
- [ ] Executar lint antes de marcar completo: `npm run lint`
- [ ] Executar build antes de marcar completo: `npm run build`
- [ ] Atualizar `broker.schema.test.ts` se novos casos de teste forem necessários para cobrir a validação `isValidPhoneNumber`

---

## Após Corrigir

1. Marque cada issue como corrigido neste documento
2. Execute: `npx vitest run src/schemas/broker.schema.test.ts`
3. Teste manualmente: criar corretor com telefone via UI
4. Solicite re-review: `@qa *review 2.2`

---

## Análise Técnica (para referência)

**Fluxo atual (com bug):**
```
PhoneInput onChange → E.164 value → field.value
→ Zod refine: regex passa número incompleto
→ form.handleSubmit: phone enviado
→ API backend phonenumbers: REJEITA → HTTP 422
```

**Fluxo esperado (após fix):**
```
PhoneInput onChange → E.164 value → field.value
→ Zod refine: isValidPhoneNumber() → rejeita se inválido
→ form.handleSubmit: BLOQUEADO pelo Zod → erro no campo
→ Usuário corrige antes de submeter
```

**Nota:** O `broker.schema.test.ts` existente (Task 8 — 23 testes) provavelmente possui testes para `phone`. Verifique se os casos de teste cobrem números sintaticamente E.164 mas inválidos (ex: `+551`). Se não cobrem, adicione esses casos para evitar regressão futura.

---

_Gerado por Quinn (Test Architect) — AIOX QA System_
_Story: 2.2 | Branch: feat/2.1-api-client-bump | Data: 2026-05-30_
