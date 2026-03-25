# AI System Prompt Enhancement Strategy

## Current State Analysis

### System Prompt Configuration
- **Current Limit**: 4,000 characters (max)
- **Default Prompt**: "You are a helpful AI assistant in a Discord server. Be concise, friendly, and helpful."
- **Location**: `serverDocument.config.ai.systemPrompt`
- **Storage**: MariaDB (serverAISchema.js)
- **UI**: `Web/views/pages/admin-ai-personality.ejs` with textarea (10 rows)

### Provider Context Windows

| Provider | Model | Context Window | Max Tokens |
|----------|-------|----------------|-----------|
| **OpenAI** | gpt-4o | 128,000 | 4,096 output |
| | gpt-4o-mini | 128,000 | 4,096 output |
| | gpt-4-turbo | 128,000 | 4,096 output |
| | gpt-4 | 8,192 | 2,048 output |
| **Anthropic** | claude-3-5-sonnet | 200,000 | 4,096 output |
| | claude-3-opus | 200,000 | 4,096 output |
| | claude-3-haiku | 200,000 | 4,096 output |
| **Groq** | llama-3.1-70b | 8,192 | 4,096 output |
| | mixtral-8x7b | 32,768 | 4,096 output |

### Current System Prompt Injection

**File**: `Modules/AI/AIManager.js` (lines 236-268)

```javascript
async buildContext (serverDocument, channelId, user, currentMessage = null) {
    const aiConfig = serverDocument.config.ai || {};
    const memoryConfig = aiConfig.memory || {};
    const vectorConfig = aiConfig.vectorMemory || {};

    // Get system prompt
    let systemPrompt = aiConfig.systemPrompt ||
        "You are a helpful AI assistant in a Discord server. Be concise and helpful.";

    // Inject vector memory context if enabled
    if (vectorConfig.enabled && vectorConfig.injectContext && currentMessage) {
        const vectorContext = await this.searchVectorMemory(...);
        if (vectorContext && vectorContext.length > 0) {
            const contextPrefix = vectorConfig.contextPrefix || "Relevant context from memory:";
            const contextText = vectorContext.map(m => `- ${m.content}`).join("\n");
            systemPrompt += `\n\n${contextPrefix}\n${contextText}`;
        }
    }

    const messages = [{ role: "system", content: systemPrompt }];
    // ... conversation history follows
}
```

**Current Flow**:
1. Base system prompt (4,000 char max)
2. Vector memory context injected (if enabled)
3. Conversation history appended
4. Sent to provider

## Enhancement Opportunities

### 1. Increase System Prompt Size Limit

**Current**: 4,000 characters
**Recommended**: 16,000-32,000 characters

**Rationale**:
- Modern LLMs have 128K-200K context windows
- System prompt should be 5-10% of context window
- Allows for detailed instructions, examples, and guidelines

**Implementation**:
```javascript
// serverAISchema.js
systemPrompt: {
    type: String,
    default: "You are a helpful AI assistant in a Discord server. Be concise, friendly, and helpful.",
    maxlength: 32000,  // Increased from 4000
}
```

**UI Update**:
```html
<!-- admin-ai-personality.ejs -->
<textarea name="systemPrompt" 
    class="textarea is-primary" 
    rows="25"  <!-- Increased from 10 -->
    maxlength="32000"  <!-- Updated -->
    placeholder="You are a helpful AI assistant...">
</textarea>
```

### 2. Structured System Prompt Templates

Create pre-built templates for common use cases:

**Templates to Add**:
- **Community Manager**: Moderation-focused, community engagement
- **Support Bot**: Customer service, FAQ integration
- **Creative Assistant**: Brainstorming, content generation
- **Technical Helper**: Code review, debugging, documentation
- **Gaming Bot**: Game knowledge, strategy, community events
- **Educational**: Teaching, explanations, learning support

**Storage**: New collection `aiPromptTemplates` with:
```javascript
{
    _id: ObjectId,
    key: "community_manager",
    name: "Community Manager",
    description: "Optimized for community engagement and moderation",
    category: "moderation",
    systemPrompt: "...",
    createdAt: Date,
    updatedAt: Date,
    isDefault: Boolean,
    tier: "starter" | "premium"
}
```

### 3. Dynamic Context Injection

Enhance the system prompt with server-specific context:

