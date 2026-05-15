const { UserService } = require('../src/userService');

const DADOS_USUARIO_PADRAO = Object.freeze({
  nome: 'Fulano de Tal',
  email: 'fulano@teste.com',
  idade: 25,
});

const MENSAGEM_ERRO_MENOR_IDADE = 'O usuário deve ser maior de idade.';
const MENSAGEM_ERRO_CAMPOS_OBRIGATORIOS = 'Nome, email e idade são obrigatórios.';

describe('UserService — suíte refatorada (AAA)', () => {
  let userService;

  beforeEach(() => {
    // Arrange compartilhado: instância limpa e "banco" zerado a cada teste,
    // garantindo isolamento entre casos.
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    it('deve criar o usuário e retornar um id definido', () => {
      // Arrange
      const { nome, email, idade } = DADOS_USUARIO_PADRAO;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.id).toEqual(expect.any(String));
      expect(usuarioCriado.id.length).toBeGreaterThan(0);
    });

    it('deve criar o usuário com status "ativo" por padrão', () => {
      // Arrange
      const { nome, email, idade } = DADOS_USUARIO_PADRAO;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.status).toBe('ativo');
    });

    it('deve criar usuário não-admin por padrão quando flag não é informada', () => {
      // Arrange
      const { nome, email, idade } = DADOS_USUARIO_PADRAO;

      // Act
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Assert
      expect(usuarioCriado.isAdmin).toBe(false);
    });

    it('deve lançar erro ao tentar criar usuário menor de idade', () => {
      // Arrange
      const idadeMenorDeIdade = 17;
      const tentarCriarMenor = () =>
        userService.createUser('Menor', 'menor@email.com', idadeMenorDeIdade);

      // Act + Assert: o próprio matcher executa a função e verifica o throw,
      // garantindo que a ausência da exceção também faria o teste falhar.
      expect(tentarCriarMenor).toThrow(MENSAGEM_ERRO_MENOR_IDADE);
    });

    it('deve lançar erro quando o nome não é informado', () => {
      // Arrange
      const tentarCriarSemNome = () =>
        userService.createUser('', 'x@y.com', 30);

      // Act + Assert
      expect(tentarCriarSemNome).toThrow(MENSAGEM_ERRO_CAMPOS_OBRIGATORIOS);
    });
  });

  describe('getUserById', () => {
    it('deve recuperar o mesmo usuário previamente criado', () => {
      // Arrange
      const { nome, email, idade } = DADOS_USUARIO_PADRAO;
      const usuarioCriado = userService.createUser(nome, email, idade);

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado).toMatchObject({
        id: usuarioCriado.id,
        nome,
        email,
        idade,
        status: 'ativo',
      });
    });

    it('deve retornar null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-que-nao-existe';

      // Act
      const usuario = userService.getUserById(idInexistente);

      // Assert
      expect(usuario).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    it('deve desativar um usuário comum e retornar true', () => {
      // Arrange
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);

      // Act
      const resultado = userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(resultado).toBe(true);
    });

    it('deve marcar o status do usuário comum como "inativo" após desativar', () => {
      // Arrange
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);

      // Act
      userService.deactivateUser(usuarioComum.id);
      const usuarioAtualizado = userService.getUserById(usuarioComum.id);

      // Assert
      expect(usuarioAtualizado.status).toBe('inativo');
    });

    it('não deve desativar um usuário admin e deve retornar false', () => {
      // Arrange
      const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Act
      const resultado = userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(resultado).toBe(false);
    });

    it('deve manter o status do admin como "ativo" mesmo após tentativa de desativação', () => {
      // Arrange
      const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Act
      userService.deactivateUser(usuarioAdmin.id);
      const usuarioAtualizado = userService.getUserById(usuarioAdmin.id);

      // Assert
      expect(usuarioAtualizado.status).toBe('ativo');
    });

    it('deve retornar false ao tentar desativar um usuário inexistente', () => {
      // Arrange
      const idInexistente = 'id-que-nao-existe';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    it('deve indicar explicitamente quando não há usuários cadastrados', () => {
      // Arrange: nenhum usuário criado.

      // Act
      const relatorio = userService.generateUserReport();

      // Assert: verificamos comportamento observável (mensagem informativa),
      // sem depender do formato exato do cabeçalho.
      expect(relatorio).toContain('Nenhum usuário cadastrado');
    });

    it('deve incluir o nome de cada usuário cadastrado no relatório', () => {
      // Arrange
      userService.createUser('Alice', 'alice@email.com', 28);
      userService.createUser('Bob', 'bob@email.com', 32);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert: verifica comportamento (todos aparecem) e não o layout exato.
      expect(relatorio).toContain('Alice');
      expect(relatorio).toContain('Bob');
    });

    it('deve refletir o status atual do usuário no relatório', () => {
      // Arrange
      const usuario = userService.createUser('Alice', 'alice@email.com', 28);
      userService.deactivateUser(usuario.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('inativo');
    });
  });
});
