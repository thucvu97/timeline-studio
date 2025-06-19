pub mod server;

#[cfg(test)]
mod tests;

pub use server::{start_video_server, VideoRegistrationResponse, VideoServerState};