**Server Context to Inject**:
- Server name, member count, creation date
- Server roles and their purposes
- Channel structure and purposes
- Server rules/guidelines
- Custom commands available
- Enabled features/extensions
- Server language preference

**Implementation in AIManager.js**:
```javascript
async buildContext (serverDocument, channelId, user, currentMessage = null) {
    const aiConfig = serverDocument.config.ai || {};
    let systemPrompt = aiConfig.systemPrompt || DEFAULT_PROMPT;

    // Inject server context
    const serverContext = await this._buildServerContext(serverDocument, channelId);
    if (serverContext) {
        systemPrompt += `\n\n${serverContext}`;
    }

    // Inject vector memory context
    if (vectorConfig.enabled && vectorConfig.injectContext && currentMessage) {
        const vectorContext = await this.searchVectorMemory(...);
        if (vectorContext && vectorContext.length > 0) {
            systemPrompt += `\n\n${vectorConfig.contextPrefix}\n${vectorContext}`;
        }
    }

    return [{ role: "system", content: systemPrompt }, ...history];
}

async _buildServerContext (serverDocument, channelId) {
    const guild = this.client.guilds.cache.get(serverDocument._id);
    if (!guild) return null;

    const channel = guild.channels.cache.get(channelId);
    const rolesList = guild.roles.cache
        .filter(r => !r.isManaged() && r.id !== guild.id)
        .map(r => `- ${r.name}`)
        .join("\n");

    return `## Server Context
**Server**: ${guild.name} (${guild.memberCount} members)
**Channel**: ${channel?.name || "unknown"}
**Roles**: 
${rolesList}`;
}
```

### 4. Provider-Specific Optimizations

Tailor system prompts based on provider capabilities:

**OpenAI (gpt-4o)**:
- Supports 128K context
- Good at following detailed instructions
- Excels at structured outputs

**Anthropic (Claude)**:
- Supports 200K context
- Better at long-form reasoning
- Excellent at nuanced instructions

**Groq (Llama)**:
- Smaller context (8K-32K)
- Faster inference
- Needs concise prompts

**Implementation**:
```javascript
async buildContext (serverDocument, channelId, user, currentMessage = null) {
    const { providerName, model } = await this.resolveProviderAndModel(serverDocument);
    const aiConfig = serverDocument.config.ai || {};
    
    let systemPrompt = aiConfig.systemPrompt || DEFAULT_PROMPT;

    // Provider-specific optimizations
    if (providerName === "anthropic") {
        // Claude can handle longer, more detailed prompts
        systemPrompt = this._enhanceForClaude(systemPrompt, serverDocument);
    } else if (providerName === "groq") {
        // Groq needs concise prompts
        systemPrompt = this._compressForGroq(systemPrompt);
    }

    // ... rest of context building
}
```

### 5. System Prompt Versioning & History

Track system prompt changes for debugging and rollback:

**Schema Addition**:
```javascript
// serverAISchema.js
systemPromptHistory: [{
    version: Number,
    content: String,
    createdAt: Date,
    createdBy: String,  // User ID
    reason: String
}]
```

**Controller Update**:
```javascript
controllers.personality.post = async (req, res) => {
    const serverQueryDocument = req.svr.queryDocument;
    const oldPrompt = req.svr.document.config.ai?.systemPrompt;
    const newPrompt = req.body.systemPrompt?.substring(0, 32000) || "";

    if (oldPrompt !== newPrompt) {
        // Add to history
        serverQueryDocument.push("config.ai.systemPromptHistory", {
            version: (req.svr.document.config.ai?.systemPromptHistory?.length || 0) + 1,
            content: oldPrompt,
            createdAt: new Date(),
            createdBy: req.user.id,
            reason: req.body.reason || "Manual update"
        });
    }

    serverQueryDocument.set("config.ai.systemPrompt", newPrompt);
    save(req, res, true);
};
```

### 6. Advanced Prompt Engineering Features

**A. Few-Shot Examples in System Prompt**:
```javascript
systemPrompt += `

## Example Interactions:
User: "How do I set up a role?"
Assistant: "To set up a role, use the /role command...

