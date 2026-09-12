import {getGrammarList, updateGrammar, type GrammarItem} from '@/api/grammar_list.tsx'
import {useCallback, useEffect, useMemo, useState} from "react";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel, getFilteredRowModel,
    getPaginationRowModel,
    type PaginationState,
    useReactTable
} from "@tanstack/react-table";
import {Dialog as DialogPrimitive} from "radix-ui";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import {toast} from "sonner";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {ChevronLeft, ChevronRight, Pencil, Search, X} from "lucide-react";

const PAGE_SIZE = 10;

export function GrammarList() {
    const [list, setList] = useState<GrammarItem[]>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedLevel, setSelectedLevel] = useState<string>("N1");
    const [editingGrammar, setEditingGrammar] = useState<GrammarItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLevelSelectOpen, setIsLevelSelectOpen] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});

    const levelItems = [
        { label: "N1", value: "N1" },
        { label: "N2", value: "N2" },
        { label: "N3", value: "N3" },
        { label: "N4", value: "N4" },
        { label: "N5", value: "N5" },
        { label: "その他", value: "Others" }
    ]

    const handleEdit = useCallback((item: GrammarItem) => {
        setEditingGrammar(item);
    }, []);

    const updateEditingGrammar = (field: keyof GrammarItem, value: string | number) => {
        setEditingGrammar(current => current ? {...current, [field]: value} : current);
    };

    const saveGrammar = async () => {
        if (!editingGrammar) return;

        setIsSaving(true);
        try {
            await updateGrammar(editingGrammar);
            setList(current => current.map(item =>
                item.id === editingGrammar.id ? editingGrammar : item
            ));
            toast.success("文法情報を更新しました。", {position: "top-center"});
            setEditingGrammar(null);
        } catch {
            toast.error("更新に失敗しました。", {position: "top-center"});
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        setPagination(current => ({...current, pageIndex: 0}));
    }, [globalFilter]);

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
            accessorKey: "meaning",
            header: "説明",
            minSize: 200,
            cell: ({ row }) => <span className="whitespace-pre-wrap break-words">{row.original.meaning}</span>,
        }, {
            accessorKey: "connection",
            header: "接続",
            minSize: 200,
            cell: ({ row }) => <span className="whitespace-pre-wrap break-words">{row.original.connection}</span>,
        },  {
            accessorKey: "examples",
            header: "例文",
            minSize: 500,
            cell: ({ row }) => <span className="whitespace-pre-wrap break-words">{row.original.examples}</span>,
        }, {
            accessorKey: "notes",
            header: "メモ",
            cell: ({ row }) => <span className="whitespace-pre-wrap break-words">{row.original.notes}</span>,
        },  {
            accessorKey: "is_important",
            header: "重要",
            cell: ({ row }) => <Switch checked={row.original.is_important === 1} disabled aria-label="重要" />,
        },  {
            accessorKey: "is_marked",
            header: "マーク",
            cell: ({ row }) => <Switch checked={row.original.is_marked === 1} disabled aria-label="マーク" />,
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
        state: { globalFilter, pagination },
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: "includesString"
    })

    const firstResult = list.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const lastResult = Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getFilteredRowModel().rows.length);

    useEffect(() => {
        getGrammarList(selectedLevel).then(res => {
            setList(res);
        });
    }, [selectedLevel])

    return (
        <div className="w-full p-5 text-left sm:p-8">
            <div className="mx-auto w-full max-w-none space-y-6">
                <div>
                    <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">文法リスト</h1>
                    <p className="text-sm text-muted-foreground">文法の検索、詳細編集ができます。</p>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 boarder-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-80">
                            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                <SelectTrigger className="w-full max-w-48">
                                    <SelectValue placeholder="文法ラベル" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem key="All" value="All">全部</SelectItem>
                                        {levelItems.map((item) => (
                                            <SelectItem key={item.value} value={item.value}>
                                                {item.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative w-full sm:w-60">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-8" placeholder="ID またはタイトルで検索" value={globalFilter} onChange={event => setGlobalFilter(event.target.value)} />
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

            <DialogPrimitive.Root
                open={editingGrammar !== null}
                onOpenChange={open => !open && setEditingGrammar(null)}
            >
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
                    <DialogPrimitive.Content
                        className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover text-popover-foreground shadow-xl outline-none"
                        onInteractOutside={event => {
                            if (isLevelSelectOpen) event.preventDefault();
                        }}
                    >
                        <form onSubmit={event => { event.preventDefault(); void saveGrammar(); }}>
                            <div className="flex items-start justify-between border-b p-5">
                                <div>
                                    <DialogPrimitive.Title className="text-lg font-semibold">文法を編集</DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                                        ID: {editingGrammar?.id}
                                    </DialogPrimitive.Description>
                                </div>
                                <DialogPrimitive.Close asChild>
                                    <Button type="button" size="icon-sm" variant="ghost" className="cursor-pointer" aria-label="閉じる">
                                        <X />
                                    </Button>
                                </DialogPrimitive.Close>
                            </div>
                            <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium">レベル</span>
                                    <Select
                                        value={editingGrammar?.level ?? ""}
                                        onValueChange={value => updateEditingGrammar("level", value)}
                                        onOpenChange={setIsLevelSelectOpen}
                                    >
                                        <SelectTrigger className="w-full">
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
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium">文型</span>
                                    <Input
                                        value={editingGrammar?.title ?? ""}
                                        onChange={event => updateEditingGrammar("title", event.target.value)}
                                    />
                                </label>
                                {([
                                    ["connection", "接続"],
                                    ["meaning", "説明"],
                                ] as const).map(([field, label]) => (
                                    <label key={field} className="space-y-1.5 sm:col-span-2">
                                        <span className="text-sm font-medium">{label}</span>
                                        <textarea
                                            className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                            value={editingGrammar?.[field] ?? ""}
                                            onChange={event => updateEditingGrammar(field, event.target.value)}
                                        />
                                    </label>
                                ))}
                                <label className="space-y-1.5 sm:col-span-2">
                                    <span className="text-sm font-medium">例文</span>
                                    <textarea
                                        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-44 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                        value={editingGrammar?.examples ?? ""}
                                        onChange={event => updateEditingGrammar("examples", event.target.value)}
                                    />
                                </label>
                                <label className="space-y-1.5 sm:col-span-2">
                                    <span className="text-sm font-medium">メモ</span>
                                    <textarea
                                        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-10 w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                                        value={editingGrammar?.notes ?? ""}
                                        onChange={event => updateEditingGrammar("notes", event.target.value)}
                                    />
                                </label>
                                <label className="space-y-1.5 flex cursor-pointer items-center gap-3">
                                    <span className="text-sm font-medium">重要</span>
                                    <Switch checked={editingGrammar?.is_important === 1}
                                        onCheckedChange={checked => updateEditingGrammar("is_important", checked ? 1 : 0)}
                                    />
                                </label>
                                <label className="space-y-1.5 flex cursor-pointer items-center gap-3">
                                    <span className="text-sm font-medium">マーク</span>
                                    <Switch checked={editingGrammar?.is_marked === 1}
                                        onCheckedChange={checked => updateEditingGrammar("is_marked", checked ? 1 : 0)}
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 border-t p-4">
                                <DialogPrimitive.Close asChild>
                                    <Button type="button" variant="outline" className="cursor-pointer" disabled={isSaving}>キャンセル</Button>
                                </DialogPrimitive.Close>
                                <Button type="submit" className="cursor-pointer" disabled={isSaving}>
                                    {isSaving ? "保存中…" : "保存"}
                                </Button>
                            </div>
                        </form>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    )
}
