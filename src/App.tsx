import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import { Dashboard } from "./pages/Dashboard.tsx";
import { MainLayout } from "@/layouts/MainLayout.tsx";
import { Videos } from "@/pages/Videos.tsx";
import { SkipWordsList } from "@/pages/SkipWordsList.tsx";
import { GrammarList } from "@/pages/GrammarList.tsx";
import { Idioms } from "@/pages/Idioms.tsx";
import { MediaProducts } from "@/pages/MediaProducts.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainLayout />} >
                    <Route index element={<Dashboard />} />
                    <Route path="shadowing/videos" element={<Videos />} />
                    <Route path="shadowing/category" element={<Videos />} />
                    <Route path="shadowing/playlist" element={<Videos />} />
                    <Route path="shadowing/skip_words_list" element={<SkipWordsList />} />
                    <Route path="grammar_list" element={<GrammarList />} />
                    <Route path="others/idioms" element={<Idioms />} />
                    <Route path="others/media_products" element={<MediaProducts />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
