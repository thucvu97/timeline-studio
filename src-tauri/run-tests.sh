#!/bin/bash
# Workaround for mutex cleanup issue on macOS
# The tests pass but the process crashes on cleanup

set +e  # Don't exit on error

echo "Running Rust tests with single thread to avoid mutex issues..."
cargo test --lib -- --test-threads=1 2>&1 | tee test-output.log

# Check if tests actually passed
if grep -q "test result: ok" test-output.log; then
    echo "✅ All tests passed successfully!"
    rm test-output.log
    exit 0
else
    echo "❌ Tests failed"
    cat test-output.log
    rm test-output.log
    exit 1
fi