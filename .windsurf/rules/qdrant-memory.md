---
trigger: always_on
description: Guidelines for utilizing Qdrant MCP for semantic memory storage and retrieval.
globs: **/*
---

# Qdrant Memory Usage

The project uses Qdrant MCP for semantic vector memory storage - ideal for natural language queries, user preferences, and contextual information that benefits from similarity search.

## When to Read from Qdrant

- **User context:** Find stored preferences, past decisions, or personal info
- **Semantic search:** Look up information by meaning, not exact match
- **Prior solutions:** Search for similar problems solved before
- **Conversation history:** Retrieve relevant past interactions

```javascript
// ✅ DO: Search for relevant context semantically
mcp0_qdrant-find({ 
  collection_name: "cgn-bot", 
  query: "user authentication flow" 
})

// ✅ DO: Look up user preferences
mcp0_qdrant-find({ 
  collection_name: "cgn-bot", 
  query: "dashboard configuration preferences" 
})

// ❌ DON'T: Use for structured entity lookups (use Memory MCP instead)
```

## When to Write to Qdrant

- **User preferences:** Store when user explicitly requests remembering something
- **Solution patterns:** Document working solutions to recurring problems
- **Configuration decisions:** Record why certain choices were made
- **Session context:** Save important context for future sessions

```javascript
// ✅ DO: Store explicit user requests
mcp0_qdrant-store({
  collection_name: "cgn-bot",
  information: "User prefers minimal console logging during development",
  metadata: { type: "preference", date: "2025-01-01" }
})

// ✅ DO: Document solution patterns
mcp0_qdrant-store({
  collection_name: "cgn-bot",
  information: "Fixed routing 404 by moving routes from general router to API router",
  metadata: { type: "fix", component: "web-routes" }
})

// ❌ DON'T: Store structured architecture data (use Memory MCP entities)
```

## Collection Names

| Collection | Usage |
|------------|-------|
| **cgn-bot** | Project-specific memories for CGN-Bot workspace |

## Qdrant vs Memory MCP

| Use Qdrant For | Use Memory MCP For |
|----------------|-------------------|
| Natural language queries | Structured entity lookups |
| User preferences | System architecture |
| Fuzzy/semantic search | Exact entity relations |
| Conversational context | Subsystem documentation |
| Solution patterns | Bug fix registry |

## Metadata Best Practices

Always include metadata for filtering and context:

```javascript
{
  type: "preference" | "fix" | "decision" | "context",
  component: "web" | "bot" | "database" | "extensions",
  date: "YYYY-MM-DD",
  importance: "low" | "medium" | "high"
}
```

## Best Practices

- **Be descriptive:** Write full sentences that capture context
- **Include metadata:** Always add type and component for filtering
- **Search first:** Check if similar memory exists before storing
- **Keep focused:** One concept per memory entry
- **Use for meaning:** Leverage semantic search for fuzzy lookups
