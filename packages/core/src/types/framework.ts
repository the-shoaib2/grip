/** Framework source metadata captured at pick time from dev runtime hooks. */
export interface FrameworkContext {
  framework: string;
  file?: string;
  line?: number;
  componentName?: string;
}
