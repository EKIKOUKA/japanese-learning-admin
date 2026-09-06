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
    getMediaProducts,
    addMediaProduct,
    updateMediaProduct,
    type MediaProduct,
    type MediaProductChanges
} from "@/api/media_products.tsx";
import {useCallback, useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {ChevronLeft, ChevronRight, Pencil, Search, X, Plus} from "lucide-react";
import {Dialog as DialogPrimitive} from "radix-ui";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

const PAGE_SIZE = 10;
type MediaProductDraft = Record<keyof MediaProductChanges, string>;

const toDraft = (mediaProduct: MediaProduct): MediaProductDraft => ({
    title: mediaProduct.title ?? "",
    category: mediaProduct.category,
    details_url: mediaProduct.details_url ?? "",
    memo: mediaProduct.memo ?? ""
});

export function MediaProducts() {
    const [mediaProducts, setMediaProducts] = useState<MediaProduct[]>([]);
    const [categories] = useState([
        {
            key: "drama",
            value: "ドラマ"
        }, {
            key: "anime",
            value: "アニメ"
        }, {
            key: "movie",
            value: "映画"
        }
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [pagination, setPagination] = useState<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});
    const [editingVideo, setEditingVideo] = useState<MediaProduct | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [draft, setDraft] = useState<MediaProductDraft | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadMediaProducts = async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const loadedMediaProducts = await getMediaProducts();
            setMediaProducts(loadedMediaProducts);
        } catch {
            setLoadError("動画の読み込みに失敗しました。もう一度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadMediaProducts();
    }, []);

    useEffect(() => {
        setPagination(current => ({...current, pageIndex: 0}));
    }, [globalFilter, categoryFilter]);

    const startEditing = useCallback((mediaProduct: MediaProduct) => {
        setIsCreating(false);
        setEditingVideo(mediaProduct);
        setDraft(toDraft(mediaProduct));
    }, []);

    const startCreating = () => {
        setEditingVideo(null);
        setDraft({title: "", category: "drama", details_url: "", memo: ""});
        setIsCreating(true);
    };

    const cancelEditing = () => {
        setEditingVideo(null);
        setIsCreating(false);
        setDraft(null);
    };

    const saveEdit = async () => {
        if ((!editingVideo && !isCreating) || !draft) return;

        const title = draft.title.trim();
        if (!title) {
            toast.error("タイトルを入力してください。", {position: "top-center"});
            return;
        }

        if (!draft.category) {
            toast.error("カテゴリを選択してください。", {position: "top-center"});
            return;
        }

        setIsSaving(true);
        try {
            const changes: MediaProductChanges = {
                title,
                category: draft.category,
                details_url: draft.details_url.trim() || null,
                memo: draft.memo.trim() || null
            };

            if (Object.values(changes).some(value => typeof value === "number" && Number.isNaN(value))) {
                toast.error("数値項目に正しい値を入力してください。", {position: "top-center"});
                return;
            }

            if (isCreating) {
                await addMediaProduct(changes);
                await loadMediaProducts();
                toast.success("映像作品を追加しました。", {position: "top-center"});
            } else if (editingVideo) {
                const updatedVideo = await updateMediaProduct(editingVideo.id, changes);
                setMediaProducts(current => current.map(video =>
                    video.id === editingVideo.id ? {...video, ...changes, ...updatedVideo} : video
                ));
                toast.success("動画情報を更新しました。", {position: "top-center"});
            }

            cancelEditing();
        } catch {
            toast.error(isCreating ? "追加に失敗しました。" : "更新に失敗しました。", {position: "top-center"});
        } finally {
            setIsSaving(false);
        }
    };

    const updateDraft = (field: keyof MediaProductDraft, value: string) => {
        setDraft(current => current ? {...current, [field]: value} : current);
    };

    const categoryTitles = useMemo(
        () => new Map(
            categories.map(
                category => [category.key, category.value]
            )
        ),
        [categories]
    );

    const columns = useMemo<ColumnDef<MediaProduct>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({row}) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
        },
        {
            accessorKey: "title",
            header: "タイトル",
            minSize: 460,
            cell: ({row}) => <span className="font-medium text-foreground">{row.original.title}</span>
        },
        {
            accessorKey: "category",
            header: "カテゴリ",
            cell: ({row}) => <span>{categoryTitles.get(row.original.category)}</span>
        },
        {
            accessorKey: "details_url",
            header: "詳細リンク",
            cell: ({row}) => <span>{row.original.details_url}</span>
        },
        {
            accessorKey: "memo",
            header: "メモ",
            cell: ({row}) => <span>{row.original.memo}</span>
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
                    <Button className="cursor-pointer" size="icon-sm" variant="ghost" onClick={() => startEditing(row.original)} aria-label={`${row.original.title} を編集`}>
                        <Pencil />
                    </Button>
                </div>
            )
        }
    ], [categoryTitles, startEditing]);

    const filteredMediaProducts = useMemo(
        () => categoryFilter === "all"
            ? mediaProducts
            : mediaProducts.filter(product => product.category === categoryFilter),
        [categoryFilter, mediaProducts]
    );

    const table = useReactTable({
        data: filteredMediaProducts,
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
                    <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">映像作品リスト</h1>
                    <p className="text-sm text-muted-foreground">動画の検索、タイトル編集、削除ができます。</p>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full sm:w-40">
                            <Select
                                value={categoryFilter}
                                onValueChange={setCategoryFilter}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="カテゴリを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">すべて</SelectItem>
                                    {categories.map(category => (
                                        <SelectItem key={category.key} value={category.key}>{category.value}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative w-full sm:w-60">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-8" placeholder="ID またはタイトルで検索" value={globalFilter} onChange={event => setGlobalFilter(event.target.value)} />
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
                                        <tr><td colSpan={11} className="px-4 py-12 text-center"><p className="mb-3 text-destructive">{loadError}</p><Button variant="outline" onClick={() => void loadMediaProducts()}>再読み込み</Button></td></tr>
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

            <DialogPrimitive.Root open={editingVideo !== null || isCreating} onOpenChange={open => !open && cancelEditing()}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
                    <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover text-popover-foreground shadow-xl outline-none">
                        <form onSubmit={event => { event.preventDefault(); void saveEdit(); }}>
                            <div className="flex items-start justify-between border-b p-5">
                                <div>
                                    <DialogPrimitive.Title className="text-lg font-semibold">{isCreating ? "映像作品を追加" : "映像作品を編集"}</DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                                        {isCreating ? "新しい映像作品の情報を入力してください。" : `ID: ${editingVideo?.id}`}
                                    </DialogPrimitive.Description>
                                </div>
                                <DialogPrimitive.Close asChild>
                                    <Button className="cursor-pointer" type="button" size="icon-sm" variant="ghost" aria-label="閉じる"><X /></Button>
                                </DialogPrimitive.Close>
                            </div>

                            <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                                <label className="space-y-1.5 sm:col-span-1">
                                    <span className="text-sm font-medium">タイトル</span>
                                    <Input type="text" autoFocus={isCreating} value={draft?.title ?? ""} onChange={event => updateDraft("title", event.target.value)} />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium">カテゴリ</span>
                                    <Select
                                        value={draft?.category ?? ""}
                                        onValueChange={value => updateDraft("category", value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="カテゴリを選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category.key} value={category.key}>{category.value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </label>
                                {([
                                    ["details_url", "詳細リンク", "text"],
                                    ["memo", "メモ", "text"]
                                ] as const).map(([field, label, type]) => (
                                    <label key={field} className="space-y-1.5">
                                        <span className="text-sm font-medium">{label}</span>
                                        <Input type={type} value={draft?.[field] ?? ""} onChange={event => updateDraft(field, event.target.value)} />
                                    </label>
                                ))}
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
