import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { getVideos } from "@/api/videos.tsx";
import { useEffect, useState } from "react";

type Videos = {
    id: string;
    title: string;
}
export function Videos() {
    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
            colSpan: 1
        },
        {
            accessorKey: 'title',
            header: 'タイトル',
            colSpan: 5
        }
    ]

    const [videos, setVideos] = useState<Videos[]>([]);
    const table = useReactTable({
        data: videos,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    useEffect(() => {
        getVideos().then(res => {
            setVideos(res)
        });
    }, [])

    return (
        <>
            <h1>動画リスト</h1>
            <table>
                <thead>
                    {table.getHeaderGroups().map(row => (
                        <tr key={row.id}>
                            {row.headers.map(header => (
                                <th key={header.id}>
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}