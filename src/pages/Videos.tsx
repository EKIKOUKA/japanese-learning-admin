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
            header: 'First Name',
            accessorKey: 'firstName',
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
            "firstName": "Tanner",
            "lastName": "Linsley",
            "age": 33,
            "visits": 100,
            "progress": 50,
            "status": "Married"
        },
        {
            "firstName": "Kevin",
            "lastName": "Vandy",
            "age": 27,
            "visits": 200,
            "progress": 100,
            "status": "Single"
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