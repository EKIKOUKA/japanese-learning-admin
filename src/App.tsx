import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { Dashboard } from "./pages/Dashboard.tsx";
import { MainLayout } from "@/layouts/MainLayout.tsx";
import { Videos } from "@/pages/Shadowing/Videos.tsx";
import { PlaylistCategories } from "@/pages/Shadowing/PlaylistCategories.tsx";
import { PracticeRecord } from "@/pages/Shadowing/PracticeRecord.tsx";
import { SkipWordsList } from "@/pages/Shadowing/SkipWordsList.tsx";
import { PlaylistLists } from "@/pages/Shadowing/PlaylistLists.tsx";
import { GrammarList } from "@/pages/GrammarList.tsx";
import { ElegantSentence } from "@/pages/Others/ElegantSentence.tsx";
import { MediaProducts } from "@/pages/Others/MediaProducts.tsx";
import { ShinaNoneKanjiWord } from "@/pages/Others/ShinaNoneKanjiWord.tsx";
import { MemoryHardWord } from "@/pages/Others/MemoryHardWord.tsx";
import { Idioms } from "@/pages/Others/Idioms.tsx";
import { SampleRubyWord } from "@/pages/Others/SampleRubyWord.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout />} >
                    <Route index element={<Dashboard />} />
                    <Route path="shadowing/videos" element={<Videos />} />
                    <Route path="shadowing/playlist_category" element={<PlaylistCategories />} />
                    <Route path="shadowing/playlist_list" element={<PlaylistLists />} />
                    <Route path="shadowing/practice_record" element={<PracticeRecord />} />
                    <Route path="shadowing/skip_words_list" element={<SkipWordsList />} />
                    <Route path="grammar_list" element={<GrammarList />} />
                    <Route path="others/elegant_sentence" element={<ElegantSentence />} />
                    <Route path="others/media_products" element={<MediaProducts />} />
                    <Route path="others/shina_none_kanji_word" element={<ShinaNoneKanjiWord />} />
                    <Route path="others/memory_hard_word" element={<MemoryHardWord />} />
                    <Route path="others/idioms" element={<Idioms />} />
                    <Route path="others/sample_ruby_word" element={<SampleRubyWord />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
