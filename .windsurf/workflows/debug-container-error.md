---
description: Debug container errors and resolve them
auto_execution_mode: 3
---

Check through and resolve container errors.

## Steps

1. Check through container logs
2. Use the Sentry MCP Tool to check for open errors in Sentry
3. Resolve the errors
4. Repeat until all errors are resolved
5. Restart the container
6. Check if the error is resolved
7. If the error is resolved, continue to the next container
8. If the error is not resolved, repeat from step 1

## Notes

- If the error is not resolved, repeat from step 1
- If the error is resolved, continue to the next container
- If the error is not resolved, repeat from step 1
- Always check the container logs for any errors
- Always check the Sentry MCP Tool for open errors in Sentry
- Always restart the container if the error is not resolved
- Always check if the error is resolved after restarting the container
- Always continue to the next container if the error is resolved
- Always repeat from step 1 if the error is not resolved
- Always rebuild the container if code changes are made