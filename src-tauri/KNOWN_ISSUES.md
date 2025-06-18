# Known Issues

## Mutex Lock Failed Error After Tests

### Issue
After all tests pass successfully, you may see:
```
test result: ok. 360 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out
libc++abi: terminating due to uncaught exception of type std::__1::system_error: mutex lock failed: Invalid argument
error: test failed, to rerun pass `--lib`
SIGABRT: process abort signal
```

### Status
This is a **known issue** that occurs during process cleanup on macOS after all tests have completed successfully. It does not affect:
- Test results (all tests pass before the error)
- Application functionality
- Code coverage generation

### Root Cause
The error occurs due to Rust's undefined static destructor order during process termination. Some static variables in dependencies try to access pthread mutexes that have already been destroyed by the OS.

### Workaround
The GitHub Actions workflow (`coverage.yml`) has been updated to:
1. Detect when tests pass successfully
2. Recognize this specific error pattern
3. Continue with coverage upload when this error occurs after successful tests

### Long-term Solution
We've migrated to Tauri's proper state management pattern (`language_tauri.rs`) which avoids global static mutexes. However, some dependencies may still use static mutexes that cause this issue.

### What You Should Do
- **For local development**: Ignore this error if your tests pass
- **For CI/CD**: The workflow already handles this automatically
- **For production**: This error only occurs in test environments and doesn't affect the built application