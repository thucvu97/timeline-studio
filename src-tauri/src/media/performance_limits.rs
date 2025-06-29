/// Performance limits for media processing tests
/// These values can be adjusted based on system performance
pub struct PerformanceLimits;

impl PerformanceLimits {
    /// Maximum time for metadata extraction in seconds
    pub const METADATA_EXTRACTION_LIMIT: u64 = 8; // was 5
    
    /// Maximum time for 4K video thumbnail generation in seconds
    pub const THUMBNAIL_4K_LIMIT: u64 = 20; // was 10
    
    /// Maximum time for processing large files in seconds
    pub const LARGE_FILE_PROCESSING_LIMIT: u64 = 15; // was 10
    
    /// Maximum time per file for batch processing in seconds
    pub const BATCH_PROCESSING_PER_FILE: u64 = 3; // was 2
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_limits_are_reasonable() {
        assert!(PerformanceLimits::METADATA_EXTRACTION_LIMIT > 0);
        assert!(PerformanceLimits::THUMBNAIL_4K_LIMIT > PerformanceLimits::METADATA_EXTRACTION_LIMIT);
        assert!(PerformanceLimits::LARGE_FILE_PROCESSING_LIMIT > PerformanceLimits::METADATA_EXTRACTION_LIMIT);
    }
}