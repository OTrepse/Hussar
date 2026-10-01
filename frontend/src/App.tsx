import {
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import PronunciationPage from "./pages/pronunciation_page";

//APP IS NOW A ROUTER SON
export default function App() {
    return (
        <Routes>
            {/*Default Route*/}
            <Route path="/" element={<Navigate to="/practice" replace/>} />
            {/*Practice Route*/}
            <Route path="/practice" element={<PronunciationPage />} />
        </Routes>
    );
}