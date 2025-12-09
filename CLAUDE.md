# Instructions for Claude Code

This document contains critical instructions for Claude Code when working on the VTT (Virtual Table Top) project.

---

# PROJECT INFRASTRUCTURE

## Database Credentials
- **PostgreSQL Container**: `trading_platform_db`
- **Username**: `claude`
- **Password**: `Claude^YV18`
- **VTT Database**: `vtt`
- **Connection String**: `postgresql://claude:Claude^YV18@localhost:5432/vtt`

## Redis
- **Container**: `trading_platform_redis`
- **URL**: `redis://localhost:6379`

## Docker Deployment (CRITICAL)

**All testing and verification is done in Docker.** After any code changes:

1. **Build and deploy to Docker**:
   ```bash
   docker-compose up -d --build
   ```

2. **Verify containers are running**:
   ```bash
   docker-compose ps
   ```

3. **Check logs for errors**:
   ```bash
   docker-compose logs --tail=50 server
   docker-compose logs --tail=50 web
   ```

**Important**: Changes are NOT considered complete until they are deployed to Docker and verified working. The dev server (`pnpm run dev`) is for development convenience only - final testing must be in Docker.

### Docker Services
- **vtt_server**: Backend API (port 3000 internal)
- **vtt_web**: Frontend (port 5173 internal)
- **vtt_nginx**: Reverse proxy (ports 80, 443 external)
- **vtt_db**: PostgreSQL database
- **vtt_redis**: Redis cache

### Persistent Volumes
- `postgres_data`: Database storage
- `uploads_data`: User uploaded assets (images, etc.)

---

# UNIVERSAL INSTRUCTIONS

These guidelines apply when working on this project.

---

## Autonomous Execution Policy

Work **autonomously and uninterrupted** until:
1. **Task fully complete** (all criteria met, committed as LAST action)
2. **Token budget ~75%** (execute handoff per Session Management section)
3. **Blocking decision required** (genuine ambiguity only)

### Empowerment

**Make decisions on**: Implementation details, technology within patterns, code structure, test strategy, documentation format. Search session notes for guidance.

**Stop for**: Conflicting requirements, scope expansion, breaking architecture changes, security policy decisions.

**Rule**: If you can research or apply professional judgment, DO IT. Don't ask permission for domain expertise. Be consistant with documentation and existing codebase.

---

## Agent-Centric Workflow (MANDATORY)

**Main context = orchestration only. ALL implementation delegated to agents.**

### Main Context Thread Responsibilities

1. **Track Work**: Maintain todo list of work to be completed
2. **Orchestrate Delegation**: Delegate work to instanced agents (via Task tool)
   - Launch agents in parallel when tasks are independent
   - Launch agents serially when tasks have dependencies
3. **Update Documentation**:
   - Update session notes after each agent completes
   - Update roadmap as milestones are reached
4. **User Interaction**: Get input from user when required

### What Should Be Delegated to Agents

**ALL work except main thread responsibilities**, including:
- Code exploration and analysis
- Implementation of features or fixes
- Writing tests
- Running tests and diagnosing failures
- Refactoring code
- Researching best practices or solutions
- File searching and content analysis
- Any task requiring >5 tool calls
- Any task that would consume >2k tokens in main context

### Pre-Task Checklist

Before ANY work:
- >5 tool calls? → **Delegate to agent**
- About to diagnose/fix/implement? → **Delegate to agent**
- Reading multiple files to understand? → **Delegate to agent**
- Managing todos, updating notes, launching agents? → **Do in main context**

**Rule**: If thinking "I'll just quickly...", delegate it instead.

### Session Notes Updates (MANDATORY)

After each agent completes:
1. Read the agent's final report
2. Update session notes with:
   - What the agent was asked to do
   - What the agent accomplished
   - Key findings or decisions
   - Any issues encountered
   - What needs to happen next
3. Update todo list based on agent results
4. Launch next agent or set of agents

---

## Task Completion Workflow

**Every single change** MUST complete ALL of these steps:

```
┌─────────────────────────────────────────────────────────────────┐
│  UNIVERSAL TASK COMPLETION CHECKLIST                            │
├─────────────────────────────────────────────────────────────────┤
│  1. [ ] Create todo list for the task                           │
│  2. [ ] Delegate implementation work to instanced agent(s)      │
│  3. [ ] Verify changes work correctly                           │
│  4. [ ] Commit changes (pre-commit hooks MUST pass)             │
│  5. [ ] Push to GitHub (resolve ALL errors - NO bypassing)      │
│  6. [ ] Deploy to Docker: docker-compose up -d --build          │
│  7. [ ] Verify Docker container starts and runs correctly       │
│  8. [ ] Document changes in session notes                       │
│  9. [ ] Mark todo items complete                                │
└─────────────────────────────────────────────────────────────────┘
```

### Mandatory Rules

