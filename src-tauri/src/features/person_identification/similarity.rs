/// Вычисление косинусного сходства между двумя векторами
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
  if a.len() != b.len() {
    return 0.0;
  }

  let mut dot_product = 0.0;
  let mut norm_a = 0.0;
  let mut norm_b = 0.0;

  for i in 0..a.len() {
    dot_product += a[i] * b[i];
    norm_a += a[i] * a[i];
    norm_b += b[i] * b[i];
  }

  norm_a = norm_a.sqrt();
  norm_b = norm_b.sqrt();

  if norm_a == 0.0 || norm_b == 0.0 {
    return 0.0;
  }

  dot_product / (norm_a * norm_b)
}

/// Вычисление евклидова расстояния между двумя векторами
pub fn euclidean_distance(a: &[f32], b: &[f32]) -> f32 {
  if a.len() != b.len() {
    return f32::MAX;
  }

  let mut sum = 0.0;
  for i in 0..a.len() {
    let diff = a[i] - b[i];
    sum += diff * diff;
  }

  sum.sqrt()
}

/// Преобразование евклидова расстояния в сходство (0-1)
pub fn euclidean_to_similarity(distance: f32) -> f32 {
  1.0 / (1.0 + distance)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cosine_similarity() {
    let a = vec![1.0, 0.0, 0.0];
    let b = vec![1.0, 0.0, 0.0];
    assert_eq!(cosine_similarity(&a, &b), 1.0);

    let c = vec![0.0, 1.0, 0.0];
    assert_eq!(cosine_similarity(&a, &c), 0.0);
  }

  #[test]
  fn test_euclidean_distance() {
    let a = vec![0.0, 0.0];
    let b = vec![3.0, 4.0];
    assert_eq!(euclidean_distance(&a, &b), 5.0);
  }
}
