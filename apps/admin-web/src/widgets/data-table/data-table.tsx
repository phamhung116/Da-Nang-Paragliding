import type { ReactNode } from "react";

type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  data: T[];
};

export const DataTable = <T,>({ columns, data }: DataTableProps<T>) => (
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
        {data.map((row, index) => (
          <tr key={index}>
            {columns.map((column) => (
              <td key={column.key}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
