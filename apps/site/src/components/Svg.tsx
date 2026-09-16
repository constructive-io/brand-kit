/** Inline an SVG document string. Only ever fed output from @constructive-io/brand-svg. */
export function Svg({ markup, className }: { markup: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: markup }} />;
}
