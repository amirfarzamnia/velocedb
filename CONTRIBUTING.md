# Contributing to VeloceDB

Thank you for your interest in contributing to VeloceDB! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## How to Contribute

### 1. Reporting Issues

- Use the GitHub issue tracker to report bugs or suggest features
- Check existing issues before creating a new one
- Provide detailed information about the issue:
  - Steps to reproduce
  - Expected behavior
  - Actual behavior
  - Environment details (Node.js version, OS, etc.)
  - Error messages or logs

### 2. Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/amirfarzamnia/velocedb.git
   cd velocedb
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### 3. Making Changes

- Follow the existing code style and patterns
- Write clear, concise commit messages
- Update documentation as needed

### 4. Documentation

- Update README.md for significant changes
- Add JSDoc comments for new functions and classes
- Update TypeScript type definitions if needed
- Keep examples up to date

### 5. Submitting Changes

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Create a Pull Request (PR) from your fork to the main repository
3. Provide a clear description of your changes
4. Reference any related issues
5. Wait for review and address any feedback

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the project's ESLint configuration
- Use meaningful variable and function names
- Keep functions focused and single-purpose
- Add appropriate comments for complex logic

### Documentation Guidelines

- Keep documentation up to date
- Use clear and concise language
- Include examples where helpful
- Document all public APIs
- Update type definitions for new features

### Performance Considerations

- Consider performance implications of changes
- Profile code for potential bottlenecks
- Optimize critical paths
- Document performance trade-offs

## Review Process

1. PRs will be reviewed by maintainers
2. Feedback will be provided within a reasonable timeframe
3. Changes may be requested before merging
4. Documentation must be up to date

## Questions?

If you have questions about contributing, please:

1. Check the existing documentation
2. Search existing issues
3. Create a new issue if needed

Thank you for contributing to VeloceDB!