1. **ALL work uses todo lists**: Even "trivial" changes get tracked
2. **ALL implementation delegated to agents**: Main context orchestrates only
3. **NO bypassing pre-commit hooks**: Fix errors, don't skip them
4. **NO ignoring push errors**: Resolve them properly
5. **NO skipping Docker deployment**: Every change must be deployed and verified
6. **Task is NOT complete until Docker is rebuilt and running**
7. **ALL changes documented**: Session notes must be updated after Docker deployment

### The Five Completion Gates

**Gate 1: Commit** - Pre-commit hooks pass
```bash
git add <files>
git commit -m "type(scope): description"
# If hooks fail → FIX THE ERRORS, don't bypass
```

**Gate 2: Push** - GitHub accepts the push
```bash
git push origin main
# If push fails → RESOLVE THE ERROR
```

**Gate 3: Docker Build** - Container builds successfully
```bash
docker-compose up -d --build
# If build fails → FIX THE BUILD ERROR
```

**Gate 4: Docker Run** - Container runs without errors
```bash
docker-compose logs -f app
# Verify: Container starts, no crash loops, app accessible
```

**Gate 5: Session Notes** - Changes documented
```bash
# Update docs/session_notes/[current-session].md
```

---

## Token Budget Management & Session Handoff

### Threshold-Based Actions

| Token Usage | Threshold | Actions Required |
|-------------|-----------|------------------|
| < 140,000 (70%) | Normal | Continue autonomous work |
| 140,000-150,000 (70-75%) | Yellow | Wrap up current sub-task, monitor closely |
| 150,000-160,000 (75-80%) | Orange | **Stop starting new work**, complete current task, begin handoff |
| > 160,000 (80%+) | Red | **STOP ALL NEW WORK**, execute handoff NOW |

### Session Handoff Procedure

Execute at 75-80% token usage:

1. **Complete Current Task Only** - Don't start new tasks
2. **Document Everything** - Update session notes with comprehensive notes
3. **Update Todo List** - Mark completed, leave in-progress clearly marked
4. **Notify User (MANDATORY)**:
```
⚠️ TOKEN BUDGET ALERT (X% used)

Session notes saved to: docs/session_notes/[filename].md

**What's Complete**: [Brief list]
**What's Pending**: [Brief list]

Please clear the chat context and say "Continue" to resume.
```
5. **Stop and Wait** - Do NOT continue working

---

## Session Resumption Protocol

**Trigger Phrase**: "Please resume session work"

When user starts with this phrase:

1. **Locate Latest Session Notes** - Scan `docs/session_notes/` for most recent file
2. **Restore Context** - Read entire latest session notes, review status and next steps
3. **Resume Work Autonomously**:
   - Review agent-centric workflow
   - **Do not ask** for confirmation unless session notes indicate user input required
   - Pick up from where previous session ended
4. **Provide Brief Status**:
```
Session restored from [filename]
Status: [X/Y tasks complete]
Current: [what you're about to work on]
Resuming work...
```

**Important**:
- **Do NOT ask** "Should I continue?" or "What would you like me to do?"
- **Do NOT wait** for further instructions
- **DO immediately start** working on the next pending task

---

## Session Notes Documentation

**Location**: `docs/session_notes/`
**File Naming**: `YYYY-MM-DD-[four-digit-session-ID]-[Topic-Description].md`

### When to Write (MANDATORY)

- Token budget reaches 75-80% (highest priority)
- User explicitly requests session notes
- Context needs to be cleared
- Significant troubleshooting or investigation performed
- Major implementations completed
- End of work session

### What to Include

1. **Session Summary**: Brief overview of goals and outcomes
2. **Problems Addressed**: Symptoms, root causes, investigations
3. **Solutions Implemented**: What was built/fixed, how it works
4. **Files Created/Modified**: List with brief descriptions
5. **Testing Results**: Build status, test results, validation
6. **Current Status**: What's complete, what's in progress
7. **Pending User Action**: What the user needs to do next
8. **Next Steps**: Clear guidance for continuing work
9. **Key Learnings**: Important insights or decisions

---

## Development Guidelines

### Debug Code Protection (CRITICAL)

**NEVER remove or disable debug code without explicit user permission.**

This includes:
- Debug logging statements (console.log, console.warn, etc.)
- Debug flags (DEBUG_*, ENABLE_*, etc.)
- Debug tracking variables and Maps
- Diagnostic helper functions
- Performance monitoring code
- State inspection utilities

**Why this matters**: Debug code is often added during active troubleshooting. Removing it without permission:
- Loses valuable diagnostic capability during ongoing investigations
- Forces re-implementation when issues resurface
- Wastes user time explaining what was already working

**Correct behavior**:
- Keep all debug code intact unless user explicitly requests removal
- If debug code seems excessive, ASK before removing
- When fixing bugs, ADD debug code as needed, never remove existing

