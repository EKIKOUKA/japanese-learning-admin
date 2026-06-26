import {addSkipWords, deleteSkipWords, getSkipWords} from "@/api/skip_words.tsx";
import {useEffect, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input.tsx";
import {Button} from "@/components/ui/button.tsx";
import {toast} from "sonner"

import {Trash2Icon} from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"

export const SkipWordsList = () => {
    type SkipWordsType = "skipWithPreviousLines" | "skipOnlyCurrentLine";

    type SkipWordsResponse = {
        skipWithPreviousLines: string[],
        skipOnlyCurrentLine: string[]
    }
    const [skipWords, setSkipWords] = useState<SkipWordsResponse>({
        skipWithPreviousLines: [],
        skipOnlyCurrentLine: []
    })
    const [inputs, setInputs] = useState<Record<SkipWordsType, string>>({
        skipWithPreviousLines: "",
        skipOnlyCurrentLine: ""
    })
    type DeleteTarget = {
        type: SkipWordsType;
        word: string;
    };
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

    const handleAddWord = async (type: SkipWordsType) => {
        const word = inputs[type].trim();
        if (!word) {
            toast.error("入力してください", { position: "top-center" })
            return;
        }

        if (skipWords[type].includes(word)) {
            toast.error(`【${word}】はもう存在しています`, { position: "top-center" })
        } else {
            await addSkipWords(type, word);

            setSkipWords(prev => ({
                ...prev,
                [type]: [...prev[type], word]
            }))

            setInputs(prev => ({
                ...prev,
                [type]: ""
            }))
        }
    }

    const openDeleteDialog = (type: SkipWordsType, word: string) => {
        console.log(type, word)
        setDeleteTarget({type, word})
    }

    const handleDeleteSkipWord = async() => {
        if (!deleteTarget) return;
        console.log(deleteTarget)

        setSkipWords(prev => ({
            ...prev,
            [deleteTarget.type]: prev[deleteTarget.type].filter(
                item => item !== deleteTarget.word
            )
        }))

        await deleteSkipWords(deleteTarget.type, deleteTarget.word)

        setDeleteTarget(null)
    }

    useEffect(() => {
        getSkipWords().then(res => {
            console.log(res);
            setSkipWords(res);
        });
    }, [])


    const renderSection = (
        type: SkipWordsType,
        title: string
    )=> (
        <div className="space-y-3 rounded-lg border p-4">
            <h2 className="font-semibold">{title}</h2>

            <div className="flex flex-wrap gap-2">
                {skipWords[type].map(item => (
                    <Badge key={item} className="gap-2" variant="outline">
                        <span>{item}</span>
                        <button className="m1-2 cursor-pointer" onClick={() => {
                            openDeleteDialog(type, item)
                        }}>
                            <Trash2Icon className="size-3 text-destructive" />
                        </button>
                    </Badge>
                ))}
            </div>

            <div className="flex gap-2">
                <Input value={inputs[type]}
                        onChange={e =>
                            setInputs(prev => ({
                                ...prev,
                                [type]: e.target.value
                            }))
                        }
                />
                <Button onClick={() => handleAddWord(type)}>追加</Button>
            </div>
        </div>
    )

    return (
        <>
            <h1>スキップ単語リスト</h1>
            <div className="space-y-6">
                {renderSection(
                    "skipWithPreviousLines",
                    "skipWithPreviousLines"
                )}

                {renderSection(
                    "skipOnlyCurrentLine",
                    "skipOnlyCurrentLine"
                )}

                <AlertDialog open={deleteTarget !== null} onOpenChange={open => {
                    if (!open) setDeleteTarget(null)
                }}>
                    <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                            <AlertDialogMedia className="bg-destructive/10 text-destructive">
                                <Trash2Icon className="size-5 text-destructive" />
                            </AlertDialogMedia>

                            <AlertDialogTitle>【{deleteTarget?.word}】を削除しますか?</AlertDialogTitle>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel variant="outline">キャンセル</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={handleDeleteSkipWord}>削除</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    )
}
