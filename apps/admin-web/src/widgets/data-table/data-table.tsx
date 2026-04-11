import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
  getRowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | null;
};

export const DataTable = <T,>({
  columns,
  data,
  getRowKey,
  onRowClick,
  selectedRowKey
}: DataTableProps<T>) => (
  <div className="data-table">
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const rowKey = getRowKey?.(row, index) ?? String(index);
          return (
            <tr
              key={rowKey}
              className={`${onRowClick ? "is-clickable" : ""} ${selectedRowKey === rowKey ? "is-selected" : ""}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
