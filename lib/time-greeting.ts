/** The viewer's local hour, independent of the presentation's reporting timezone. */
export function timeGreeting(hour: number) {
  if (hour >= 5 && hour < 10) return "Good morning";
  if (hour >= 10 && hour < 17) return "Hello";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
}