### Code Style
- Type hints throughout, docstrings for public methods
- Follow PEP 8, keep functions focused and small
- Prefer composition over inheritance
- Comments explain "why", not "what"

### Testing
- 80% coverage minimum (100% for critical paths)
- Tests alongside features (TDD preferred)
- Fast, Isolated, Repeatable tests
- Test behavior, not implementation

### Testing Best Practices

**Test Structure** - Follow AAA Pattern (Arrange-Act-Assert):
```python
def test_tokenizer_handles_special_characters():
    # Arrange - Set up test data
    tokenizer = Tokenizer()
    text = "Hello <|special|> world"

    # Act - Execute the behavior being tested
    tokens = tokenizer.encode(text)

    # Assert - Verify the outcome
    assert len(tokens) > 0
    assert tokenizer.decode(tokens) == text
```

**Naming** - Test names should describe scenario and expected outcome:
```python
def test_model_loader_raises_error_for_missing_file():
    pass

def test_generation_stops_at_max_tokens():
    pass
```

**Independence** - Each test should:
- Run in isolation
- Not depend on other tests
- Clean up after itself
- Be able to run in any order

**Mocking** - Mock only external dependencies:
```python
# GOOD - Mock external API or heavy resources
mocker.patch('module.download_model', return_value=mock_model)

# BAD - Over-mocking internal methods
mocker.patch('module.tokenize')
mocker.patch('module.format_output')
mocker.patch('module.apply_settings')
```

### Testing Troubleshooting

**Common Issues**:

1. **`RuntimeError: Event loop is closed`** - Check conftest.py has Windows event loop policy
2. **`relation does not exist`** - Run migrations on test database
3. **`ImportError: No module named`** - Run `poetry install` or set PYTHONPATH
4. **Fixture not found** - Check fixture in correct conftest.py
5. **Slow tests** - Run with `pytest -n auto`, mock slow operations

**Debugging**:
```bash
# Verbose mode
pytest tests/path/to/test.py -v -s

# Run single test
pytest tests/path/test_file.py::test_function

# Check coverage
pytest --cov=src --cov-report=term-missing
```

---

## Git Commit Requirements

### Pre-Commit Checklist
- [ ] Every modified file in `src/` has tests in `tests/`
- [ ] Every new function/method has at least one test
- [ ] Every bug fix has a test that would have caught the bug
- [ ] Test coverage meets minimum 80% threshold
- [ ] All tests pass

### Commit Message Standards

Use conventional commit format:
```
<type>(<scope>): <description>

[optional body]
```

**Types**: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`

**Example**:
```
fix(websocket): Add heartbeat subscription to prevent reconnects

- Added heartbeat channel subscription
- Implemented gap detection system
- Added 15 tests for gap tracking
- All tests passing (47/47)
```

### What NOT to Commit

- Code without tests
- Code with failing tests
- Code with <80% coverage
- Temporary debug files
- API keys or secrets
- `.env` files with real credentials
- `logs/` folder
- `tmp/` folder

---

## File Organization Rules

### Core Principle

**The root directory should contain ONLY:**
- Essential project configuration files
- Main application entry points
- Core project documentation (CLAUDE.md, README.md)

**All other files MUST be placed in appropriate subdirectories.**

### File Placement Rules

| File Type | Destination |
|-----------|-------------|
| Implementation reports | `docs/reports/` |
| Guides & references | `docs/guides/` |
| Session notes | `docs/session_notes/` |
| Architecture docs | `docs/architecture/` |
| Test scripts | `scripts/testing/` |
| Diagnostic scripts | `scripts/diagnostics/` |
| Utility scripts | `scripts/utilities/` |
| Log files | `logs/` |
| Application configs | `config/` |

### Exceptions (must remain in root)
- `CLAUDE.md` - AI assistant instructions
- `README.md` - Project overview
- `pyproject.toml`, `package.json` - Project configs
- Main entry points (e.g., `run_webui.py`)

### Never in Root
- Test scripts (`test_*.py`)
- Log files (`*.log`)
- Documentation (`*_REPORT.md`, `*_GUIDE.md`)
- Diagnostic scripts (`check_*.py`, `verify_*.py`)

---

## Session-End Checklist

### BEFORE ENDING EVERY SESSION:

1. **Update Session Notes** (`docs/session_notes/`)
   - Date and session focus
   - Key decisions made and rationale
   - Problems solved and solutions
   - Files created/modified
   - Current status and next steps

2. **Update Project Documentation** (if applicable)
   - Architecture changes → `docs/architecture/`
   - Database schema → `DATABASE_DESIGN.md`
   - Implementation plan → `PROJECT_OUTLINE.md`

3. **Document Any New Dependencies**
   - Update `pyproject.toml` or `requirements.txt`

✅ **DID YOU UPDATE `docs/session_notes/`?** This is mandatory.

---

**Last Updated**: 2025-12-09
