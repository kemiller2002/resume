const training =
  "Functional Programming, Regular Expressions, Date and Time programming, CQRS, Dependency Injection, Clean Code, Expression Trees, Higher Order Functions, JavaScript Context, Gestalt Design Principles, .NET Optimizations)";

const split = training
  .split(",")
  .map((x) => x.trim())
  .map((x) => `"{x}"`);

console.log(split);
