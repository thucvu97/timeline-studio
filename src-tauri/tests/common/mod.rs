//! Common test utilities and setup
//!
//! This module provides common setup for all integration tests
//! to ensure proper cleanup and avoid mutex destructor issues.

use std::sync::Once;

static INIT: Once = Once::new();

/// Initialize test environment
///
/// Call this at the beginning of each test module to ensure
/// proper setup and cleanup of global resources.
pub fn init_tests() {
    INIT.call_once(|| {
        // Initialize logger for tests
        let _ = env_logger::builder()
            .is_test(true)
            .try_init();
        
        // Register cleanup handler
        register_cleanup();
        
        // Set test environment variables
        std::env::set_var("RUST_BACKTRACE", "1");
        std::env::set_var("TIMELINE_STUDIO_TEST_MODE", "1");
    });
}

/// Register cleanup handler for tests
fn register_cleanup() {
    // Register panic handler
    let original_panic = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |panic_info| {
        cleanup_before_exit();
        original_panic(panic_info);
    }));
    
    // Register process exit handler
    #[cfg(unix)]
    {
        extern "C" fn cleanup_handler(_: libc::c_int) {
            cleanup_before_exit();
        }
        
        unsafe {
            libc::signal(libc::SIGTERM, cleanup_handler as libc::sighandler_t);
            libc::signal(libc::SIGINT, cleanup_handler as libc::sighandler_t);
        }
    }
}

/// Cleanup function called before process exit
fn cleanup_before_exit() {
    // Signal all components to shutdown
    if let Ok(path) = std::env::current_exe() {
        if path.to_string_lossy().contains("test") {
            // We're in a test binary, initiate shutdown
            timeline_studio_lib::language::initiate_shutdown();
            
            // Give time for threads to see shutdown flag
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
    }
}

/// Test module macro that ensures proper initialization
#[macro_export]
macro_rules! test_module {
    () => {
        #[cfg(test)]
        mod test_setup {
            use super::*;
            
            #[ctor::ctor]
            fn init() {
                $crate::common::init_tests();
            }
        }
    };
}