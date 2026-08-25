/** CSS Modules: the bundler compiles `.module.css` imports into a class map. */
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
