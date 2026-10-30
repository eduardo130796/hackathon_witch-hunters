import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'eslint.config.mjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // console.error fica só no error.middleware e console.info só no aviso de inicialização.
      'no-console': ['error', { allow: ['error', 'info'] }],
      // O Express 4 exige 4 parâmetros no handler de erro, mesmo sem usar o último.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Controllers async já capturam erros com try/catch e repassam para next(), então
      // entregá-los ao Router (que espera retorno void) não deixa promessa rejeitada solta.
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false } },
      ],
    },
  },
  prettier,
);
