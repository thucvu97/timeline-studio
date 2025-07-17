# EventBus API Extensions for Event Priorities and Cancellation Support

## 📋 Task Description

**Status:** Planned  
**Priority:** Medium  
**Deadline:** July 15, 2025  
**Responsible:** Backend Team  

## 🎯 Goal

Extend the current EventBus API to support:
1. Event priorities (high, normal, low)
2. Event cancellation mechanism
3. Conditional event processing
4. Batch event processing

## 📝 Context

During Plugin API development, the need for more flexible event management was identified:
- Plugins should be able to cancel their operations
- Critical system events should be processed with priority
- Rollback mechanism is needed for batch operations

## 🔧 Technical Solution

### Event Structure Extension

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub event_type: String,
    pub data: Value,
    pub timestamp: u64,
    // New fields
    pub priority: EventPriority,
    pub cancellation_token: Option<CancellationToken>,
    pub source: EventSource,
    pub metadata: EventMetadata,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum EventPriority {
    Critical = 0,
    High = 1,
    Normal = 2,
    Low = 3,
}

#[derive(Debug, Clone)]
pub struct CancellationToken {
    pub token_id: String,
    pub is_cancelled: Arc<AtomicBool>,
}

#[derive(Debug, Clone)]
pub enum EventSource {
    System,
    Plugin(String),
    User,
    External,
}
```

### Priority Event Queue

```rust
use std::collections::BinaryHeap;

pub struct PriorityEventBus {
    event_queue: Arc<Mutex<BinaryHeap<PrioritizedEvent>>>,
    handlers: Arc<RwLock<HashMap<String, Vec<EventHandler>>>>,
    worker_handles: Vec<JoinHandle<()>>,
    shutdown_signal: Arc<AtomicBool>,
}

#[derive(Debug)]
struct PrioritizedEvent {
    event: Event,
    enqueue_time: Instant,
}

impl Ord for PrioritizedEvent {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // First by priority, then by time
        self.event.priority
            .cmp(&other.event.priority)
            .then_with(|| self.enqueue_time.cmp(&other.enqueue_time))
    }
}
```

### Event Cancellation API

```rust
impl EventBus {
    pub async fn publish_cancellable(
        &self,
        event_type: String,
        data: Value,
        priority: EventPriority,
    ) -> Result<CancellationToken> {
        let token = CancellationToken::new();
        let event = Event::new_with_cancellation(event_type, data, priority, token.clone());
        self.publish_event(event).await?;
        Ok(token)
    }

    pub async fn cancel_event(&self, token: &CancellationToken) -> Result<bool> {
        token.cancel();
        // Notify active handlers about cancellation
        self.notify_cancellation(token).await
    }

    pub async fn publish_batch(
        &self,
        events: Vec<Event>,
        rollback_on_error: bool,
    ) -> Result<BatchResult> {
        let batch_id = uuid::Uuid::new_v4().to_string();
        let mut results = Vec::new();
        
        for event in events {
            match self.publish_event(event).await {
                Ok(result) => results.push(result),
                Err(e) if rollback_on_error => {
                    // Rollback already processed events
                    self.rollback_batch(&batch_id).await?;
                    return Err(e);
                }
                Err(e) => return Err(e),
            }
        }
        
        Ok(BatchResult { batch_id, results })
    }
}
```

## 🏗️ Implementation Plan

### Phase 1: Basic Infrastructure (3 days)
- ✅ Extend Event structure with new fields
- ✅ Implement EventPriority and CancellationToken
- ✅ Create PriorityEventBus with priority queue
- ✅ Basic tests for new structures

### Phase 2: Priority Processing (2 days)
- ✅ Implement priority event queue
- ✅ Automatic sorting mechanism by priorities
- ✅ Worker threads for processing events of different priorities
- ✅ Performance metrics for priority events

### Phase 3: Cancellation System (3 days)
- ✅ Implement CancellationToken and cancellation mechanism
- ✅ Integration with existing event handlers
- ✅ Graceful shutdown for cancelled operations
- ✅ Rollback mechanisms for composite operations

### Phase 4: Batch Processing (2 days)
- ✅ API for batch event submission
- ✅ Atomic rollback for failed batches
- ✅ Optimization for large batches
- ✅ Performance monitoring for batch operations

### Phase 5: Plugin API Integration (2 days)
- ✅ Update PluginApi to support new features
- ✅ Documentation for plugin developers
- ✅ Usage examples for priorities and cancellation in plugins
- ✅ Backwards compatibility with existing plugins

### Phase 6: Testing and Optimization (2 days)
- ✅ Comprehensive integration tests
- ✅ Load testing with large number of events
- ✅ Performance benchmarks
- ✅ Profiling and bottleneck optimization

## 🧪 Completion Criteria

### Functional Requirements
- ✅ Events are processed in priority order
- ✅ Ability to cancel events via CancellationToken
- ✅ Batch submission with rollback on errors
- ✅ Backwards compatibility with existing EventBus API
- ✅ Thread-safe operations with priority queues

### Performance
- ✅ Priority overhead < 5% for normal events
- ✅ Event cancellation time < 10ms
- ✅ Throughput > 10,000 events/sec
- ✅ Memory usage optimized for large queues

### Code Quality
- ✅ Test coverage > 95%
- ✅ Documentation for all public APIs
- ✅ Usage examples for developers
- ✅ Integration with existing telemetry

## 🔗 Related Tasks

- **Plugin API Integration** - Uses extended EventBus
- **Performance Monitoring** - Metrics for priority events
- **Error Handling** - Rollback mechanisms integrate with error system

## 📚 Documentation

### API Reference
Complete documentation will be created for:
- EventPriority enum and its usage
- CancellationToken API and lifecycle
- Batch operations and rollback strategies
- Plugin integration examples

### Migration Guide
Migration guide for:
- Updating existing plugins
- Optimal use of priorities
- Best practices for batch operations

## 🚨 Risks and Mitigation

### Technical Risks
- **Performance**: Priority queues may slow processing
  - *Mitigation*: Benchmarks and profiling at each stage
- **Memory leaks**: CancellationTokens may accumulate
  - *Mitigation*: Automatic cleanup and timeout mechanisms
- **Race conditions**: Event cancellation during processing
  - *Mitigation*: Thorough testing of concurrent scenarios

### Integration Risks
- **Breaking changes**: Changes may break existing plugins
  - *Mitigation*: Strict backwards compatibility and API versioning
- **Complexity**: Additional complexity may hinder development
  - *Mitigation*: Good documentation and simple default values

## 📈 Expected Results

### For Plugin Developers
- Ability to create responsive plugins with operation cancellation
- Priority control for critical plugin operations
- Simplified work with batch operations

### For System
- Improved UI responsiveness through priority events
- More reliable error handling with rollback
- Better performance under high load

### Success Metrics
- 20% reduction in UI response time
- 90% reduction in "stuck" operations
- 30% increase in event throughput

---

*Created: June 25, 2025*  
*Last updated: June 25, 2025*  
*Version: 1.0.0*