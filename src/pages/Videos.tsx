import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { getVideos } from "../api/videos.tsx";
import { useEffect, useState } from "react";

type Videos = {
    id: string;
    title: string;
}
export function Videos() {
    const columns = [
        {
            id: 'First Name',
            title: 'firstName',
        },
        {
            header: 'Last Name',
            accessorKey: 'lastName',
        },
        {
            header: 'Age',
            accessorKey: 'age',
        },
    ]

    const [videos, setVideos] = useState<Videos[]>([
        {
            "id": "Tanner",
            "title": "Linsley"
        },
        {
            "id": "Kevin",
            "title": "Vandy"
        }
    ]);
    const table = useReactTable({
        data: videos,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    useEffect(() => {
        getVideos().then(setVideos)
    }, [])

    return (
        <>
            <table>
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
            </table>
        </>
    );
}