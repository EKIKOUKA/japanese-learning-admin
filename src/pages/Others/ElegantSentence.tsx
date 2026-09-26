import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
    type PaginationState,
} from "@tanstack/react-table";
import {
    getElegantSentence,
    addElegantSentence,
    updateElegantSentence,
    deleteElegantSentence,
    type ElegantSentence,
    type ElegantSentenceChanges
} from "@/api/Others/elegant_sentence.tsx";
import {useCallback, useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {ChevronLeft, ChevronRight, Pencil, Search, X, Plus, Trash2} from "lucide-react";
import {Dialog as DialogPrimitive} from "radix-ui";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle
} from "@/components/ui/alert-dialog.tsx";

const PAGE_SIZE = 10;
type ElegantSentenceDraft = Record<keyof ElegantSentenceChanges, string>

const toDraft = (
    elegantSentence: ElegantSentence
): ElegantSentenceDraft => ({
    sentence: elegantSentence.sentence ?? ""
});

export function ElegantSentence() {
    const [elegantSentence, setElegantSentence] = useState<ElegantSentence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});
    const [editingItem, setEditingItem] = useState<ElegantSentence | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ElegantSentence | null>(null);
    const [draft, setDraft] = useState<ElegantSentenceDraft | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadElegantSentence = async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const loadedElegantSentence = await getElegantSentence();
            setElegantSentence(loadedElegantSentence);
        } catch {
            setLoadError("データの読み込みに失敗しました。もう一度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        void loadElegantSentence();
    }, []);

    const startEditing = useCallback((mediaProduct: ElegantSentence) => {
        setIsCreating(false);
        setEditingItem(mediaProduct);
        setDraft(toDraft(mediaProduct));
    }, []);

    const startCreating = () => {
        setEditingItem(null);
        setDraft({sentence: ""});
        setIsCreating(true);
    };

    const cancelEditing = () => {
        setEditingItem(null);
        setIsCreating(false);
        setDraft(null);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteElegantSentence(deleteTarget.id);
            await loadElegantSentence();
            toast.success("データを削除しました。", {position: "top-center"});
            setDeleteTarget(null);
        } catch {
            toast.error("削除に失敗しました。", {position: "top-center"});
        } finally {
            setIsDeleting(false);
        }
    };

    const saveEdit = async () => {
        if ((!editingItem && !isCreating) || !draft) return;

        const title = draft.sentence.trim();
        if (!title) {
            toast.error("テキストを入力してください。", {position: "top-center"});
            return;
        }

        setIsSaving(true);
        try {
            const changes: ElegantSentenceChanges = {
                sentence: draft.sentence
            };

            if (isCreating) {
                console.log("changes: ", changes)
                await addElegantSentence(changes);
                await loadElegantSentence();
                toast.success("国語美文を追加しました。", {position: "top-center"});
            } else if (editingItem) {
                const updatedItem = await updateElegantSentence(editingItem.id, changes);
                setElegantSentence(current => current.map(item =>
                    item.id === editingItem.id ? {...item, ...changes, ...updatedItem} : item
                ));
                toast.success("国語美文を更新しました。", {position: "top-center"});
            }

            cancelEditing();
        } catch {
            toast.error(isCreating ? "追加に失敗しました。" : "更新に失敗しました。", {position: "top-center"});
        } finally {
            setIsSaving(false);
        }
    };

    const updateDraft = (field: keyof ElegantSentenceDraft, value: string) => {
        setDraft(current => current ? {...current, [field]: value} : current);
    };

    const columns = useMemo<ColumnDef<ElegantSentence>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({row}) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
        },
        {
            accessorKey: "sentence",
            header: "テキスト",
            minSize: 550,
            cell: ({row}) => <span className="font-medium text-foreground">{row.original.sentence}</span>
        },
        {
            accessorKey: "created_at",
            header: "作成日時",
            cell: ({row}) => <span className="whitespace-nowrap text-muted-foreground">{row.original.created_at}</span>
        },
        {
            id: "actions",
            header: ()=> <div className="span-text-align-center">操作</div>,
            size: 60, minSize: 60, maxSize: 60,
            cell: ({row}) => (
                <div className="flex justify-end gap-1">
                    <Button className="cursor-pointer" size="icon-sm" variant="ghost"
                            onClick={() => startEditing(row.original)} aria-label={`${row.original.sentence} を編集`}>
                        <Pencil />
                    </Button>
                    <Button className="text-destructive hover:text-destructive cursor-pointer" size="icon-sm" variant="ghost"
                            onClick={() => setDeleteTarget(row.original)} aria-label={`${row.original.sentence} を削除`}>
                        <Trash2 />
                    </Button>
                </div>
            )
        }
    ], [startEditing]);

    const table = useReactTable({
        data: elegantSentence,
        columns,
        state: {globalFilter, pagination},
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: "includesString"
    });

    const filteredResultCount = table.getFilteredRowModel().rows.length;
    const firstResult = filteredResultCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const lastResult = Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredResultCount);

    return (
        <div className="w-full p-5 text-left sm:p-8">
            <div className="mx-auto w-full max-w-none space-y-6">
                <div>
                    <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">国語美文リスト</h1>
                    <p className="text-sm text-muted-foreground">国語美文の検索、詳細、削除、編集ができます。</p>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-60">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-8" placeholder="ID またはテキストで検索" value={globalFilter} onChange={event => setGlobalFilter(event.target.value)} />
                        </div>
                        <div className="relative w-full sm:w-10">
                            <Button className="cursor-pointer" size="icon-sm" variant="ghost" onClick={startCreating} aria-label="映像作品を追加">
                                <Plus />
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="text-sm" style={{width: table.getTotalSize(), minWidth: "100%"}}>
                            <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                                {
                                    table.getHeaderGroups().map(headerGroup => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map(header => (
                                                <th
                                                    key={header.id}
                                                    className={`relative px-4 py-3 font-medium whitespace-nowrap ${header.column.id === "actions" ? "sticky right-0 z-20 bg-muted/40 text-right shadow-[-1px_0_0_var(--border)]" : ""}`}
                                                    style={{width: header.getSize()}}
                                                >
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            ))}
                                        </tr>
                                    ))
                                }
                            </thead>
                            <tbody className="divide-y">
                                {
                                    isLoading ? (
                                        <tr><td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">読み込み中…</td></tr>
                                    ) : loadError ? (
                                        <tr><td colSpan={11} className="px-4 py-12 text-center"><p className="mb-3 text-destructive">{loadError}</p><Button variant="outline" onClick={() => void loadElegantSentence()}>再読み込み</Button></td></tr>
                                    ) : table.getRowModel().rows.length === 0 ? (
                                        <tr><td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">該当する動画はありません。</td></tr>
                                    ) : table.getRowModel().rows.map(row => (
                                        <tr key={row.id} className="hover:bg-muted/30">
                                            {row.getVisibleCells().map(cell => (
                                                <td
                                                    key={cell.id}
                                                    className={`px-4 py-3 align-middle ${cell.column.id === "actions" ? "sticky right-0 z-10 bg-card text-right shadow-[-1px_0_0_var(--border)] group-hover:bg-muted/30" : ""}`}
                                                    style={{width: cell.column.getSize()}}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    {
                        !isLoading && !loadError && (
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
                        )
                    }
                </div>
            </div>

            <AlertDialog open={deleteTarget !== null} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive"><Trash2 className="size-5" /></AlertDialogMedia>
                        <AlertDialogTitle>「{deleteTarget?.sentence}」を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>この操作は元に戻せません。</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>キャンセル</AlertDialogCancel>
                        <AlertDialogAction className="cursor-pointer" variant="destructive" disabled={isDeleting}
                           onClick={event => { event.preventDefault(); void confirmDelete(); }}
                        >
                            {isDeleting ? "削除中…" : "削除"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <DialogPrimitive.Root open={editingItem !== null || isCreating} onOpenChange={open => !open && cancelEditing()}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
                    <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover text-popover-foreground shadow-xl outline-none">
                        <form onSubmit={event => { event.preventDefault(); void saveEdit(); }}>
                            <div className="flex items-start justify-between border-b p-5">
                                <div>
                                    <DialogPrimitive.Title className="text-lg font-semibold">{isCreating ? "国語美文を追加" : "国語美文を編集"}</DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                                        {isCreating ? "新しい国語美文の情報を入力してください。" : `ID: ${editingItem?.id}`}
                                    </DialogPrimitive.Description>
                                </div>
                                <DialogPrimitive.Close asChild>
                                    <Button className="cursor-pointer" type="button" size="icon-sm" variant="ghost" aria-label="閉じる"><X /></Button>
                                </DialogPrimitive.Close>
                            </div>

                            <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                                <label className="space-y-1.5 sm:col-span-2">
                                    <span className="text-sm font-medium">テキスト</span>
                                    <textarea className="min-h-18 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                        autoFocus value={draft?.sentence ?? ""} onChange={event => updateDraft("sentence", event.target.value)} />
                                </label>
                            </div>

                            <div className="flex justify-end gap-2 border-t p-4">
                                <DialogPrimitive.Close asChild>
                                    <Button type="button" className="cursor-pointer" variant="outline" disabled={isSaving}>キャンセル</Button>
                                </DialogPrimitive.Close>
                                <Button type="submit" className="cursor-pointer" disabled={isSaving}>
                                    {isSaving ? "保存中…" : isCreating ? "追加" : "保存"}
                                </Button>
                            </div>
                        </form>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    );
}
