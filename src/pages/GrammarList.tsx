import { getGrammarList, type GrammarItem } from '@/api/grammar_list.tsx'
import {useCallback, useEffect, useMemo, useState} from "react";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    type PaginationState,
    useReactTable
} from "@tanstack/react-table";
import {Dialog as DialogPrimitive} from "radix-ui";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {ChevronLeft, ChevronRight, Pencil} from "lucide-react";

const PAGE_SIZE = 10;

export function GrammarList() {
    const [list, setList] = useState<GrammarItem[]>([]);
    const [selectedLevel, setSelectedLevel] = useState<string>("N1");
    const [editingGrammar, setEditingGrammar] = useState<GrammarItem | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});

    const levelItems = [
        { label: "全部", value: "all" },
        { label: "N1", value: "N1" },
        { label: "N2", value: "N2" },
        { label: "N3", value: "N3" },
        { label: "N4", value: "N4" },
        { label: "N5", value: "N5" },
        { label: "その他", value: "Other" }
    ]

    const handleEdit = useCallback((item: GrammarItem) => {
        console.log(item);
        console.log(selectedLevel)
        setEditingGrammar(item);
    }, []);

    const columns = useMemo<ColumnDef<GrammarItem>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => <span key={row.id}>{row.original.id}</span>,
        }, {
            accessorKey: "level",
            header: "レベル",
            cell: ({ row }) => <span>{row.original.level}</span>,
        }, {
            accessorKey: "title",
            header: "文型",
            cell: ({ row }) => <span>{row.original.title}</span>,
        }, {
            accessorKey: "connection",
            header: "接続",
            minSize: 200,
            cell: ({ row }) => <span>{row.original.connection}</span>,
        }, {
            accessorKey: "meaning",
            header: "説明",
            minSize: 200,
            cell: ({ row }) => <span>{row.original.meaning}</span>,
        }, {
            accessorKey: "examples",
            header: "例文",
            minSize: 500,
            cell: ({ row }) => <span>{row.original.examples}</span>,
        }, {
            accessorKey: "notes",
            header: "メモ",
            cell: ({ row }) => <span>{row.original.notes}</span>,
        }, {
            id: "actions",
            header: () => <div className="span-text-align-center">操作</div>,
            maxSize: 60,
            cell: ({row}) => (
                <div className="flex justify-end gap-1">
                    <Button className="cursor-pointer" size="icon-sm" onClick={() => handleEdit(row.original)}>
                        <Pencil />
                    </Button>
                </div>
            )
        }
    ], [handleEdit]);

    const table = useReactTable({
        data: list,
        columns,
        state: { pagination },
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    })

    const firstResult = list.length === 0 ? 0 :pagination.pageIndex * pagination.pageSize + 1;
    const lastResult = Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getFilteredRowModel().rows.length);

    useEffect(() => {
        getGrammarList().then(res => {
            console.log(res);
            setList(res);
        });
    }, [])

    return (
        <div className="w-full p-5 text-left sm:p-8">
            <div className="mx-auto w-full max-w-none space-y-6">
                <div>
                    <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">文法リスト</h1>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 boarder-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">全 {list.length} 件</p>
                        <div className="relative w-full sm:w-80">
                            {/*items={levelItems}*/}
                            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                <SelectTrigger className="w-full max-w-48">
                                    <SelectValue placeholder="文法ラベル" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        {levelItems.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="text-sm" style={{width: table.getTotalSize(), minWidth: "100%"}}>
                            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                                {
                                    table.getHeaderGroups().map((group) => (
                                        <tr key={group.id}>
                                            {
                                                group.headers.map((header) => (
                                                    <th
                                                        key={header.id}
                                                        className={`relative px-4 py-3 font-medium whitespace-nowrap ${header.column.id === "actions" ? "sticky right-0 z-20 bg-muted/40 text-right shadow-[-1px_0_0_var(--border)]" : ""}`}
                                                        style={{width: header.getSize()}}
                                                    >
                                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))
                                            }
                                        </tr>
                                    ))
                                }
                            </thead>
                            <tbody className="divide-y">
                                {
                                    table.getRowModel().rows.map(row => (
                                        <tr key={row.id} className="hover:bg-muted/30">
                                            {
                                                row.getVisibleCells().map(cell => (
                                                    <td
                                                        key={cell.id}
                                                        className={`px-4 py-3 align-middle ${cell.column.id === "actions" ? "sticky right-0 z-10 bg-card text-right shadow-[-1px_0_0_var(--border)] group-hover:bg-muted/30" : ""}`}
                                                        style={{width: cell.column.getSize()}}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </td>
                                                ))
                                            }
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-muted-foreground">
                            {firstResult}–{lastResult} / {table.getFilteredRowModel().rows.length} 件
                        </span>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="cursor-pointer"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            ><ChevronLeft /> 前へ</Button>
                            <span className="min-w-16 text-center text-muted-foreground">
                                {table.getState().pagination.pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
                            </span>
                            <Button size="sm" variant="outline" className="cursor-pointer"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >次へ <ChevronRight />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <DialogPrimitive.Root open={editingGrammar !== null}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay />
                    <DialogPrimitive.Content>
                        <form>
                            <div>
                                {([
                                    ["playlist_id", "プレイリスト ID", "text"],
                                    ["status", "ステータス", "text"],
                                ] as const).map(([field, label, type]) => (
                                    <label key={field}>
                                        <span>{label}</span>
                                        <Input type={type} />
                                    </label>
                                ))}
                            </div>
                        </form>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    )
}