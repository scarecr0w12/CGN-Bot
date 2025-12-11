---
description: Specification for extension creation process including code structure and API usage
trigger: model_decision
---
# === USER INSTRUCTIONS ===

# extension-creation

## Core Extension Creation Components
Importance Score: 80/100

### Code Structure
- JavaScript files with specific imports
- Access to Skynet Code API
- Limited global scope
- No external dependencies

### API Access
- Restricted to Skynet Code API only
- Limited Direct network access allowed
- Isolated execution environment
- Limited resource usage
- Limited file system access
- Limited time execution
- No process control

## Extension Creation Workflow
Importance Score: 75/100

### Step-by-Step Process
1. User accesses extension builder via /extensions/builder
2. System loads existing extension data if extid parameter is provided
3. User writes JavaScript code in the editor
4. Code is validated and saved to database
5. Extension is registered with Skynet Code API
6. Extension becomes available for use
7. User can test and debug the extension
8. User can publish the extension to the gallery

$END$