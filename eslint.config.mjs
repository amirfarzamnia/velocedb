import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended, prettier, {
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module'
        }
    },
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-empty': 'off',
        curly: 'warn'
    },
    settings: {
        environment: {
            node: true,
            es6: true,
            jest: true
        }
    }
});
