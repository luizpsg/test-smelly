# Análise Manual de Test Smells

Arquivo analisado: `test/userService.smelly.test.js`

A seguir, os Test Smells identificados manualmente, com o trecho de código que os evidencia e o risco associado.

---

## 1. Eager Test (Teste Ansioso / Múltiplos comportamentos em um único teste)

**Trecho:**

```js
test('deve criar e buscar um usuário corretamente', () => {
  // Act 1: Criar
  const usuarioCriado = userService.createUser(
    dadosUsuarioPadrao.nome,
    dadosUsuarioPadrao.email,
    dadosUsuarioPadrao.idade
  );
  expect(usuarioCriado.id).toBeDefined();

  // Act 2: Buscar
  const usuarioBuscado = userService.getUserById(usuarioCriado.id);
  expect(usuarioBuscado.nome).toBe(dadosUsuarioPadrao.nome);
  expect(usuarioBuscado.status).toBe('ativo');
});
```

**Por que é um mau cheiro / risco:**
O próprio comentário do teste denuncia o smell ao numerar `Act 1` e `Act 2`. O teste exercita dois comportamentos distintos (criar e buscar) em uma única função `test`. Se a criação falhar, nunca sabemos se a busca funciona; se o teste quebrar, o diagnóstico é mais lento porque há múltiplas causas possíveis. Testes pequenos e focados em um único comportamento são mais fáceis de manter, ler e diagnosticar.

---

## 2. Conditional Test Logic (Lógica condicional dentro do teste)

**Trecho:**

```js
test('deve desativar usuários se eles não forem administradores', () => {
  const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);
  const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

  const todosOsUsuarios = [usuarioComum, usuarioAdmin];

  for (const user of todosOsUsuarios) {
    const resultado = userService.deactivateUser(user.id);
    if (!user.isAdmin) {
      expect(resultado).toBe(true);
      const usuarioAtualizado = userService.getUserById(user.id);
      expect(usuarioAtualizado.status).toBe('inativo');
    } else {
      expect(resultado).toBe(false);
    }
  }
});
```

**Por que é um mau cheiro / risco:**
O teste tem um `for` e um `if/else`, ou seja, ele mistura **fluxo de controle** com **verificação**. Se o `for` nunca executar (lista vazia, por exemplo), nenhum `expect` é chamado e o teste passa **sem testar nada**. Além disso, o teste virou um mini-programa: para entender o que está sendo verificado é preciso simular mentalmente a execução. A regra é simples — testes devem ser declarativos, lineares e sem ramificações. Esse smell é capturado automaticamente pela regra `jest/no-conditional-expect`.

---

## 3. Assert condicional dentro de try/catch (teste que pode passar sem testar nada)

**Trecho:**

```js
test('deve falhar ao criar usuário menor de idade', () => {
  try {
    userService.createUser('Menor', 'menor@email.com', 17);
  } catch (e) {
    expect(e.message).toBe('O usuário deve ser maior de idade.');
  }
});
```

**Por que é um mau cheiro / risco:**
Este é talvez o smell mais perigoso da suíte: o teste **passa silenciosamente caso a exceção nunca seja lançada**. Se alguém remover a validação de idade do `userService`, o teste continua verde porque o `catch` nunca é executado e nenhum `expect` falha. O assert está condicionado à existência do erro — exatamente o oposto do que precisamos. O correto é usar `expect(() => ...).toThrow(...)`, que falha tanto quando a exceção tem mensagem errada quanto quando ela simplesmente não é lançada.

---

## 4. Fragile Test (Teste Frágil acoplado ao formato de saída)

**Trecho:**

```js
test('deve gerar um relatório de usuários formatado', () => {
  const usuario1 = userService.createUser('Alice', 'alice@email.com', 28);
  userService.createUser('Bob', 'bob@email.com', 32);

  const relatorio = userService.generateUserReport();

  const linhaEsperada = `ID: ${usuario1.id}, Nome: Alice, Status: ativo\n`;
  expect(relatorio).toContain(linhaEsperada);
  expect(relatorio.startsWith('--- Relatório de Usuários ---')).toBe(true);
});
```

**Por que é um mau cheiro / risco:**
O teste depende da **string exata** do relatório, incluindo separadores, espaços, vírgulas e quebra de linha. Qualquer alteração estética inofensiva (trocar vírgula por `|`, mudar a ordem dos campos, internacionalizar o cabeçalho) quebra o teste mesmo que o comportamento de negócio esteja correto. O ideal é verificar **comportamentos observáveis** (o relatório contém o nome do usuário, contém o status, lista todos os usuários cadastrados) sem amarrar-se ao formato textual exato.

---

## 5. Skipped Test (Teste pulado / TODO esquecido)

**Trecho:**

```js
test.skip('deve retornar uma lista vazia quando não há usuários', () => {
  // TODO: Implementar este teste depois.
});
```

**Por que é um mau cheiro / risco:**
`test.skip` cria a ilusão de cobertura: o teste aparece no relatório como "skipped", mas nunca executa. Costuma virar dívida técnica esquecida — o caso "lista vazia" continua sem cobertura indefinidamente. Esse smell é capturado pela regra `jest/no-disabled-tests`. Ou se implementa o teste agora, ou se remove o stub.

---

## Resumo

| # | Smell | Regra ESLint correspondente |
|---|-------|-----------------------------|
| 1 | Eager Test | (detecção manual — sem regra direta) |
| 2 | Conditional Test Logic | `jest/no-conditional-expect` |
| 3 | Assert condicional em try/catch | `jest/no-conditional-expect` |
| 4 | Fragile Test (acoplamento a formato) | (detecção manual) |
| 5 | Skipped Test | `jest/no-disabled-tests` |
