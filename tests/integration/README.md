# Integration Tests

This directory contains end-to-end integration tests that validate complete workflows across multiple system components.

## Test Coverage

### Command Flow (`CommandFlow.integration.test.js`)

**62 tests** covering end-to-end command execution:

- **Prefix Command Flow** (6 tests)
  - Command parsing and argument extraction
  - Quoted argument handling
  - Cooldown enforcement
  - Permission validation
  - Error handling

- **Slash Command Flow** (6 tests)
  - Command name validation
  - Option building and validation
  - Deferred replies
  - Follow-up messages
  - Guild/DM context validation

- **Permission Checks** (3 tests)
  - Bot permission validation
  - Role hierarchy enforcement
  - Self-targeting prevention

- **Response Handling** (4 tests)
  - Text and embed responses
  - Ephemeral messages
  - Reaction additions

- **Error Handling** (4 tests)
  - Command not found
  - Missing arguments
  - API errors
  - Timeouts

- **Context Validation** (2 tests)
  - Guild/DM context checks
  - Bot detection

### Extension Lifecycle (`ExtensionLifecycle.integration.test.js`)

**59 tests** covering extension installation, execution, and management:

- **Installation Flow** (6 tests)
  - Extension installation to server
  - State validation
  - Permission granting
  - Configuration initialization
  - Install count tracking
  - Duplicate prevention

- **Execution Flow** (6 tests)
  - Code loading
  - Context creation
  - Permission validation
  - Memory limits
  - Timeout enforcement
  - Result handling

- **Enable/Disable** (4 tests)
  - Disabling without uninstalling
  - Re-enabling
  - Execution prevention when disabled
  - Configuration preservation

- **Uninstallation** (3 tests)
  - Extension removal
  - Install count decrement
  - Data cleanup

- **Update Flow** (4 tests)
  - Version comparison
  - User data preservation
  - Breaking change detection
  - Version history tracking

- **Permission Management** (3 tests)
  - Permission requests
  - Permission revocation
  - Scope validation

- **Marketplace Features** (5 tests)
  - Category filtering
  - Tag filtering
  - Popularity sorting
  - Rating calculation
  - Premium extension handling

- **HTTP Allowlist** (2 tests)
  - Domain validation
  - Blocking non-allowlisted domains

- **Error Recovery** (2 tests)
  - Crash isolation
  - Auto-disable on repeated failures

### Database CRUD (`DatabaseCRUD.integration.test.js`)

**100 tests** covering database operations:

- **Create Operations** (5 tests)
  - User document creation
  - Nested configuration
  - Auto-generated IDs
  - Array field preservation
  - JSON field handling

- **Read Operations** (7 tests)
  - Find by ID
  - Null for non-existent
  - Query filtering
  - Find all with empty query
  - Result limiting
  - Async iteration
  - Complex nested queries

- **Update Operations** (5 tests)
  - Document updates
  - Null for non-existent
  - Nested field updates
  - Numeric increments
  - Array updates

- **Delete Operations** (3 tests)
  - Document deletion
  - Null for non-existent
  - Isolation from other documents

- **Transaction-like Operations** (3 tests)
  - Bulk creates
  - Rollback simulation
  - Concurrent updates

- **Data Validation** (4 tests)
  - Required fields
  - Field types
  - Enum fields
  - Array fields

- **Query Patterns** (5 tests)
  - Single field filtering
  - Multi-field filtering
  - Manual sorting
  - Pagination
  - Result counting

- **Real-world Scenarios** (4 tests)
  - User points transactions
  - Subscription management
  - Extension install tracking
  - Bulk user lookups

## Running Tests

```bash
# Run all tests (unit + integration)
npm run test:all

# Run only integration tests
npm run test:integration

# Run specific integration test file
npm test -- tests/integration/CommandFlow.integration.test.js

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Structure

Each integration test file follows this pattern:

```javascript
describe("Feature Integration Tests", () => {
  // Setup
  beforeEach(() => {
    // Initialize mocks and test data
  });

  afterEach(() => {
    // Cleanup
  });

  describe("Specific Flow", () => {
    it("should handle expected behavior", async () => {
      // Arrange
      const testData = createTestData();

      // Act
      const result = await executeFlow(testData);

      // Assert
      expect(result).toMatchExpectedOutcome();
    });
  });
});
```

## Mock Utilities

Integration tests use realistic mocks that mirror production behavior:

### `createMockClient()`
Creates a mock Discord.js client with:
- Application and user objects
- Guild and channel caches
- Command collections

### `createMockMessage(content, overrides)`
Creates a mock message object for prefix command testing:
- Author, guild, channel properties
- Reply, react, delete methods
- Customizable via overrides

### `createMockInteraction(commandName, options, overrides)`
Creates a mock interaction for slash command testing:
- Command name and options
- User, guild, channel properties
- Reply, defer, edit, followUp methods

### `MockModel`
Database model mock implementing custom ODM pattern:
- CRUD operations (create, find, update, delete)
- Query builder with limit() and exec()
- Async iterator support

## Best Practices

### 1. Test Independence
Each test should be fully independent:
```javascript
beforeEach(async () => {
  await Model._clear(); // Reset state
});
```

### 2. Realistic Scenarios
Test real-world workflows, not isolated functions:
```javascript
it("should complete user purchase flow", async () => {
  // Create user with points
  // Validate purchase cost
  // Deduct points
  // Apply purchase benefits
  // Verify final state
});
```

### 3. Error Paths
Test both success and failure cases:
```javascript
it("should handle insufficient funds gracefully", async () => {
  const user = await Users.create({ points: 10 });
  const cost = 50;
  
  // Attempt purchase with insufficient funds
  // Verify error is thrown
  // Verify points unchanged
});
```

### 4. Async/Await
Always use async/await for asynchronous operations:
```javascript
it("should wait for async operation", async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});
```

### 5. Mock Cleanup
Clean up mocks and timers:
```javascript
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});
```

## Coverage Goals

Target coverage levels:
- **Critical paths**: 80%+ (auth, payments, moderation)
- **Business logic**: 70%+ (commands, extensions)
- **Utilities**: 60%+ (helpers, formatters)

## Continuous Integration

Integration tests run on:
- Every pull request
- Before merges to main
- Nightly builds

Failed tests block deployment.

## Adding New Tests

When adding new integration tests:

1. **Create test file** in `tests/integration/`
2. **Follow naming convention**: `FeatureName.integration.test.js`
3. **Group related tests** with `describe()` blocks
4. **Use descriptive test names** starting with "should"
5. **Mock external dependencies** (Discord API, database)
6. **Test edge cases** and error conditions
7. **Update this README** with test count and coverage

## Debugging Failed Tests

```bash
# Run single test with verbose output
npm test -- tests/integration/CommandFlow.integration.test.js --verbose

# Run with debugger
node --inspect-brk node_modules/.bin/jest tests/integration/

# Show which tests ran
npm test -- --verbose --listTests
```

## Performance

Integration tests should complete quickly:
- Target: < 2 seconds total
- Use mocks instead of real API calls
- Parallelize independent tests
- Minimize setup/teardown overhead

Current performance:
```
Test Suites: 10 passed, 10 total
Tests:       221 passed, 221 total
Time:        ~1.8s
```

## Future Enhancements

- [ ] Add WebSocket connection tests
- [ ] Test shard communication patterns
- [ ] Add Redis cache integration tests
- [ ] Test database migration flows
- [ ] Add performance benchmarks
- [ ] Test rate limiting across shards
