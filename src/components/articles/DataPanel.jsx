/**
 * 文章内嵌数据面板（MDX 直接 import 使用）。
 * 图表库选型后，在此组件内挂接真实交互图表；现阶段作为多媒体管线占位。
 */
export default function DataPanel({ title = '数据面板', children }) {
  return (
    <figure className="data-panel">
      <figcaption>{title}</figcaption>
      <div className="data-panel-body">
        {children ?? '图表组件占位：图表库选型后在此内嵌交互图表。'}
      </div>
    </figure>
  );
}
