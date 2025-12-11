---
trigger: always_on
description: Guidelines for utilizing the Memory MCP knowledge graph to store and retrieve system information.
globs: **/*
---

# Memory Knowledge Graph Usage

The project uses a persistent Memory MCP knowledge graph to store system architecture, subsystem details, bug fixes, and key implementation patterns.

## When to Read from Memory

- **Start of new tasks:** Query relevant entities before making changes
- **Debugging:** Check "Known Bug Fixes" entity for documented issues
- **Architecture questions:** Search for subsystem entities by name
- **Integration work:** Check relations between subsystems

```javascript
// ✅ DO: Search for relevant context before implementation
mcp5_search_nodes({ query: "Extension System" })
mcp5_open_nodes({ names: ["Known Bug Fixes", "Database System"] })

// ❌ DON'T: Start implementation without checking existing knowledge
```

## When to Write to Memory

- **Bug fixes:** Add to "Known Bug Fixes" observations
- **New subsystems:** Create new entity with path, importance score, key observations
- **Architecture changes:** Update affected entity observations
- **New integrations:** Add relations between entities

```javascript
// ✅ DO: Document significant fixes
mcp5_add_observations({
  observations: [{
    entityName: "Known Bug Fixes",
    contents: ["Description of bug and fix pattern"]
  }]
})

// ✅ DO: Create entities for new subsystems
mcp5_create_entities({
  entities: [{
    name: "New Subsystem",
    entityType: "Subsystem",
    observations: ["Path: path/to/code", "Key functionality", "Importance Score: XX"]
  }]
})
```

## Entity Types

| Type | Usage |
|------|-------|
| **Project** | Root-level project info (CGN-Bot) |
| **Subsystem** | Major code modules with importance scores |
| **Feature** | Specific features within subsystems |
| **Reference** | Documentation, bug fixes, entry points |
| **System** | Configuration and infrastructure |

## Relation Types

- **contains** - Parent contains child subsystem
- **uses** - Subsystem depends on another
- **integrates_with** - Two-way integration
- **extends** - Subsystem extends another's functionality
- **gated_by** - Feature access controlled by another
- **serves** - Provides functionality to another
- **manages** - Administrative control over another
- **documented_in** - Reference documentation

## Key Entities to Query

- `CGN-Bot` - Project overview and entry points
- `Known Bug Fixes` - Documented issues and solutions
- `Key Entry Points` - Main files (master.js, SkynetBot.js, etc.)
- `Database System` - Query patterns (.exec(), .limit())
- Subsystems by name for implementation details

## Best Practices

- **Keep observations atomic:** One fact per observation
- **Include file paths:** Always note `Path: path/to/code`
- **Score importance:** Add `Importance Score: XX` for subsystems
- **Update, don't duplicate:** Use `mcp5_add_observations` for existing entities
- **Verify before writing:** Use `mcp5_search_nodes` to check if entity exists