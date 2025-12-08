# Contributing to AvaAgent

Thank you for your interest in contributing to AvaAgent! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Prioritize the community's best interests

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- uv (Python package manager)
- Docker & Docker Compose
- Foundry (for smart contracts)

### Setting Up Development Environment

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/avaagent.git
cd avaagent
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start the development environment**

```bash
# Using Docker (recommended)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or manually:
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Contracts
cd contracts
forge build
```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/wallet-connect`)
- `fix/` - Bug fixes (e.g., `fix/auth-redirect`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(agents): add multi-chain support for trading agents
fix(wallet): resolve connection timeout on Fuji network
docs(readme): update installation instructions
```

## Pull Request Process

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature
```

2. **Make your changes**
   - Write tests for new functionality
   - Update documentation as needed
   - Ensure all tests pass

3. **Run quality checks**
```bash
# Frontend
cd frontend
npm run lint
npm run typecheck
npm run test

# Backend
cd backend
uv run ruff check .
uv run mypy app
uv run pytest

# Contracts
cd contracts
forge test
forge fmt --check
```

4. **Push and create PR**
```bash
git push origin feature/your-feature
```
Then create a Pull Request on GitHub.

5. **PR Requirements**
   - Link related issues
   - Describe changes clearly
   - Include screenshots for UI changes
   - Ensure CI passes

## Coding Standards

### TypeScript/JavaScript (Frontend)

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Implement proper error boundaries

```typescript
// Good
export function AgentCard({ agent }: { agent: Agent }) {
  const [isLoading, setIsLoading] = useState(false);
  // ...
}

// Avoid
export default function(props) {
  // ...
}
```

### Python (Backend)

- Follow PEP 8 with Ruff
- Use type hints for all functions
- Use async/await for I/O operations
- Document functions with docstrings

```python
# Good
async def get_agent(
    agent_id: str,
    db: AsyncSession
) -> Agent | None:
    """
    Retrieve an agent by ID.
    
    Args:
        agent_id: The unique identifier of the agent.
        db: Database session.
    
    Returns:
        The agent if found, None otherwise.
    """
    ...

# Avoid
def get_agent(id, db):
    ...
```

### Solidity (Smart Contracts)

- Follow Solidity style guide
- Use NatSpec for documentation
- Implement proper access control
- Add comprehensive tests

```solidity
/// @notice Creates a new agent wallet
/// @param owner The owner of the new wallet
/// @return walletAddress The address of the created wallet
function createWallet(address owner) external returns (address walletAddress) {
    // ...
}
```

## Testing Guidelines

### Frontend Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('AgentCard', () => {
  it('displays agent name', () => {
    render(<AgentCard agent={mockAgent} />);
    expect(screen.getByText(mockAgent.name)).toBeInTheDocument();
  });
});
```

### Backend Tests

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_agent(client: AsyncClient):
    response = await client.post("/api/v1/agents/", json={
        "name": "Test Agent",
        "type": "trading"
    })
    assert response.status_code == 201
    assert response.json()["name"] == "Test Agent"
```

### Smart Contract Tests

```solidity
function test_CreateWallet() public {
    address wallet = factory.createWallet(owner);
    assertEq(AgentWallet(wallet).owner(), owner);
}
```

## Documentation

- Update README.md for significant changes
- Add JSDoc/docstrings for public APIs
- Include inline comments for complex logic
- Update API documentation (OpenAPI/Swagger)

## Questions?

- Open a GitHub Discussion for questions
- Tag maintainers in issues
- Join our Discord community

Thank you for contributing to AvaAgent! 🚀
