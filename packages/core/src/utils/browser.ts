export function mergeCSSClasses(...classes: string[]) {
  return classes.filter((c) => c).join(' ');
}
