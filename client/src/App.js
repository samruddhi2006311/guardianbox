import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import DownloadPage from './pages/DownloadPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page → Upload Page */}
        <Route path="/" element={<UploadPage />} />

        {/* Download page → when recipient opens link */}
        <Route path="/file/:id" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
