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
    deleteVideo,
    getPlaylistCategories,
    getVideos,
    updateVideo,
    type PlaylistCategory,
    type Video,
    type VideoChanges
} from "@/api/videos.tsx";
import {useCallback, useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {ChevronLeft, ChevronRight, Pencil, Search, Trash2, X} from "lucide-react";
import {Dialog as DialogPrimitive} from "radix-ui";
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE_SIZE = 10;

type VideoDraft = Record<keyof VideoChanges, string>;

const toDraft = (video: Video): VideoDraft => ({
    title: video.title ?? "",
    current_time: String(video.current_time),
    rate: String(video.rate),
    category_id: video.category_id ?? "",
    playlist_id: video.playlist_id ?? "",
    status: video.status,
    content_language: video.content_language,
    aspect_ratio: String(video.aspect_ratio)
});

export function Videos() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [categories, setCategories] = useState<PlaylistCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [draft, setDraft] = useState<VideoDraft | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Video | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadVideos = async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const [loadedVideos, loadedCategories] = await Promise.all([getVideos(), getPlaylistCategories()]);
            setVideos(loadedVideos);
            setCategories(loadedCategories);
        } catch {
            setLoadError("動画の読み込みに失敗しました。もう一度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadVideos();
    }, []);

    useEffect(() => {
        setPagination(current => ({...current, pageIndex: 0}));
    }, [globalFilter]);

    const startEditing = useCallback((video: Video) => {
        setEditingVideo(video);
        setDraft(toDraft(video));
    }, []);

    const cancelEditing = () => {
        setEditingVideo(null);
        setDraft(null);
    };

    const saveEdit = async () => {
        if (!editingVideo || !draft) return;

        const title = draft.title.trim();
        if (!title) {
            toast.error("タイトルを入力してください。", {position: "top-center"});
            return;
        }

        setIsSaving(true);
        try {
            const changes: VideoChanges = {
                title,
                current_time: Number(draft.current_time),
                rate: Number(draft.rate),
                category_id: draft.category_id,
                playlist_id: draft.playlist_id.trim() || null,
                status: draft.status.trim(),
                content_language: draft.content_language.trim(),
                aspect_ratio: Number(draft.aspect_ratio)
            };
            if (Object.values(changes).some(value => typeof value === "number" && Number.isNaN(value))) {
                toast.error("数値項目に正しい値を入力してください。", {position: "top-center"});
                return;
            }
            const updatedVideo = await updateVideo(editingVideo.id, changes);
            setVideos(current => current.map(video =>
                video.id === editingVideo.id ? {...video, ...changes, ...updatedVideo} : video
            ));
            toast.success("動画情報を更新しました。", {position: "top-center"});
            cancelEditing();
        } catch {
            toast.error("更新に失敗しました。", {position: "top-center"});
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteVideo(deleteTarget.id);
            setVideos(current => current.filter(video => video.id !== deleteTarget.id));
            toast.success("動画を削除しました。", {position: "top-center"});
            setDeleteTarget(null);
        } catch {
            toast.error("削除に失敗しました。", {position: "top-center"});
        } finally {
            setIsDeleting(false);
        }
    };

    const updateDraft = (field: keyof VideoDraft, value: string) => {
        setDraft(current => current ? {...current, [field]: value} : current);
    };

    const categoryTitles = useMemo(
        () => new Map(categories.map(category => [category.id, category.title])),
        [categories]
    );

    const columns = useMemo<ColumnDef<Video>[]>(() => [
        {
            accessorKey: "id",
            header: "ID",
            cell: ({row}) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>,
        },
        {
            accessorKey: "title",
            header: "タイトル",
            minSize: 460,
            cell: ({row}) => <span className="font-medium text-foreground">{row.original.title}</span>,
        },
        {
            accessorKey: "current_time",
            header: "再生位置",
            cell: ({row}) => <span>{row.original.current_time}</span>,
        },
        {
            accessorKey: "rate",
            header: "速度",
            cell: ({row}) => <span>{row.original.rate}</span>,
        },
        {
            accessorKey: "aspect_ratio",
            header: "画面比率",
            cell: ({row}) => <span>{row.original.aspect_ratio}</span>,
        },
        {
            accessorKey: "content_language",
            header: "言語",
            cell: ({row}) => <span>{row.original.content_language}</span>,
        },
        {
            accessorKey: "status",
            header: "ステータス",
            cell: ({row}) => <span>{row.original.status}</span>,
        },
        {
            accessorKey: "category_id",
            header: "カテゴリ",
            minSize: 180,
            cell: ({row}) => <span>{categoryTitles.get(row.original.category_id) ?? row.original.category_id}</span>,
        },
        {
            accessorKey: "playlist_id",
            header: "プレイリスト ID",
            cell: ({row}) => <span>{row.original.playlist_id}</span>,
        },
        {
            accessorKey: "created_at",
            header: "作成日時",
            cell: ({row}) => <span className="whitespace-nowrap text-muted-foreground">{row.original.created_at}</span>,
        },
        {
            id: "actions",
            header: ()=> <div className="span-text-align-center">操作</div>,
            size: 112, minSize: 112, maxSize: 112,
            cell: ({row}) => (
                <div className="flex justify-end gap-1">
                    <Button className="cursor-pointer" size="icon-sm" variant="ghost" onClick={() => startEditing(row.original)} aria-label={`${row.original.title} を編集`}>
                        <Pencil />
                    </Button>
                    <Button size="icon-sm" variant="ghost" className="cursor-pointer text-destructive hover:text-destructive" onClick={() => setDeleteTarget(row.original)} aria-label={`${row.original.title} を削除`}>
                        <Trash2 />
                    </Button>
                </div>
            )
        }
    ], [categoryTitles, startEditing]);

    const table = useReactTable({
        data: videos,
        columns,
        state: {globalFilter, pagination},
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: "includesString"
    });

    const firstResult = videos.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
    const lastResult = Math.min((pagination.pageIndex + 1) * pagination.pageSize, table.getFilteredRowModel().rows.length);

    return (
        <div className="w-full p-5 text-left sm:p-8">
            <div className="mx-auto w-full max-w-none space-y-6">
                <div>
                    <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">動画リスト</h1>
                    <p className="text-sm text-muted-foreground">動画の検索、タイトル編集、削除ができます。</p>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">全 {videos.length} 件</p>
                        <div className="relative w-full sm:w-80">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-8" placeholder="ID またはタイトルで検索" value={globalFilter} onChange={event => setGlobalFilter(event.target.value)} />
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
                                        <tr><td colSpan={11} className="px-4 py-12 text-center"><p className="mb-3 text-destructive">{loadError}</p><Button variant="outline" onClick={() => void loadVideos()}>再読み込み</Button></td></tr>
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
                        <AlertDialogTitle>「{deleteTarget?.title}」を削除しますか？</AlertDialogTitle>
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

            <DialogPrimitive.Root open={editingVideo !== null} onOpenChange={open => !open && cancelEditing()}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
                    <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-popover text-popover-foreground shadow-xl outline-none">
                        <form onSubmit={event => { event.preventDefault(); void saveEdit(); }}>
                            <div className="flex items-start justify-between border-b p-5">
                                <div>
                                    <DialogPrimitive.Title className="text-lg font-semibold">動画を編集</DialogPrimitive.Title>
                                    <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">ID: {editingVideo?.id}</DialogPrimitive.Description>
                                </div>
                                <DialogPrimitive.Close asChild>
                                    <Button className="cursor-pointer" type="button" size="icon-sm" variant="ghost" aria-label="閉じる"><X /></Button>
                                </DialogPrimitive.Close>
                            </div>

                            <div className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                                <label className="space-y-1.5 sm:col-span-2">
                                    <span className="text-sm font-medium">タイトル</span>
                                    <textarea
                                        className="min-h-12 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                        value={draft?.title ?? ""}
                                        onChange={event => updateDraft("title", event.target.value)}
                                        autoFocus
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-sm font-medium">カテゴリ</span>
                                    <Select
                                        value={draft?.category_id ?? ""}
                                        onValueChange={value => updateDraft("category_id", value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="カテゴリを選択" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category.id} value={category.id}>{category.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </label>
                                {([
                                    ["playlist_id", "プレイリスト ID", "text"],
                                    ["status", "ステータス", "text"],
                                    ["content_language", "言語", "text"],
                                    ["current_time", "再生位置", "number"],
                                    ["rate", "速度", "number"],
                                    ["aspect_ratio", "画面比率", "number"],
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
                                    {isSaving ? "保存中…" : "保存"}
                                </Button>
                            </div>
                        </form>
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </div>
    );
}
