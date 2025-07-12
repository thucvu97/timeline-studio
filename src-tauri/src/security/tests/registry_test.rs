#[cfg(test)]
mod tests {
  use crate::command_registry::CommandRegistry;
  use crate::security::registry::SecurityCommandRegistry;

  #[test]
  fn test_security_command_registry_trait_implementation() {
    // Проверяем что SecurityCommandRegistry корректно реализует CommandRegistry trait
    fn assert_command_registry<T: CommandRegistry>() {}
    assert_command_registry::<SecurityCommandRegistry>();
  }
}
