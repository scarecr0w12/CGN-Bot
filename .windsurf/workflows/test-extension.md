---
description: Validate and test bot extensions in the sandbox environment
---

# Test Extension

## Overview
Extensions run in an isolated sandbox (isolated-vm). This workflow helps validate extension code before publishing.

## Steps

1. Review the extension manager for sandbox constraints:
// turbo
```bash
head -100 /root/bot/Internals/Extensions/ExtensionManager.js
```

2. Check extension API available to sandboxed code:
// turbo
```bash
ls -la /root/bot/Internals/Extensions/API/
```

3. Validate extension code structure - must export these handlers:
```javascript
// Required exports for extensions
module.exports = {
    name: "extension-name",
    version: "1.0.0",
    
    // Event handlers (optional)
    onMessage: async (context) => { },
    onMemberJoin: async (context) => { },
    onMemberLeave: async (context) => { },
    
    // Command handlers (optional)  
    commands: {
        "mycommand": async (context, args) => { }
    }
};
```

4. Check for common sandbox violations:
// turbo
```bash
# These are NOT allowed in extensions:
# - require() or import statements
# - Access to process, fs, child_process
# - Network requests without API wrapper
# - setTimeout/setInterval (use provided alternatives)
echo "Review extension for prohibited patterns"
```

5. Test extension via the web gallery:
   - Navigate to Dashboard → Extensions → My Extensions
   - Use the "Test" button to run in sandbox
   - Check console output for errors

6. Review extension logs after testing:
// turbo
```bash
docker logs skynetbot 2>&1 | grep -i "extension" | tail -20
```

## Common Issues

- **Timeout errors**: Extensions have a 5-second execution limit
- **Memory errors**: Extensions are limited to 128MB memory
- **API errors**: Check available API methods in `Internals/Extensions/API/`