User: "What are the server rules?"
Assistant: "Here are our server rules...`;
```

**B. Constraint Specification**:
```javascript
systemPrompt += `

## Constraints:
- Keep responses under 2000 characters (Discord limit)
- Use Discord formatting (bold, italics, code blocks)
- Reference server rules when appropriate
- Escalate to mods for rule violations`;
```

**C. Tone & Style Guidelines**:
```javascript
systemPrompt += `

## Tone & Style:
- Be friendly and approachable
- Use casual language appropriate for Discord
- Include relevant emojis when appropriate
- Avoid being overly formal or robotic`;
```

### 7. Dashboard UI Enhancements

**New Features**:
1. **Template Selector**: Dropdown to choose pre-built templates
2. **Template Preview**: Show full prompt before applying
3. **Character Counter**: Real-time count with visual indicator
4. **Prompt Analysis**: Show estimated token usage
5. **History Browser**: View and restore previous prompts
6. **Test Console**: Chat with AI using current prompt

**Implementation**:
```html
<!-- admin-ai-personality.ejs -->
<div class="field">
    <label class="label">Use Template</label>
    <div class="control">
        <select name="templateKey" id="templateSelect" class="input">
            <option value="">Custom Prompt</option>
            <option value="community_manager">Community Manager</option>
            <option value="support_bot">Support Bot</option>
            <!-- ... more templates ... -->
        </select>
    </div>
</div>

<div class="field">
    <label class="label">System Prompt & Instructions</label>
    <div class="control">
        <textarea name="systemPrompt" 
            id="systemPrompt"
            class="textarea is-primary" 
            rows="25" 
            maxlength="32000">
        </textarea>
    </div>
    <p class="help">
        <span id="charCount">0</span> / 32000 characters
        (~<span id="tokenEstimate">0</span> tokens)
    </p>
</div>

<div class="field">
    <label class="label">Change Reason (optional)</label>
    <div class="control">
        <input type="text" name="reason" class="input" 
            placeholder="e.g., 'Added moderation guidelines'">
    </div>
</div>

<div class="field">
    <label class="label">Prompt History</label>
    <div class="control">
        <select id="historySelect" class="input">
            <option value="">-- Current --</option>
            <!-- Populated from history -->
        </select>
    </div>
</div>
```

## Implementation Priority

### Phase 1 (High Priority)
1. Increase system prompt limit to 16,000 characters
2. Update UI textarea to 25 rows
3. Add character counter and token estimator
4. Update schema maxlength

### Phase 2 (Medium Priority)
1. Create system prompt templates
2. Add template selector UI
3. Implement server context injection
4. Add prompt history tracking

### Phase 3 (Low Priority)
1. Provider-specific optimizations
2. Advanced prompt engineering features
3. Test console for prompt validation
4. Prompt analytics and performance tracking

## Token Usage Estimation

**Formula**: `characters / 4 ≈ tokens` (rough estimate)

```javascript
// Helper function
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}

// In UI
document.getElementById('systemPrompt').addEventListener('input', (e) => {
    const chars = e.target.value.length;
    const tokens = Math.ceil(chars / 4);
    document.getElementById('charCount').textContent = chars;
    document.getElementById('tokenEstimate').textContent = tokens;
});
```

## Security Considerations

1. **Prompt Injection**: Validate system prompt doesn't contain malicious instructions
2. **Rate Limiting**: Apply to system prompt updates (prevent spam)
3. **Audit Trail**: Log all system prompt changes with user ID
4. **Tier Gating**: Limit prompt size by tier (starter: 8K, premium: 32K)
5. **Content Filtering**: Scan prompts for inappropriate content

## Backward Compatibility

- Existing prompts under 4,000 chars continue to work
- Default prompt remains unchanged
- No breaking changes to API or database schema
- Gradual migration of UI components

## Testing Recommendations

1. **Unit Tests**: Test token estimation accuracy
2. **Integration Tests**: Verify context building with large prompts
3. **Load Tests**: Test with maximum prompt size
4. **Provider Tests**: Test with each provider's context limits
5. **UI Tests**: Verify textarea behavior with large content

## Conclusion

The current 4,000 character limit significantly underutilizes the context windows available in modern LLMs. By increasing this limit to 16,000-32,000 characters and implementing structured templates and dynamic context injection, you can:

- **Improve AI Quality**: More detailed instructions lead to better responses
- **Enable Complex Use Cases**: Support moderation, support bots, and specialized assistants
- **Enhance User Experience**: Pre-built templates reduce setup friction
- **Maintain Flexibility**: Custom prompts still fully supported
- **Leverage Modern LLMs**: Use the full power of 128K-200K context windows
